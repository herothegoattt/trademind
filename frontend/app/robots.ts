import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/app/support", "/auth/signup"],
      },
    ],
    sitemap: "https://trademindtech.com/sitemap.xml",
    host: "https://trademindtech.com",
  };
}
