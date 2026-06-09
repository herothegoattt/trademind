import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Order Flow & Analytics Lab",
  "Professional order flow: footprint charts, volume delta, VWAP, market profile, POC absorption and stacked imbalance in real time.",
  "/analytics-lab",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
