import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Market News & AI Sentiment Analysis",
  "Real-time financial news with AI sentiment and trade-impact scoring across stocks, crypto and forex.",
  "/news",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
