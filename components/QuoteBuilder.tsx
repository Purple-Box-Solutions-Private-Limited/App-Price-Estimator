"use client";

import { useEffect, useState } from "react";
import { formatINR, formatRange, roundQuote } from "@/lib/format";
import type { SavedQuote } from "@/lib/saved";
import { RollingNumber } from "./ui";

export const DEFAULT_QUOTE: SavedQuote = { markup: 0, discount: 0, gst: true, amc: true };

const DEFAULT_MILESTONES = [
  { milestone: "Advance on signing", percent: 40 },
  { milestone: "Design & core build approved", percent: 30 },
  { milestone: "Launch & handover", percent: 30 },
];

export interface QuoteBasis {
  source: "instant" | "ai";
  title: string;
  low: number;
  likely: number;
  high: number;
  weeks: [number, number];
  monthly: [number, number];
  /** Annual maintenance (AMC) range, yearly, excl. GST */
  amc: [number, number];
  scope: string[];
  assumptions: string[];
  milestones?: { milestone: string; percent: number }[];
}

function Stepper({ label, value, onChange, max, step, hint }: { label: string; value: number; onChange: (v: number) => void; max: number; step: number; hint?: string }) {
  const clamp = (v: number) => Math.min(max, Math.max(0, v));
  return (
    <div>
      <div className="kicker">{label}</div>
      <div className="mt-1.5 flex items-stretch overflow-hidden rounded-[10px] border-[1.5px] border-ink bg-sheet">
        <button type="button" onClick={() => onChange(clamp(value - step))} className="px-3 text-lg hover:bg-paper-2" aria-label={`Decrease ${label}`}>
          −
        </button>
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          className="num w-full border-x-[1.5px] border-ink bg-transparent py-2 text-center text-lg font-semibold focus:bg-lime/40 focus:outline-none"
          aria-label={label}
        />
        <span className="num grid place-items-center pl-1 pr-2 text-sm text-zinc-500">%</span>
        <button type="button" onClick={() => onChange(clamp(value + step))} className="border-l-[1.5px] border-ink px-3 text-lg hover:bg-paper-2" aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

export default function QuoteBuilder({
  basis,
  clientName,
  value,
  onChange,
}: {
  basis: QuoteBasis;
  clientName: string;
  value: SavedQuote;
  onChange: (v: SavedQuote) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [date, setDate] = useState("");
  useEffect(() => setDate(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })), []);
  const { markup, discount, gst } = value;
  const showAmc = value.amc !== false;

  const listPrice = roundQuote(basis.likely * (1 + markup / 100));
  const discountAmt = Math.round((listPrice * discount) / 100);
  const subtotal = listPrice - discountAmt;
  const gstAmt = gst ? Math.round(subtotal * 0.18) : 0;
  const total = subtotal + gstAmt;
  const milestones = basis.milestones?.length ? basis.milestones : DEFAULT_MILESTONES;
  // Same margin as the build, rounded to a quotable yearly figure
  const amcYear = roundQuote(((basis.amc[0] + basis.amc[1]) / 2) * (1 + markup / 100));
  const amcMonth = Math.round(amcYear / 12 / 100) * 100;
  const AMC_INCLUDES = "bug fixes, security & plugin updates, backups, uptime monitoring and small content changes (up to ~2 h/month)";

  const quoteText = [
    `Quotation${clientName ? `: ${clientName}` : ""}`,
    basis.title,
    ``,
    `Scope:`,
    ...basis.scope.map((s) => `• ${s}`),
    ``,
    `Project fee: ${formatINR(listPrice)}`,
    ...(discount ? [`Discount (${discount}%): -${formatINR(discountAmt)}`] : []),
    ...(gst ? [`GST @ 18%: ${formatINR(gstAmt)}`] : [`GST extra as applicable`]),
    `Total: ${formatINR(total)}`,
    ``,
    `Timeline: ${basis.weeks[0]}–${basis.weeks[1]} weeks`,
    `Running costs after launch (paid by client): ${formatRange(basis.monthly[0], basis.monthly[1])}/month`,
    `Free bug-fix warranty: 30 days after launch`,
    ...(showAmc
      ? [``, `Annual maintenance (optional, from month 2): ${formatINR(amcYear)}/year + GST (≈ ${formatINR(amcMonth)}/month). Covers ${AMC_INCLUDES}.`]
      : []),
    ``,
    `Payment schedule:`,
    ...milestones.map((m) => `• ${m.percent}%: ${m.milestone} (${formatINR((total * m.percent) / 100)})`),
    ...(basis.assumptions.length ? [``, `Assumptions:`, ...basis.assumptions.map((a) => `• ${a}`)] : []),
  ].join("\n");

  const copy = async () => {
    await navigator.clipboard.writeText(quoteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const printQuote = () => {
    document.body.classList.add("printing-quote");
    const done = () => {
      document.body.classList.remove("printing-quote");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  const no = `Q-${(basis.likely % 9973).toString().padStart(4, "0")}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* Controls */}
      <div className="quote-controls no-print space-y-5 lg:sticky lg:top-32 lg:self-start">
        <div className="sheet space-y-5 p-5">
          <div>
            <div className="kicker">Based on</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`rounded-md border-[1.5px] border-ink px-2 py-0.5 text-xs font-bold ${basis.source === "ai" ? "bg-cobalt text-white" : "bg-lime"}`}>
                {basis.source === "ai" ? "AI RESEARCH" : "INSTANT"}
              </span>
              <span className="num text-sm">{formatRange(basis.low, basis.high)}</span>
            </div>
          </div>
          <Stepper label="Your margin" value={markup} max={200} step={5} onChange={(v) => onChange({ ...value, markup: v })} hint="On top of the likely market price" />
          <Stepper label="Client discount" value={discount} max={50} step={5} onChange={(v) => onChange({ ...value, discount: v })} />
          <button
            type="button"
            onClick={() => onChange({ ...value, gst: !gst })}
            aria-pressed={gst}
            className="flex w-full items-center justify-between rounded-[10px] border-[1.5px] border-ink bg-sheet px-3 py-2.5 text-sm font-medium"
          >
            Add 18% GST
            <span className={`relative h-6 w-11 rounded-full border-[1.5px] border-ink transition ${gst ? "bg-accent" : "bg-paper-2"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full border-[1.5px] border-ink bg-sheet transition-all ${gst ? "left-5" : "left-0.5"}`} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, amc: !showAmc })}
            aria-pressed={showAmc}
            className="flex w-full items-center justify-between rounded-[10px] border-[1.5px] border-ink bg-sheet px-3 py-2.5 text-left text-sm font-medium"
          >
            <span>
              Offer maintenance (AMC)
              <span className="num block text-xs font-normal text-zinc-500">{formatINR(amcYear)}/yr · separate from total</span>
            </span>
            <span className={`relative h-6 w-11 shrink-0 rounded-full border-[1.5px] border-ink transition ${showAmc ? "bg-accent" : "bg-paper-2"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full border-[1.5px] border-ink bg-sheet transition-all ${showAmc ? "left-5" : "left-0.5"}`} />
            </span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={copy} className="btn btn-ink px-3 py-2.5 text-sm">
            {copied ? "Copied ✓" : "Copy text"}
          </button>
          <button type="button" onClick={printQuote} className="btn btn-accent px-3 py-2.5 text-sm">
            Print / PDF
          </button>
        </div>
      </div>

      {/* The document */}
      <article className="receipt-wrap min-w-0">
        <div className="relative overflow-hidden rounded-md bg-[#fffdf8] px-6 py-8 sm:px-12 sm:py-12">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-accent" />
          <header className="flex flex-wrap items-start justify-between gap-6 border-b-[1.5px] border-ink pb-6">
            <div>
              <div className="kicker">Quotation</div>
              <h3 className="mt-1 font-display text-5xl leading-none sm:text-6xl">{clientName || <span className="italic text-zinc-400">Client name</span>}</h3>
              <p className="mt-3 max-w-lg text-ink-2">{basis.title}</p>
            </div>
            <dl className="num grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-right text-xs">
              <dt className="text-zinc-500">No.</dt>
              <dd>{no}</dd>
              <dt className="text-zinc-500">Date</dt>
              <dd>{date || "—"}</dd>
              <dt className="text-zinc-500">Valid</dt>
              <dd>30 days</dd>
            </dl>
          </header>

          <section className="mt-6">
            <div className="kicker mb-2">Scope of work</div>
            <ol className="divide-y divide-dashed divide-zinc-300">
              {basis.scope.map((s, i) => (
                <li key={s + i} className="flex items-baseline gap-4 py-2">
                  <span className="num w-6 text-xs text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">{s}</span>
                  <span className="num text-xs text-zinc-500">included</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-8 grid gap-8 md:grid-cols-[1fr_minmax(0,320px)]">
            <div className="space-y-5 text-sm">
              <div>
                <div className="kicker mb-2">Payment schedule</div>
                <ul className="space-y-1.5">
                  {milestones.map((m, i) => (
                    <li key={i} className="flex items-baseline">
                      <span className="num mr-2 w-10 text-zinc-500">{m.percent}%</span>
                      <span>{m.milestone}</span>
                      <span className="dots" />
                      <span className="num font-semibold">{formatINR((total * m.percent) / 100)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full border border-ink">
                  {milestones.map((m, i) => (
                    <div key={i} className={["bg-accent", "bg-ink", "bg-lime", "bg-cobalt", "bg-zinc-400", "bg-moss"][i % 6]} style={{ width: `${m.percent}%` }} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="kicker">Timeline</div>
                  <div className="num mt-0.5 font-semibold">
                    {basis.weeks[0]}–{basis.weeks[1]} weeks
                  </div>
                </div>
                <div>
                  <div className="kicker">Running cost (client)</div>
                  <div className="num mt-0.5 font-semibold">{formatRange(basis.monthly[0], basis.monthly[1])}/mo</div>
                </div>
              </div>
            </div>

            <div className="num self-start rounded-lg border-[1.5px] border-ink text-sm">
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-zinc-600">Project fee</span>
                <span>{formatINR(listPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between border-t border-dashed border-zinc-300 px-4 py-2.5">
                  <span className="text-zinc-600">Discount {discount}%</span>
                  <span className="text-moss">−{formatINR(discountAmt)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-dashed border-zinc-300 px-4 py-2.5">
                <span className="text-zinc-600">GST 18%</span>
                <span>{gst ? formatINR(gstAmt) : "extra"}</span>
              </div>
              <div className="flex items-end justify-between rounded-b-md bg-ink px-4 py-3.5 text-paper">
                <span className="text-xs uppercase tracking-widest text-paper/60">Total</span>
                <RollingNumber value={total} format={formatINR} className="text-2xl font-bold text-lime" />
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-[1fr_minmax(0,320px)]">
            <div className="text-sm">
              <div className="kicker mb-1">After launch</div>
              <p className="text-ink-2">
                <span className="font-semibold text-ink">30-day free bug-fix warranty.</span> Hosting, domain and third-party fees (
                {formatRange(basis.monthly[0], basis.monthly[1])}/mo) are paid by the client directly.
              </p>
            </div>
            {showAmc && (
              <div className="rounded-lg border-[1.5px] border-dashed border-ink p-4 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="kicker">Annual maintenance · optional</span>
                  <span className="num font-semibold">{formatINR(amcYear)}/yr</span>
                </div>
                <div className="num mt-0.5 text-right text-xs text-zinc-500">≈ {formatINR(amcMonth)}/month + GST, from month 2</div>
                <p className="mt-2 text-xs text-ink-2">Covers {AMC_INCLUDES}. New features quoted separately.</p>
              </div>
            )}
          </section>

          {basis.assumptions.length > 0 && (
            <section className="mt-8 border-t border-dashed border-zinc-300 pt-5">
              <div className="kicker mb-2">Assumptions</div>
              <ul className="grid gap-x-6 gap-y-1 text-xs text-ink-2 md:grid-cols-2">
                {basis.assumptions.map((a, i) => (
                  <li key={i}>— {a}</li>
                ))}
              </ul>
            </section>
          )}

          <footer className="mt-10 flex items-end justify-between gap-6">
            <div>
              <div className="h-px w-48 bg-ink" />
              <div className="kicker mt-1.5">Authorised signatory</div>
            </div>
            <span className="stamp text-sm text-accent">Quoted</span>
          </footer>
        </div>
      </article>
    </div>
  );
}
