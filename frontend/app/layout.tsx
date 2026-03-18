import "./globals.css";
import { Inter } from "next/font/google";
import { PostHogProvider } from "../components/posthog/PostHogProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TradeMind AI",
  description: "Premium decision dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
