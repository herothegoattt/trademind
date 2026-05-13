import "./globals.css";
import { Inter } from "next/font/google";
import Script from "next/script";
import { PostHogProvider } from "../components/posthog/PostHogProvider";
import { GoogleAuthProvider } from "../components/providers/GoogleAuthProvider";
import { OnboardingFlow } from "../components/OnboardingFlow";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });
const GA_ID = "G-EQBEYKHRPW";

export const metadata: Metadata = {
  metadataBase: new URL("https://trademindtech.com"),

  title: {
    default: "TradeMind AI — Smart Trading Decision Dashboard",
    template: "%s | TradeMind AI",
  },
  description:
    "AI-powered trading decision support. Detect cognitive biases, get daily market bias, analyze your trades and grow as a trader — all in one dashboard.",
  keywords: [
    "trading AI",
    "trading psychology",
    "market bias",
    "trade journal",
    "cognitive bias trading",
    "trading analytics",
    "daily bias forex",
    "trading decision tool",
  ],
  authors: [{ name: "TradeMind", url: "https://trademindtech.com" }],
  creator: "TradeMind",
  publisher: "TradeMind",

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://trademindtech.com",
    siteName: "TradeMind AI",
    title: "TradeMind AI — Smart Trading Decision Dashboard",
    description:
      "AI-powered trading decision support. Detect cognitive biases, get daily market bias, analyze your trades and grow as a trader.",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "TradeMind AI — Smart Trading Decision Dashboard",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "TradeMind AI — Smart Trading Decision Dashboard",
    description:
      "AI-powered trading decision support. Detect cognitive biases, get daily market bias, analyze your trades.",
    images: ["/logo.jpg"],
  },

  alternates: {
    canonical: "https://trademindtech.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        {/* JSON-LD Structured Data */}
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "TradeMind AI",
              url: "https://trademindtech.com",
              logo: "https://trademindtech.com/logo.jpg",
              description:
                "AI-powered trading decision support. Detect cognitive biases, get daily market bias, analyze your trades.",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              creator: {
                "@type": "Organization",
                name: "TradeMind",
                url: "https://trademindtech.com",
                logo: "https://trademindtech.com/logo.jpg",
              },
            }),
          }}
        />

        <PostHogProvider>
          <GoogleAuthProvider>
            {children}
            <OnboardingFlow />
          </GoogleAuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
