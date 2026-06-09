import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Trading Setups & Playbook",
  "Build and track your trading setups and playbook. Validate edge with per-strategy statistics.",
  "/setups",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
