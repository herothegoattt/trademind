import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Live Markets & Real-Time Quotes",
  "Track live stocks, crypto, forex, futures and indices with real-time quotes, heatmaps and AI market intelligence.",
  "/markets",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
