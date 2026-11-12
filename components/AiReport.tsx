"use client";

import { useState } from "react";
import type { AiEstimate, Source } from "@/lib/schema";
import type { BaselineResult } from "@/lib/pricing";
import { formatINR, formatINRCompact, formatRange } from "@/lib/format";

function Block({ title, n, children, className = "" }: { title: string; n?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card p-5 ${className}`}>
      <h4 className="mb-4 flex items-baseline gap-2 border-b border-dashed border-zinc-300 pb-2">
        {n && <span className="num text-[11px] text-accent">{n}</span>}
        <span className="font-display text-2xl leading-none">{title}</span>
      </h4>
      {children}
    </div>
  );
}

function List({ items, icon, tone }: { items: string[]; icon: string; tone: string }) {
  if (!items.length) return <p className="text-sm text-zinc-500">—</p>;
  return (
    <ul className="space-y-2">
      {items.map((x, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-2">
          <span className={`num mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-[1.5px] border-ink text-[10px] font-bold ${tone}`}>{icon}</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

const MILESTONE_COLORS = ["bg-accent", "bg-ink", "bg-lime", "bg-cobalt", "bg-zinc-400", "bg-moss"];

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

  const summaryText = [
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
    const blob = new Blob([JSON.stringify({ estimate: e, sources, generatedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `estimate-${e.systemType.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const conf = e.confidence === "High" ? "bg-lime" : e.confidence === "Medium" ? "bg-accent-soft" : "bg-brand-200";

  return (
    <div className="fade-up space-y-6">
      {/* ---- Dossier cover ---- */}
      <div className="sheet overflow-hidden">
        <div className="grid lg:grid-cols-[1.35fr_1fr]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border-[1.5px] border-ink bg-cobalt px-2 py-0.5 text-xs font-bold text-white">AI RESEARCH</span>
              <span className="rounded-md border-[1.5px] border-ink bg-sheet px-2 py-0.5 text-xs font-semibold">{e.complexityTier}</span>
              <span className={`rounded-md border-[1.5px] border-ink px-2 py-0.5 text-xs font-semibold ${conf}`} title={e.confidenceReason}>
                {e.confidence} confidence
              </span>
            </div>
            <h3 className="mt-5 font-display text-[clamp(2.2rem,4vw,3.4rem)] leading-[1.02]">{e.systemType}</h3>
            <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-2">{e.projectSummary}</p>
            <p className="mt-5 text-sm">
              <span className="kicker mr-2">Stack</span>
              {e.recommendedStack}
            </p>
            <div className="no-print mt-6 flex flex-wrap gap-2">
              <button onClick={() => copy("summary", summaryText)} className="btn btn-ink px-4 py-2 text-sm">
                {copied === "summary" ? "Copied ✓" : "Copy summary"}
              </button>
              <button onClick={() => window.print()} className="btn px-4 py-2 text-sm">
                Save as PDF
              </button>
              <button onClick={downloadJson} className="btn px-4 py-2 text-sm">
                JSON
              </button>
            </div>
          </div>
          <div className="relative border-t-[1.5px] border-ink bg-cobalt p-6 text-white sm:p-8 lg:border-l-[1.5px] lg:border-t-0">
            <div className="kicker !text-white/70">{r.vendorType} · most likely</div>
            <div className="num mt-2 text-[clamp(3rem,6vw,4.6rem)] font-bold leading-none tracking-tight">{formatINRCompact(r.mostLikelyINR)}</div>
            <div className="num mt-2 text-sm text-white/80">
              {formatINR(r.lowINR)} – {formatINR(r.highINR)} + GST
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/25 pt-5 text-sm">
              <div>
                <div className="kicker !text-white/60">Timeline</div>
                <div className="num mt-0.5 text-lg font-semibold">
                  {r.timelineWeeksLow}–{r.timelineWeeksHigh} wk
                </div>
              </div>
              <div>
                <div className="kicker !text-white/60">Running</div>
                <div className="num mt-0.5 text-lg font-semibold">{formatRange(monthlyLo, monthlyHi)}/mo</div>
              </div>
            </div>
            <div className="num mt-5 inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1 text-xs ring-1 ring-white/25">
              vs instant {formatINRCompact(baseline.selected.likely)}
              <span className={`font-bold ${Math.abs(delta) < 15 ? "text-lime" : "text-accent-soft"}`}>
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(0)}%
              </span>
            </div>
            <span className="stamp stamp-in absolute bottom-6 right-6 text-xs text-white">verified</span>
          </div>
        </div>
      </div>

      {/* ---- Understanding ---- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Block n="A" title="What they need">
          <List items={e.understoodRequirements} icon="✓" tone="bg-lime" />
        </Block>
        <Block n="B" title="Assumptions">
          <List items={e.assumptions} icon="~" tone="bg-sheet" />
        </Block>
        <Block n="C" title="Ask before quoting">
          <List items={e.clarifyingQuestions} icon="?" tone="bg-cobalt-soft" />
        </Block>
      </div>

      {/* ---- Modules ---- */}
      <Block n="D" title="Cost by module">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="kicker text-left">
                <th className="pb-3 font-normal">Module</th>
                <th className="pb-3 font-normal">Effort</th>
                <th className="w-1/3 pb-3 font-normal" />
                <th className="pb-3 text-right font-normal">INR</th>
              </tr>
            </thead>
            <tbody>
              {e.modules.map((m, i) => (
                <tr key={i} className="border-t border-dashed border-zinc-300 align-top">
                  <td className="py-3 pr-4">
                    <div className="font-semibold">{m.name}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-zinc-500">{m.description}</div>
                  </td>
                  <td className="num whitespace-nowrap py-3 pr-4 text-zinc-600">
                    {m.hoursLow}–{m.hoursHigh}h
                  </td>
                  <td className="py-3 pr-4">
                    <div className="relative mt-2 h-2.5 rounded-full bg-zinc-100">
                      <div
                        className="absolute h-2.5 rounded-full border border-ink bg-accent"
                        style={{ left: `${(m.lowINR / maxMod) * 100}%`, width: `${Math.max(3, ((m.highINR - m.lowINR) / maxMod) * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="num whitespace-nowrap py-3 text-right font-medium">{formatRange(m.lowINR, m.highINR)}</td>
                </tr>
              ))}
              <tr className="border-t-[1.5px] border-ink font-bold">
                <td className="pt-3">Total</td>
                <td className="num pt-3">
                  {hrsLo}–{hrsHi}h
                </td>
                <td />
                <td className="num pt-3 text-right">{formatRange(modLo, modHi)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Block>

      {/* ---- Vendors + team ---- */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Block n="E" title="What vendors would quote">
          <div className="space-y-5">
            {e.vendorQuotes.map((v) => {
              const on = v.vendorType.toLowerCase().startsWith(r.vendorType.toLowerCase().split(" ")[0]);
              return (
                <div key={v.vendorType}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={on ? "font-bold" : "font-medium"}>
                      {on && "▸ "}
                      {v.vendorType}
                    </span>
                    <span className="num text-sm">
                      {formatRange(v.lowINR, v.highINR)} <span className="text-zinc-500">· {v.timelineWeeksLow}–{v.timelineWeeksHigh}wk</span>
                    </span>
                  </div>
                  <div className="relative mt-2 h-2.5 rounded-full bg-zinc-100">
                    <div
                      className={`absolute h-2.5 rounded-full border border-ink ${on ? "bg-cobalt" : "bg-zinc-300"}`}
                      style={{ left: `${(v.lowINR / maxVendor) * 100}%`, width: `${Math.max(3, ((v.highINR - v.lowINR) / maxVendor) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">{v.notes}</p>
                </div>
              );
            })}
          </div>
        </Block>
        <Block n="F" title="Team & reasoning">
          <List items={r.team} icon="●" tone="bg-sheet" />
          <p className="mt-5 border-t border-dashed border-zinc-300 pt-4 text-sm leading-relaxed text-ink-2">{r.reasoning}</p>
        </Block>
      </div>

      {/* ---- Recurring + milestones ---- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Block n="G" title="Running costs, monthly">
          <ul className="space-y-2.5">
            {e.recurringCosts.map((c, i) => (
              <li key={i} className="text-sm">
                <div className="flex items-baseline">
                  <span>{c.item}</span>
                  <span className="dots" />
                  <span className="num shrink-0">{formatRange(c.monthlyLowINR, c.monthlyHighINR)}</span>
                </div>
                <div className="text-xs text-zinc-500">{c.notes}</div>
              </li>
            ))}
          </ul>
          <div className="num mt-4 flex justify-between border-t-[1.5px] border-ink pt-3 text-sm font-bold">
            <span>Total / month</span>
            <span>{formatRange(monthlyLo, monthlyHi)}</span>
          </div>
        </Block>
        <Block n="H" title="Payment milestones">
          <div className="flex h-4 overflow-hidden rounded-full border-[1.5px] border-ink">
            {e.paymentMilestones.map((p, i) => (
              <div key={i} className={MILESTONE_COLORS[i % MILESTONE_COLORS.length]} style={{ width: `${p.percent}%` }} />
            ))}
          </div>
          <ul className="mt-5 space-y-2.5">
            {e.paymentMilestones.map((p, i) => (
              <li key={i} className="flex items-baseline text-sm">
                <span className={`mr-2.5 h-3 w-3 shrink-0 translate-y-0.5 rounded-sm border border-ink ${MILESTONE_COLORS[i % MILESTONE_COLORS.length]}`} />
                <span>{p.milestone}</span>
                <span className="dots" />
                <span className="num shrink-0">
                  {p.percent}% · {formatINRCompact((r.mostLikelyINR * p.percent) / 100)}
                </span>
              </li>
            ))}
          </ul>
        </Block>
      </div>

      {/* ---- Drivers / savings / risks ---- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Block n="I" title="Price drivers">
          <List items={e.costDrivers} icon="↑" tone="bg-accent-soft" />
        </Block>
        <Block n="J" title="Ways to save">
          <List items={e.costSavingOptions} icon="↓" tone="bg-lime" />
        </Block>
        <Block n="K" title="Risks">
          <List items={e.risks} icon="!" tone="bg-brand-200" />
        </Block>
      </div>

      {/* ---- Evidence ---- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Block n="L" title="Market rates used">
          <ul className="space-y-2.5">
            {e.marketRates.map((m, i) => (
              <li key={i} className="text-sm">
                <div className="flex items-baseline">
                  <span>{m.role}</span>
                  <span className="dots" />
                  <span className="num shrink-0">
                    ₹{m.hourlyLowINR.toLocaleString("en-IN")}–{m.hourlyHighINR.toLocaleString("en-IN")}/h
                  </span>
                </div>
                <div className="text-xs text-zinc-500">{m.source}</div>
              </li>
            ))}
          </ul>
        </Block>
        <Block n="M" title="Comparable prices">
          <ul className="space-y-2.5">
            {e.comparables.map((c, i) => (
              <li key={i} className="text-sm">
                <div className="flex items-baseline">
                  <span>{c.description}</span>
                  <span className="dots" />
                  <span className="num shrink-0">{c.priceRange}</span>
                </div>
                <div className="text-xs text-zinc-500">{c.source}</div>
              </li>
            ))}
          </ul>
        </Block>
      </div>

      <div className="sheet relative overflow-hidden bg-lime p-6 sm:p-8">
        <div className="kicker !text-ink/70">Client-ready paragraph</div>
        <p className="mt-3 font-display text-[clamp(1.4rem,2.4vw,2rem)] leading-snug">&ldquo;{e.clientPitch}&rdquo;</p>
        <button onClick={() => copy("pitch", e.clientPitch)} className="no-print btn mt-5 px-4 py-2 text-sm">
          {copied === "pitch" ? "Copied ✓" : "Copy paragraph"}
        </button>
      </div>

      <Block n="N" title={`Sources (${sources.length}) · ${queries.length} searches`}>
        <p className="mb-4 text-xs text-zinc-500">Confidence note: {e.confidenceReason}</p>
        <ul className="grid gap-x-6 gap-y-1.5 md:grid-cols-2">
          {sources.slice(0, 30).map((s) => (
            <li key={s.url} className="truncate text-sm">
              <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                <span className="num text-xs text-zinc-500">{host(s.url)}</span> · {s.title}
              </a>
            </li>
          ))}
        </ul>
        {notes && (
          <details className="no-print mt-5">
            <summary className="kicker cursor-pointer hover:text-ink">Show raw research notes</summary>
            <pre className="num mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-paper-2 p-4 text-xs leading-relaxed text-ink-2">{notes}</pre>
          </details>
        )}
        <p className="num mt-4 text-[11px] text-zinc-400">Generated by {model}. Excl. GST; validate with the client&apos;s final scope.</p>
      </Block>
    </div>
  );
}
