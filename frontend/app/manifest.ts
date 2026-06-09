import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TradeMind AI — Smart Trading Decision Dashboard",
    short_name: "TradeMind",
    description:
      "AI-powered trading decision support: cognitive-bias detection, daily market bias, order flow and trade analytics.",
    start_url: "/",
    display: "standalone",
    background_color: "#070a12",
    theme_color: "#070a12",
    categories: ["finance", "business", "productivity"],
    icons: [
      { src: "/logo.jpg", sizes: "any", type: "image/jpeg", purpose: "any" },
    ],
  };
}
