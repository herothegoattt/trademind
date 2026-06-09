import type { Metadata } from "next";

export const SITE_URL = "https://trademindtech.com";

/**
 * Per-route metadata for client-component pages (which cannot export `metadata`
 * themselves). Wrap such a page in a thin server `layout.tsx` and re-export the
 * result of `pageMeta(...)` so each route gets a unique title, description and
 * canonical URL instead of inheriting the root defaults (kills duplicate-title
 * SEO penalties).
 */
export function pageMeta(title: string, description: string, path: string): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = `${title} | TradeMind AI`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: fullTitle, description, url },
    twitter: { title: fullTitle, description },
  };
}
