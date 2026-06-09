import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Decision Errors & Cognitive Bias Detection",
  "Detect cognitive biases and recurring decision errors in your trading. Turn psychology mistakes into measurable edge.",
  "/decision-errors",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
