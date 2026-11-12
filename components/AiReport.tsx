"use client";

import { useState } from "react";
import type { AiEstimate, Source } from "@/lib/schema";
import type { BaselineResult } from "@/lib/pricing";
import { formatINR, formatINRCompact, formatRange } from "@/lib/format";

function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-3xl p-6 ${className}`}>
      {title && <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">{title}</h4>}
      {children}
    </div>
  );
}

function List({ items, icon, color }: { items: string[]; icon: string; color: string }) {
  if (!items.length) return <p className="text-sm text-zinc-500">—</p>;
  return (
    <ul className="space-y-2">
      {items.map((x, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-zinc-300">
          <span className={`mt-px shrink-0 ${color}`}>{icon}</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

const MILESTONE_COLORS = ["bg-violet-500", "bg-indigo-500", "bg-sky-500", "bg-cyan-500", "bg-teal-500", "bg-emerald-500"];

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function AiReport({
  estimate: e,
  sources,
  notes,
  queries,
  model,
  baseline,
}: {
  estimate: AiEstimate;
  sources: Source[];
  notes: string;
  queries: string[];
  model: string;
  baseline: BaselineResult;
}) {
  const [copied, setCopied] = useState<string>("");
  const r = e.recommended;
  const modLo = e.modules.reduce((s, m) => s + m.lowINR, 0);
  const modHi = e.modules.reduce((s, m) => s + m.highINR, 0);
  const hrsLo = e.modules.reduce((s, m) => s + m.hoursLow, 0);
  const hrsHi = e.modules.reduce((s, m) => s + m.hoursHigh, 0);
  const maxMod = Math.max(1, ...e.modules.map((m) => m.highINR));
  const maxVendor = Math.max(1, ...e.vendorQuotes.map((v) => v.highINR));
  const monthlyLo = e.recurringCosts.reduce((s, c) => s + c.monthlyLowINR, 0);
  const monthlyHi = e.recurringCosts.reduce((s, c) => s + c.monthlyHighINR, 0);
  const delta = baseline.selected.likely ? ((r.mostLikelyINR - baseline.selected.likely) / baseline.selected.likely) * 100 : 0;

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  };

  const quoteText = [
    `${e.systemType} — Cost Estimate`,
    ``,
    e.clientPitch,
    ``,
    `Investment: ${formatINR(r.lowINR)} – ${formatINR(r.highINR)} + GST (most likely ${formatINR(r.mostLikelyINR)})`,
    `Timeline: ${r.timelineWeeksLow}–${r.timelineWeeksHigh} weeks`,
    ``,
    `Scope:`,
    ...e.modules.map((m) => `• ${m.name}: ${formatINR(m.lowINR)} – ${formatINR(m.highINR)}`),
    ``,
    `Running costs (monthly): ${formatINR(monthlyLo)} – ${formatINR(monthlyHi)}`,
    ``,
    `Payment schedule:`,
    ...e.paymentMilestones.map((p) => `• ${p.percent}% — ${p.milestone}`),
    ``,
    `Assumptions:`,
    ...e.assumptions.map((a) => `• ${a}`),
  ].join("\n");

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify({ estimate: e, sources, generatedAt: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `estimate-${e.systemType.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const confColor = e.confidence === "High" ? "text-emerald-300 bg-emerald-500/15" : e.confidence === "Medium" ? "text-amber-300 bg-amber-500/15" : "text-rose-300 bg-rose-500/15";

  return (
    <div className="fade-up space-y-6">
      {/* Hero result */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/25 via-indigo-600/10 to-cyan-500/15 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">✦ AI deep research</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200">{e.complexityTier}</span>
              <span className={`rounded-full px-3 py-1 text-xs ${confColor}`} title={e.confidenceReason}>
                {e.confidence} confidence
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">{e.systemType}</h3>
            <p className="mt-3 max-w-2xl leading-relaxed text-zinc-300">{e.projectSummary}</p>
            <p className="mt-4 text-sm text-zinc-400">
              <span className="text-zinc-500">Recommended stack:</span> {e.recommendedStack}
            </p>
          </div>
          <div className="rounded-2xl bg-black/30 p-6 backdrop-blur">
            <div className="text-sm text-zinc-400">{r.vendorType} · most likely</div>
            <div className="text-5xl font-bold tracking-tight text-white">{formatINRCompact(r.mostLikelyINR)}</div>
            <div className="mt-1 text-sm text-zinc-300">
              {formatINR(r.lowINR)} – {formatINR(r.highINR)} <span className="text-zinc-500">+ GST</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-zinc-500">Timeline</div>
                <div className="font-semibold text-white">
                  {r.timelineWeeksLow}–{r.timelineWeeksHigh} weeks
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Running cost</div>
                <div className="font-semibold text-white">{formatRange(monthlyLo, monthlyHi)}/mo</div>
              </div>
            </div>
            <div className="mt-4 border-t border-white/10 pt-3 text-xs text-zinc-400">
              vs instant estimate ({formatINRCompact(baseline.selected.likely)}):{" "}
              <span className={Math.abs(delta) < 15 ? "text-emerald-300" : "text-amber-300"}>
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
        <div className="no-print relative mt-6 flex flex-wrap gap-2">
          <button onClick={() => copy("quote", quoteText)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">
            {copied === "quote" ? "Copied ✓" : "Copy client quote"}
          </button>
          <button onClick={() => window.print()} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">
            Save as PDF
          </button>
          <button onClick={downloadJson} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">
            Download JSON
          </button>
        </div>
      </div>

      {/* Understanding */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="What the client needs">
          <List items={e.understoodRequirements} icon="✓" color="text-violet-400" />
        </Card>
        <Card title="Assumptions">
          <List items={e.assumptions} icon="◦" color="text-zinc-500" />
        </Card>
        <Card title="Ask the client before quoting">
          <List items={e.clarifyingQuestions} icon="?" color="text-cyan-400" />
        </Card>
      </div>

      {/* Modules */}
      <Card title="Cost breakdown by module">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="pb-3 font-medium">Module</th>
                <th className="pb-3 font-medium">Effort</th>
                <th className="w-1/3 pb-3 font-medium" />
                <th className="pb-3 text-right font-medium">Cost (INR)</th>
              </tr>
            </thead>
            <tbody>
              {e.modules.map((m, i) => (
                <tr key={i} className="border-t border-white/5 align-top">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-white">{m.name}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-zinc-500">{m.description}</div>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 text-zinc-400">
                    {m.hoursLow}–{m.hoursHigh} h
                  </td>
                  <td className="py-3 pr-4">
                    <div className="relative mt-2 h-2 rounded-full bg-white/5">
                      <div
                        className="bg-gradient-brand absolute h-2 rounded-full"
                        style={{ left: `${(m.lowINR / maxMod) * 100}%`, width: `${Math.max(2, ((m.highINR - m.lowINR) / maxMod) * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-3 text-right text-zinc-200">{formatRange(m.lowINR, m.highINR)}</td>
                </tr>
              ))}
              <tr className="border-t border-white/15 font-semibold">
                <td className="pt-3 text-white">Total</td>
                <td className="pt-3 text-zinc-300">
                  {hrsLo}–{hrsHi} h
                </td>
                <td />
                <td className="pt-3 text-right text-white">{formatRange(modLo, modHi)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Vendors + team */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="What different vendors would quote">
          <div className="space-y-5">
            {e.vendorQuotes.map((v) => (
              <div key={v.vendorType}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-white">{v.vendorType}</span>
                  <span className="text-sm text-zinc-200">
                    {formatRange(v.lowINR, v.highINR)} · <span className="text-zinc-500">{v.timelineWeeksLow}–{v.timelineWeeksHigh} wk</span>
                  </span>
                </div>
                <div className="relative mt-2 h-2 rounded-full bg-white/5">
                  <div
                    className={`absolute h-2 rounded-full ${v.vendorType.toLowerCase().startsWith(r.vendorType.toLowerCase().split(" ")[0]) ? "bg-gradient-brand" : "bg-white/25"}`}
                    style={{ left: `${(v.lowINR / maxVendor) * 100}%`, width: `${Math.max(2, ((v.highINR - v.lowINR) / maxVendor) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">{v.notes}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Recommended team & reasoning">
          <List items={r.team} icon="●" color="text-violet-400" />
          <p className="mt-5 border-t border-white/5 pt-4 text-sm leading-relaxed text-zinc-400">{r.reasoning}</p>
        </Card>
      </div>

      {/* Recurring + milestones */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Running costs after launch (monthly)">
          <ul className="divide-y divide-white/5">
            {e.recurringCosts.map((c, i) => (
              <li key={i} className="flex justify-between gap-4 py-2.5 text-sm">
                <div>
                  <div className="text-zinc-200">{c.item}</div>
                  <div className="text-xs text-zinc-500">{c.notes}</div>
                </div>
                <div className="shrink-0 text-right text-zinc-200">{formatRange(c.monthlyLowINR, c.monthlyHighINR)}</div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-white/15 pt-3 text-sm font-semibold text-white">
            <span>Total / month</span>
            <span>{formatRange(monthlyLo, monthlyHi)}</span>
          </div>
        </Card>
        <Card title="Suggested payment milestones">
          <div className="flex h-3 overflow-hidden rounded-full">
            {e.paymentMilestones.map((p, i) => (
              <div key={i} className={MILESTONE_COLORS[i % MILESTONE_COLORS.length]} style={{ width: `${p.percent}%` }} />
            ))}
          </div>
          <ul className="mt-5 space-y-2.5">
            {e.paymentMilestones.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2.5 text-zinc-300">
                  <span className={`h-2.5 w-2.5 rounded-full ${MILESTONE_COLORS[i % MILESTONE_COLORS.length]}`} />
                  {p.milestone}
                </span>
                <span className="shrink-0 text-zinc-400">
                  {p.percent}% · {formatINRCompact((r.mostLikelyINR * p.percent) / 100)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Drivers / savings / risks */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="What drives the price">
          <List items={e.costDrivers} icon="↑" color="text-amber-400" />
        </Card>
        <Card title="Ways to reduce cost">
          <List items={e.costSavingOptions} icon="↓" color="text-emerald-400" />
        </Card>
        <Card title="Risks">
          <List items={e.risks} icon="!" color="text-rose-400" />
        </Card>
      </div>

      {/* Evidence */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Market rates used">
          <ul className="divide-y divide-white/5">
            {e.marketRates.map((m, i) => (
              <li key={i} className="flex justify-between gap-4 py-2.5 text-sm">
                <div>
                  <div className="text-zinc-200">{m.role}</div>
                  <div className="text-xs text-zinc-500">{m.source}</div>
                </div>
                <div className="shrink-0 text-zinc-200">
                  ₹{m.hourlyLowINR.toLocaleString("en-IN")}–{m.hourlyHighINR.toLocaleString("en-IN")}/hr
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Comparable prices found">
          <ul className="divide-y divide-white/5">
            {e.comparables.map((c, i) => (
              <li key={i} className="py-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-200">{c.description}</span>
                  <span className="shrink-0 text-zinc-200">{c.priceRange}</span>
                </div>
                <div className="text-xs text-zinc-500">{c.source}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Client-ready summary">
        <p className="leading-relaxed text-zinc-200">{e.clientPitch}</p>
        <button onClick={() => copy("pitch", e.clientPitch)} className="no-print mt-4 text-sm text-violet-300 hover:text-violet-200">
          {copied === "pitch" ? "Copied ✓" : "Copy paragraph"}
        </button>
      </Card>

      <Card title={`Sources (${sources.length}) · ${queries.length} searches`}>
        <p className="mb-4 text-xs text-zinc-500">
          Confidence note: {e.confidenceReason}
        </p>
        <ul className="grid gap-x-6 gap-y-1.5 md:grid-cols-2">
          {sources.slice(0, 30).map((s) => (
            <li key={s.url} className="truncate text-sm">
              <a href={s.url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white">
                <span className="text-zinc-600">{host(s.url)}</span> · {s.title}
              </a>
            </li>
          ))}
        </ul>
        {notes && (
          <details className="no-print mt-5">
            <summary className="cursor-pointer text-sm text-violet-300">Show raw research notes</summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-black/40 p-4 text-xs leading-relaxed text-zinc-400">{notes}</pre>
          </details>
        )}
        <p className="mt-4 text-[11px] text-zinc-600">Generated by {model}. Figures are estimates excluding GST; validate with the client&apos;s final scope.</p>
      </Card>
    </div>
  );
}
