import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Trader DNA — Your Trading Profile",
  "Discover your Trader DNA: a data-driven profile of your strengths, biases and behavioral patterns as a trader.",
  "/trader-dna",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
