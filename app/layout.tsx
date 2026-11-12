import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "QuoteSense: the pricing desk for Indian web projects",
    template: "%s · QuoteSense",
  },
  description:
    "Estimate what a website or app should cost in India before you quote. Instant estimates, AI research on current rates, a market price guide and saved quotes, all in INR.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${grotesk.variable} ${serif.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="no-print mt-16 border-t-[1.5px] border-ink bg-ink text-paper">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-6 px-5 py-10 sm:px-8">
            <div>
              <div className="font-display text-5xl leading-none">
                Quote<span className="italic text-accent">Sense</span>
              </div>
              <p className="mt-3 max-w-md text-sm text-paper/60">
                Indicative figures, excl. 18% GST unless stated. Confirm final scope with the client before sending a quote.
              </p>
            </div>
            <div className="num text-xs text-paper/50">INR · INDIA · RATES CALIBRATED NOV 2026</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
