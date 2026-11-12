import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuoteSense — Website & App Cost Estimator (India, INR)",
  description:
    "Know what a website or app should cost in India before you quote. Market tiers, instant estimates and AI deep research on current rates — all in INR.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
