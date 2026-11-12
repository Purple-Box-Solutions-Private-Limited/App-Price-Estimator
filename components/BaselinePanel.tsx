"use client";

import { useState } from "react";
import type { BaselineResult } from "@/lib/pricing";
import { formatINR, formatINRCompact, formatRange, roundQuote } from "@/lib/format";

export default function BaselinePanel({ baseline }: { baseline: BaselineResult }) {
  const [gst, setGst] = useState(false);
  const g = (n: number) => (gst ? roundQuote(n * 1.18) : n);
  const s = baseline.selected;
  const maxHigh = Math.max(...baseline.quotes.map((q) => q.high));

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Instant estimate</span>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" checked={gst} onChange={(e) => setGst(e.target.checked)} className="accent-violet-500" />
            incl. 18% GST
          </label>
        </div>

        <div className="mt-4 text-sm text-zinc-400">{s.vendor.name} · most likely</div>
        <div key={s.likely} className="fade-up text-5xl font-bold tracking-tight text-white">
          {formatINRCompact(g(s.likely))}
        </div>
        <div className="mt-1 text-sm text-zinc-400">
          Range <span className="text-zinc-200">{formatINR(g(s.low))} – {formatINR(g(s.high))}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/[0.04] p-3">
            <div className="text-xs text-zinc-500">Timeline</div>
            <div className="mt-0.5 font-semibold text-white">
              {s.weeks[0]}–{s.weeks[1]} weeks
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3">
            <div className="text-xs text-zinc-500">Effort</div>
            <div className="mt-0.5 font-semibold text-white">
              {baseline.hours[0]}–{baseline.hours[1]} hrs
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3">
            <div className="text-xs text-zinc-500">Running cost</div>
            <div className="mt-0.5 font-semibold text-white">{formatRange(baseline.monthly[0], baseline.monthly[1])}/mo</div>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3">
            <div className="text-xs text-zinc-500">Maintenance (AMC)</div>
            <div className="mt-0.5 font-semibold text-white">{formatRange(baseline.amc[0], baseline.amc[1])}/yr</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">Same scope, different vendors</div>
          <div className="space-y-2.5">
            {baseline.quotes.map((q) => (
              <div key={q.vendor.id}>
                <div className="flex justify-between text-xs">
                  <span className={q.vendor.id === s.vendor.id ? "font-semibold text-white" : "text-zinc-400"}>{q.vendor.name}</span>
                  <span className="text-zinc-300">{formatRange(g(q.low), g(q.high))}</span>
                </div>
                <div className="relative mt-1 h-1.5 rounded-full bg-white/5">
                  <div
                    className={`absolute h-1.5 rounded-full ${q.vendor.id === s.vendor.id ? "bg-gradient-brand" : "bg-white/25"}`}
                    style={{ left: `${(q.low / maxHigh) * 100}%`, width: `${Math.max(2, ((q.high - q.low) / maxHigh) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <details className="group mt-6 rounded-xl bg-black/20 p-3 text-sm">
          <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-widest text-zinc-500 group-open:mb-2">
            Effort breakdown ▾
          </summary>
          <ul className="space-y-1">
            {baseline.lineItems.map((l) => (
              <li key={l.name} className="flex justify-between gap-3 text-xs">
                <span className="text-zinc-300">{l.name}</span>
                <span className="shrink-0 text-zinc-500">
                  {l.hours[0]}–{l.hours[1]} h
                </span>
              </li>
            ))}
            {Math.abs(baseline.multiplier - 1) > 0.01 && (
              <li className="flex justify-between border-t border-white/5 pt-1 text-xs">
                <span className="text-zinc-400">Design / scale / timeline factor</span>
                <span className="text-zinc-500">×{baseline.multiplier.toFixed(2)}</span>
              </li>
            )}
          </ul>
        </details>
        <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
          Rule-based on {baseline.type.name.toLowerCase()} effort × Indian blended rates. Excludes domain (~₹800–1,500/yr), content writing and
          paid plugins/licences unless noted.
        </p>
      </div>
    </div>
  );
}
