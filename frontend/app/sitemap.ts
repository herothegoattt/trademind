import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://trademindtech.com";
  const now = new Date();

  return [
    { url: base,                              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/markets`,                 lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/daily-bias`,              lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/news`,                    lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/analytics-lab`,           lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/decision-errors`,         lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/journal`,                 lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/setups`,                  lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/trader-dna`,              lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/investing`,               lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/community-edge`,          lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${base}/auth/login`,              lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/privacy`,                 lastModified: now, changeFrequency: "monthly", priority: 0.2 },
    { url: `${base}/terms`,                   lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ];
}
