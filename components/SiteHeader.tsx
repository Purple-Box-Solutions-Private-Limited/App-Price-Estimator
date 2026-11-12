"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURES, PROJECT_TYPES, VENDORS } from "@/lib/pricing";
import { formatRange } from "@/lib/format";

const NAV = [
  { href: "/estimate", n: "01", label: "Estimate" },
  { href: "/saved", n: "02", label: "Saved" },
  { href: "/guide", n: "03", label: "Price guide" },
  { href: "/settings", n: "04", label: "Settings" },
];

const TICKER: string[] = [
  ...VENDORS.map((v) => `${v.name} ₹${v.rate[0].toLocaleString("en-IN")}–${v.rate[1].toLocaleString("en-IN")}/hr`),
  ...PROJECT_TYPES.map((t) => `${t.name} ${formatRange(t.market[0], t.market[1])}`),
  ...FEATURES.filter((f) => ["payments", "booking", "mobile", "ai", "multivendor"].includes(f.id)).map((f) => `${f.name} ${f.hours[0]}–${f.hours[1]}h`),
];

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="no-print sticky top-0 z-30">
      <div className="border-b-[1.5px] border-ink bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="group flex items-baseline gap-2">
            <span className="grid h-9 w-9 -rotate-6 place-items-center self-center rounded-lg border-[1.5px] border-ink bg-accent text-lg font-bold text-white shadow-[2px_2px_0_var(--color-ink)] transition group-hover:rotate-0">
              ₹
            </span>
            <span className="font-display text-[28px] leading-none">
              Quote<span className="italic text-accent">Sense</span>
            </span>
            <span className="kicker hidden lg:inline">· the pricing desk</span>
          </Link>
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`group relative flex items-baseline gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2"
                  }`}
                >
                  <span className={`num text-[10px] ${active ? "text-accent" : "text-zinc-400 group-hover:text-accent"}`}>{n.n}</span>
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="ticker overflow-hidden border-b-[1.5px] border-ink bg-lime">
        <div className="ticker-track flex w-max whitespace-nowrap py-1.5">
          {[0, 1].map((k) => (
            <div key={k} className="num flex shrink-0 items-center text-[11px] font-medium uppercase tracking-wider text-ink" aria-hidden={k === 1}>
              {TICKER.map((t, i) => (
                <span key={i} className="flex items-center">
                  <span className="px-4">{t}</span>
                  <span className="text-accent">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
