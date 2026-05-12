import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  likes: number;
  likedByMe: boolean;
  created_at: number;
}

export interface Post {
  id: string;
  type: 'idea' | 'discussion';
  title: string;
  author: string;
  avatar: string;
  body: string;
  image?: string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
  tag: string;
  created_at: number;
}

interface CommunityStore {
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'likes' | 'likedByMe' | 'comments' | 'created_at'>) => void;
  likePost: (id: string) => void;
  addComment: (postId: string, data: Omit<Comment, 'id' | 'likes' | 'likedByMe' | 'created_at'>) => void;
  likeComment: (postId: string, commentId: string) => void;
}

export const useCommunityStore = create<CommunityStore>()(
  persist(
    (set, get) => ({
      posts: [],

      addPost: (data) => {
        const post: Post = {
          ...data,
          id: `post-${Date.now()}`,
          likes: 0,
          likedByMe: false,
          comments: [],
          created_at: Date.now(),
        };
        set({ posts: [post, ...get().posts] });
      },

      likePost: (id) => {
        set({
          posts: get().posts.map(p =>
            p.id === id
              ? { ...p, likes: p.likedByMe ? p.likes - 1 : p.likes + 1, likedByMe: !p.likedByMe }
              : p
          ),
        });
      },

      addComment: (postId, data) => {
        const comment: Comment = {
          ...data,
          id: `c-${Date.now()}`,
          likes: 0,
          likedByMe: false,
          created_at: Date.now(),
        };
        set({
          posts: get().posts.map(p =>
            p.id !== postId ? p : { ...p, comments: [...p.comments, comment] }
          ),
        });
      },

      likeComment: (postId, commentId) => {
        set({
          posts: get().posts.map(p =>
            p.id !== postId ? p : {
              ...p,
              comments: p.comments.map(c =>
                c.id !== commentId ? c
                  : { ...c, likes: c.likedByMe ? c.likes - 1 : c.likes + 1, likedByMe: !c.likedByMe }
              ),
            }
          ),
        });
      },
    }),
    { name: 'trademind-community' }
  )
);
