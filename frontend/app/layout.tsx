import "./globals.css";
import { Inter } from "next/font/google";
import Script from "next/script";
import { PostHogProvider } from "../components/posthog/PostHogProvider";
import { GoogleAuthProvider } from "../components/providers/GoogleAuthProvider";
import { OnboardingFlow } from "../components/OnboardingFlow";
import { PageCurtain } from "../components/PageCurtain";
import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });
const GA_ID = "G-EQBEYKHRPW";

export const viewport: Viewport = {
  themeColor: "#070a12",
  width: "device-width",
  initialScale: 1,
};

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
  applicationName: "TradeMind AI",
  category: "finance",
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: { capable: true, title: "TradeMind", statusBarStyle: "black-translucent" },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
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
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://trademindtech.com/#organization",
                  name: "TradeMind",
                  url: "https://trademindtech.com",
                  logo: "https://trademindtech.com/logo.jpg",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://trademindtech.com/#website",
                  name: "TradeMind AI",
                  url: "https://trademindtech.com",
                  inLanguage: "en",
                  publisher: { "@id": "https://trademindtech.com/#organization" },
                },
                {
                  "@type": "WebApplication",
                  "@id": "https://trademindtech.com/#app",
                  name: "TradeMind AI",
                  url: "https://trademindtech.com",
                  description:
                    "AI-powered trading decision support. Detect cognitive biases, get daily market bias, analyze your trades.",
                  applicationCategory: "FinanceApplication",
                  operatingSystem: "Web",
                  browserRequirements: "Requires JavaScript",
                  inLanguage: ["en", "ru"],
                  featureList: [
                    "Cognitive bias and decision-error detection",
                    "AI daily market bias",
                    "Real-time order flow and analytics lab",
                    "Trading journal and trade analytics",
                    "Trading setups and playbook",
                    "Trader DNA behavioral profile",
                  ],
                  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                  publisher: { "@id": "https://trademindtech.com/#organization" },
                },
              ],
            }),
          }}
        />

        <PostHogProvider>
          <GoogleAuthProvider>
            {children}
            <PageCurtain />
            <OnboardingFlow />
          </GoogleAuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
