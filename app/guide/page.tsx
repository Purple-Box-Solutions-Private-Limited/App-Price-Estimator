import type { Metadata } from "next";
import TierGuide from "@/components/TierGuide";

export const metadata: Metadata = { title: "Price guide" };

const TOC = [
  ["#levels", "I", "Project levels"],
  ["#rates", "II", "Vendor rates"],
  ["#features", "III", "Feature costs"],
  ["#method", "IV", "Method"],
];

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-[1400px] px-5 sm:px-8">
      <div className="grid gap-8 border-b-[1.5px] border-ink pb-8 pt-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <div>
          <div className="kicker">03 · Reference · India 2026</div>
          <h1 className="mt-2 text-[clamp(3rem,7vw,6.5rem)] leading-[0.92]">
            The <em className="text-accent">price</em> guide
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-2">Market numbers to sanity-check a budget before, or during, the client call. All INR, excl. 18% GST.</p>
        </div>
        <nav className="grid grid-cols-2 gap-2">
          {TOC.map(([href, n, label]) => (
            <a key={href} href={href} className="tile flex items-baseline gap-2 px-4 py-3">
              <span className="font-display text-xl italic text-accent">{n}</span>
              <span className="font-medium">{label}</span>
            </a>
          ))}
        </nav>
      </div>
      <div className="mt-12">
        <TierGuide />
      </div>
    </main>
  );
}
