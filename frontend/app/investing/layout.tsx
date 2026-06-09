import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Investing Portfolio & Long-Term Opportunities",
  "Manage your investing portfolio with AI long-term opportunities, risk analysis and market intelligence.",
  "/investing",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
