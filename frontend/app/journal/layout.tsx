import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Trading Journal & Trade Analytics",
  "AI-powered trading journal. Log, tag and analyze every trade to surface patterns, mistakes and your real edge.",
  "/journal",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
