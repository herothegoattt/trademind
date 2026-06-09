import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Community Edge — Crowd Trading Insights",
  "Tap into community trading insights and crowd sentiment to sharpen your edge.",
  "/community-edge",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
