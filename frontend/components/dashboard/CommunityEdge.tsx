"use client";
import { useState, useRef, useEffect } from "react";
import { Card } from "../ui/card";
import { communityProposals } from "../../lib/mock";
import { useT } from "../../lib/i18n";
import { ThumbsUp, MessageCircle, Share2, TrendingUp, Zap, Award, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CommunityEdge() {
  const [proposals, setProposals] = useState(communityProposals);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '', approach: '' });
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const t = useT();

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 460;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const upvote = (id: string) => {
    setProposals((p) => p.map((pr) => (pr.id === id ? { ...pr, votes: pr.votes + 1 } : pr)));
  };

  const addComment = (id: string, text: string) => {
    setProposals((p) => p.map((pr) => (pr.id === id ? { ...pr, comments: [...pr.comments, { author: 'you', text }] } : pr)));
  };

  const submitIdea = () => {
    if (!form.title.trim() || !form.summary.trim()) return;
    const newIdea = {
      id: Date.now().toString(),
      title: form.title,
      author: 'you',
      summary: form.summary,
      votes: 0,
      comments: [],
      approach: form.approach || 'general',
      created_at: Date.now(),
    };
    setProposals([newIdea, ...proposals]);
    setForm({ title: '', summary: '', approach: '' });
    setShowForm(false);
  };

  const sortedProposals = [...proposals].sort((a, b) => b.votes - a.votes);

  return (
    <div className="space-y-8">
      {/* Header with CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-6 backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Community Edge
              </h2>
            </div>
            <p className="text-sm text-gray-400 max-w-lg">
              Share and discover collective trading ideas, peer-reviewed setups, and unique approaches from fellow traders
            </p>
          </div>
          <motion.button
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
          >
            <Plus size={18} />
            {t('new_idea')}
          </motion.button>
        </div>
      </motion.div>

      {/* New Idea Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="relative overflow-hidden rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-6 backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-cyan-300">💡 Submit Your Trading Idea</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 hover:bg-cyan-500/20 rounded transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Idea Title
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-black/40 text-white rounded-lg border border-cyan-500/20 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="e.g., Breakout strategy with volume confirmation"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Summary
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 bg-black/40 text-white rounded-lg border border-cyan-500/20 focus:border-cyan-500/50 focus:outline-none transition-colors resize-none h-24"
                    placeholder="Describe your trading approach..."
                    value={form.summary}
                    onChange={e => setForm({ ...form, summary: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Strategy Type
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-black/40 text-white rounded-lg border border-cyan-500/20 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="e.g., Momentum, Mean Reversion, Smart Money"
                    value={form.approach}
                    onChange={e => setForm({ ...form, approach: e.target.value })}
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submitIdea}
                  className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-bold text-white transition-all shadow-lg shadow-cyan-500/20"
                >
                  Publish Idea
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trending Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-bold text-gray-200">Top Community Ideas</h3>
          <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2.5 py-1 rounded-full font-semibold">
            Most Upvoted
          </span>
        </div>

        <div className="relative group">
          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
            style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {sortedProposals.slice(0, 8).map((pr: any, idx: number) => (
              <motion.div
                key={pr.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex-shrink-0 w-96"
              >
                <ProposalCard
                  proposal={pr}
                  onUpvote={() => upvote(pr.id)}
                  onSelect={() => setSelectedProposal(pr.id)}
                  isSelected={selectedProposal === pr.id}
                />
              </motion.div>
            ))}
          </div>

          {/* Scroll Controls */}
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/80 hover:bg-black rounded-r-lg border border-gray-700 transition-colors"
            >
              ← 
            </motion.button>
          )}
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/80 hover:bg-black rounded-l-lg border border-gray-700 transition-colors"
            >
              →
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Selected Proposal Detail */}
      <AnimatePresence>
        {selectedProposal && (
          <ProposalDetail
            proposal={proposals.find(p => p.id === selectedProposal)}
            onClose={() => setSelectedProposal(null)}
            onUpvote={() => upvote(selectedProposal)}
            onComment={(text: string) => addComment(selectedProposal, text)}
          />
        )}
      </AnimatePresence>

      {/* All Proposals Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-gray-200">All Proposals</h3>
          <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full font-semibold">
            {proposals.length}
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((pr: any, idx: number) => (
            <motion.div
              key={pr.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <div
                onClick={() => setSelectedProposal(pr.id)}
                className="h-full rounded-lg border border-gray-700 bg-gray-900/50 hover:border-gray-600 p-4 cursor-pointer transition-all hover:bg-gray-800/50 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-white group-hover:text-cyan-300 transition-colors flex-1">
                    {pr.title}
                  </h4>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="flex-shrink-0 text-lg font-bold text-emerald-400"
                  >
                    ↑ {pr.votes}
                  </motion.div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                  <span>{pr.author}</span>
                  <span>•</span>
                  <span className="px-2 py-1 rounded-full bg-gray-800 text-gray-300">{pr.approach}</span>
                </div>

                <p className="text-sm text-gray-300 mb-4 line-clamp-2">{pr.summary}</p>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      upvote(pr.id);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors group/upvote"
                  >
                    <ThumbsUp size={14} className="group-hover/upvote:scale-110 transition-transform" />
                    Upvote
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProposal(pr.id);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition-colors"
                  >
                    <MessageCircle size={14} />
                    ({pr.comments.length})
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProposalCard({ proposal, onUpvote, onSelect, isSelected }: any) {
  const topComments = proposal.comments.slice(0, 2);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`h-full rounded-lg border transition-all cursor-pointer group overflow-hidden ${
        isSelected
          ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
          : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
      }`}
      onClick={onSelect}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="relative p-4 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 text-sm">
              {proposal.title}
            </h4>
          </div>
          <motion.div
            whileHover={{ scale: 1.2 }}
            className="text-xl font-bold text-emerald-400 flex-shrink-0 ml-2"
          >
            {proposal.votes}
            <div className="text-xs text-gray-400">↑</div>
          </motion.div>
        </div>

        <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-gray-600" />
          <span>{proposal.author}</span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{proposal.approach}</span>
        </div>

        <p className="text-sm text-gray-300 mb-4 flex-1 line-clamp-2">{proposal.summary}</p>

        <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onUpvote();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold transition-colors group/upvote flex-1 justify-center"
          >
            <ThumbsUp size={14} className="group-hover/upvote:scale-110 transition-transform" />
            Upvote
          </motion.button>
          
          <div className="text-xs text-gray-400 px-2 py-1.5 rounded-lg bg-gray-800/30">
            {proposal.comments.length} comments
          </div>
        </div>

        {topComments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700 space-y-1.5">
            {topComments.map((c: any, i: number) => (
              <div key={i} className="text-xs text-gray-400 line-clamp-1">
                <span className="text-gray-300 font-semibold">{c.author}:</span> {c.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ProposalDetail({ proposal, onClose, onUpvote, onComment }: any) {
  const [commentText, setCommentText] = useState("");
  const [isUpvoting, setIsUpvoting] = useState(false);

  if (!proposal) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border border-cyan-500/30 bg-gradient-to-b from-black to-gray-900/50 p-6 backdrop-blur-sm"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{proposal.title}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>By <span className="text-cyan-300 font-semibold">{proposal.author}</span></span>
              <span>•</span>
              <span className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">{proposal.approach}</span>
              <span>•</span>
              <span className={`font-semibold ${proposal.votes > 5 ? 'text-emerald-400' : 'text-gray-400'}`}>
                {proposal.votes} upvotes
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6 p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
          <p className="text-gray-200 whitespace-pre-wrap">{proposal.summary}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-700">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setIsUpvoting(true)}
            onHoverEnd={() => setIsUpvoting(false)}
            onClick={onUpvote}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold transition-colors"
          >
            <ThumbsUp size={16} />
            Upvote ({proposal.votes})
          </motion.button>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold transition-colors">
            <Share2 size={16} />
            Share
          </button>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-white">Comments ({proposal.comments.length})</h3>

          {/* Comment Input */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Add your thought..."
              className="flex-1 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && commentText.trim()) {
                  onComment(commentText.trim());
                  setCommentText("");
                }
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (commentText.trim()) {
                  onComment(commentText.trim());
                  setCommentText("");
                }
              }}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold text-white transition-colors"
            >
              Post
            </motion.button>
          </div>

          {/* Comments List */}
          <div className="space-y-3 mt-4">
            {proposal.comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No comments yet. Be the first to share your thoughts!</p>
            ) : (
              proposal.comments.map((c: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-gray-800/20 border border-gray-700/30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-cyan-300">{c.author}</span>
                    <span className="text-xs text-gray-500">just now</span>
                  </div>
                  <p className="text-sm text-gray-300">{c.text}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CommunityEdge;
