import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Daily Market Bias — AI Forecast",
  "AI-generated daily market bias for forex, indices and crypto. Know the directional lean before the session opens.",
  "/daily-bias",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
