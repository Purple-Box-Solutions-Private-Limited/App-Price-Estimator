"use client";

import { useEffect, useState } from "react";
import { CITY_TIERS, type BaselineResult } from "@/lib/pricing";
import { formatINR, formatINRCompact, formatRange, roundQuote } from "@/lib/format";
import { RollingNumber } from "./ui";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36).toUpperCase().slice(0, 6);
}

/** The instant estimate, printed as a till receipt that updates line by line. */
export default function BaselinePanel({ baseline, city, stale }: { baseline: BaselineResult; city: string; stale?: boolean }) {
  const [gst, setGst] = useState(false);
  const [date, setDate] = useState("");
  useEffect(() => setDate(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })), []);

  const g = (n: number) => (gst ? roundQuote(n * 1.18) : n);
  const s = baseline.selected;
  const maxHigh = Math.max(...baseline.quotes.map((q) => q.high));
  const cityMult = CITY_TIERS.find((c) => c.id === city)?.mult ?? 1;
  const rate = s.vendor.id === "own" ? s.vendor.rate[0] : Math.round(((s.vendor.rate[0] + s.vendor.rate[1]) / 2) * cityMult);
  const no = hash(baseline.lineItems.map((l) => l.name).join("|") + s.vendor.id + baseline.hours.join());

  return (
    <div className="receipt-wrap">
      <div className="receipt px-5 pb-6 pt-5 text-[12.5px] text-ink">
        {/* header */}
        <div className="text-center">
          <div className="font-display text-3xl leading-none tracking-normal">
            Quote<span className="italic text-accent">Sense</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">instant estimate · not a tax invoice</div>
          <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
            <span>No. QS-{no}</span>
            <span>{date || "—"}</span>
          </div>
        </div>

        <div className="rule-dash my-3" />

        {/* line items */}
        <ul className="space-y-1.5">
          {baseline.lineItems.map((l) => (
            <li key={l.name} className="print-line flex items-baseline">
              <span className="max-w-[62%] truncate">{l.name.replace(" — core build", " (core)")}</span>
              <span className="dots" />
              <span className="shrink-0 tabular-nums">
                {l.hours[0]}–{l.hours[1]}h
              </span>
            </li>
          ))}
          {Math.abs(baseline.multiplier - 1) > 0.01 && (
            <li className="flex items-baseline text-zinc-600">
              <span>design · scale · timeline</span>
              <span className="dots" />
              <span>×{baseline.multiplier.toFixed(2)}</span>
            </li>
          )}
        </ul>

        <div className="rule-dash my-3" />

        <div className="space-y-1">
          <div className="flex items-baseline">
            <span>Effort</span>
            <span className="dots" />
            <span>
              {baseline.hours[0]}–{baseline.hours[1]} h
            </span>
          </div>
          <div className="flex items-baseline">
            <span>{s.vendor.id === "own" ? "Your rate" : `${s.vendor.name} rate`}</span>
            <span className="dots" />
            <span>₹{rate.toLocaleString("en-IN")}/h</span>
          </div>
          {gst && (
            <div className="flex items-baseline">
              <span>GST @ 18%</span>
              <span className="dots" />
              <span>{formatINR(g(s.likely) - s.likely)}</span>
            </div>
          )}
        </div>

        {/* total */}
        <div className="relative mt-4 border-y-[1.5px] border-ink py-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Most likely {gst ? "incl. GST" : "excl. GST"}</div>
              <div className="mt-1 text-[2.5rem] font-bold leading-none tracking-tight">
                <RollingNumber value={g(s.likely)} format={formatINRCompact} />
              </div>
            </div>
            <span key={stale ? "stale" : "fresh"} className={`stamp stamp-in text-[11px] ${stale ? "text-zinc-500" : "text-accent"}`}>
              {stale ? "draft" : "estimated"}
            </span>
          </div>
          <div className="mt-1.5 text-zinc-600">
            range {formatINR(g(s.low))} – {formatINR(g(s.high))}
          </div>
          <div className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-zinc-500">
            <span
              className={`mt-px shrink-0 rounded px-1 font-bold ${
                baseline.confidence.label === "Normal" ? "bg-lime text-ink" : baseline.confidence.label === "Moderate" ? "bg-accent-soft text-ink" : "bg-accent text-white"
              }`}
            >
              {baseline.confidence.label.toUpperCase()}
            </span>
            <span>{baseline.confidence.reason}</span>
          </div>
        </div>

        <label className="no-print mt-3 flex cursor-pointer items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-600">
          <input type="checkbox" checked={gst} onChange={(e) => setGst(e.target.checked)} className="h-3.5 w-3.5 accent-ink" />
          show incl. 18% GST
        </label>

        {/* quick facts */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {[
            ["Timeline", `${s.weeks[0]}–${s.weeks[1]} wk`],
            ["Running", `${formatRange(baseline.monthly[0], baseline.monthly[1])}/mo`],
            ["AMC / yr", formatRange(baseline.amc[0], baseline.amc[1])],
            ["Domain / yr", formatRange(baseline.domainYearly[0], baseline.domainYearly[1])],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{k}</div>
              <div className="font-semibold">{v}</div>
            </div>
          ))}
        </div>

        <div className="rule-dash my-4" />

        {/* vendors */}
        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Same scope elsewhere</div>
        <div className="mt-2 space-y-2">
          {baseline.quotes.map((q) => {
            const on = q.vendor.id === s.vendor.id;
            return (
              <div key={q.vendor.id}>
                <div className={`flex justify-between ${on ? "font-bold" : "text-zinc-600"}`}>
                  <span>
                    {on ? "▸ " : ""}
                    {q.vendor.name}
                  </span>
                  <span>{formatRange(g(q.low), g(q.high))}</span>
                </div>
                <div className="relative mt-1 h-1.5 bg-zinc-100">
                  <div
                    className={`absolute h-1.5 transition-all duration-500 ${on ? "bg-accent" : "bg-ink/70"}`}
                    style={{ left: `${(q.low / maxHigh) * 100}%`, width: `${Math.max(2, ((q.high - q.low) / maxHigh) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="barcode mt-6" />
        <div className="mt-1.5 text-center text-[10px] uppercase tracking-[0.3em] text-zinc-500">indicative · excl. content & licences</div>
      </div>
    </div>
  );
}
