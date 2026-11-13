"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CITY_TIERS,
  DEFAULT_INPUT,
  DESIGN_LEVELS,
  ECOM_PLATFORMS,
  FEATURES,
  PROJECT_TYPES,
  SCALE_LEVELS,
  URGENCY,
  VENDORS,
  amcRange,
  computeBaseline,
  normalizeInput,
  type EstimateInput,
  type ProjectTypeId,
} from "@/lib/pricing";
import type { AiEstimate, Source, StreamEvent } from "@/lib/schema";
import { EXAMPLES } from "@/lib/examples";
import { MAX_URL_DESCRIPTION, inputToQuery } from "@/lib/url";
import { getSaved, newId, upsertSaved, type SavedQuote } from "@/lib/saved";
import { getApiKey, looksLikeKey, setApiKey } from "@/lib/apiKey";
import { formatINRCompact } from "@/lib/format";
import BaselinePanel from "./BaselinePanel";
import AiReport from "./AiReport";
import ResearchLog from "./ResearchLog";
import QuoteBuilder, { DEFAULT_QUOTE, type QuoteBasis } from "./QuoteBuilder";
import { SectionTitle, TypeIcon } from "./ui";

type Phase = "idle" | "running" | "done" | "error";

function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; name: string; desc?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`tile px-3 py-2.5 text-left ${value === o.id ? "tile-on" : ""}`}
        >
          <div className="text-sm font-semibold">{o.name}</div>
          {o.desc && <div className="tile-sub mt-0.5 text-xs leading-snug text-zinc-500">{o.desc}</div>}
        </button>
      ))}
    </div>
  );
}

const stableKey = (i: EstimateInput) => JSON.stringify(i);

export default function Estimator({ initialInput, initialName, savedId }: { initialInput: EstimateInput; initialName: string; savedId?: string }) {
  const [input, setInput] = useState<EstimateInput>(initialInput);
  const [name, setName] = useState(initialName);
  const [id, setId] = useState<string | undefined>(undefined);
  const [loadError, setLoadError] = useState("");
  const [savedAt, setSavedAt] = useState<string>("");
  const [dirty, setDirty] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [quote, setQuote] = useState<SavedQuote>(DEFAULT_QUOTE);

  const [serverAi, setServerAi] = useState<boolean | null>(null);
  const [userKey, setUserKey] = useState("");
  const [keyDraft, setKeyDraft] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [queries, setQueries] = useState<string[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [estimate, setEstimate] = useState<AiEstimate | null>(null);
  const [aiInputKey, setAiInputKey] = useState("");
  const [model, setModel] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const baseline = useMemo(() => computeBaseline(input), [input]);
  const set = <K extends keyof EstimateInput>(k: K, v: EstimateInput[K]) => {
    setInput((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };

  useEffect(() => {
    setUserKey(getApiKey());
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setServerAi(Boolean(d.ai)))
      .catch(() => setServerAi(false));
  }, []);

  // Open a saved estimate (?id=...)
  useEffect(() => {
    if (!savedId) return;
    const s = getSaved(savedId);
    if (!s) {
      setLoadError("That saved estimate isn't in this browser. Saved estimates live in the browser where they were created.");
      return;
    }
    setId(s.id);
    setName(s.name);
    setInput(normalizeInput(s.input));
    setSavedAt(s.updatedAt);
    setQuote(s.quote ?? DEFAULT_QUOTE);
    if (s.ai) {
      setEstimate(s.ai.estimate);
      setSources(s.ai.sources);
      setNotes(s.ai.notes);
      setQueries(s.ai.queries);
      setModel(s.ai.model);
      setAiInputKey(stableKey(s.input));
      setPhase("done");
    }
  }, [savedId]);

  // Keep the URL in sync so the page can be refreshed, bookmarked or shared
  useEffect(() => {
    const t = setTimeout(() => {
      const q = inputToQuery(input, name.trim() || undefined);
      window.history.replaceState(null, "", `/estimate?${id ? `id=${id}&` : ""}${q}`);
    }, 400);
    return () => clearTimeout(t);
  }, [input, name, id]);

  useEffect(() => {
    if (phase !== "running") return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const toggleFeature = (fid: string) =>
    set("features", input.features.includes(fid) ? input.features.filter((f) => f !== fid) : [...input.features, fid]);

  const chooseType = (tid: ProjectTypeId) => {
    const t = PROJECT_TYPES.find((x) => x.id === tid)!;
    setInput((p) => ({ ...p, projectType: tid, pages: Math.max(p.pages, Math.min(t.includedPages, 40)) }));
    setDirty(true);
  };

  const aiReady = Boolean(userKey) || serverAi === true;
  const aiStale = phase === "done" && estimate !== null && aiInputKey !== stableKey(input);

  function save() {
    const now = new Date().toISOString();
    const useAi = phase === "done" && estimate && !aiStale;
    const sid = id ?? newId();
    const fallbackName = name.trim() || (useAi ? estimate!.systemType : `${baseline.type.name} estimate`);
    const existing = id ? getSaved(id) : undefined;
    upsertSaved({
      id: sid,
      name: fallbackName,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      input,
      summary: useAi
        ? {
            typeName: estimate!.systemType,
            vendorName: estimate!.recommended.vendorType,
            low: estimate!.recommended.lowINR,
            likely: estimate!.recommended.mostLikelyINR,
            high: estimate!.recommended.highINR,
            weeks: [estimate!.recommended.timelineWeeksLow, estimate!.recommended.timelineWeeksHigh],
            source: "ai",
          }
        : {
            typeName: baseline.type.name,
            vendorName: baseline.selected.vendor.name,
            low: baseline.selected.low,
            likely: baseline.selected.likely,
            high: baseline.selected.high,
            weeks: baseline.selected.weeks,
            source: "instant",
          },
      quote,
      ai: estimate && phase === "done" ? { estimate, sources, notes, queries, model } : null,
    });
    setId(sid);
    setName(fallbackName);
    setSavedAt(now);
    setDirty(false);
  }

  async function copyLink() {
    const url = `${window.location.origin}/estimate?${inputToQuery(input, name.trim() || undefined)}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1800);
  }

  function saveKey() {
    if (!looksLikeKey(keyDraft)) {
      setError("That doesn't look like an Anthropic key. It should start with sk-ant-.");
      return;
    }
    setApiKey(keyDraft);
    setUserKey(keyDraft.trim());
    setKeyDraft("");
    setError("");
  }

  async function runResearch() {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setPhase("running");
    setStatuses([]);
    setQueries([]);
    setSources([]);
    setNotes("");
    setEstimate(null);
    setError("");
    setElapsed(0);
    const runKey = stableKey(input);
    setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userKey) headers["x-anthropic-key"] = userKey;
      const res = await fetch("/api/estimate", { method: "POST", headers, body: JSON.stringify(input), signal: ac.signal });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let gotResult = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const chunk = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2);
          if (!chunk.startsWith("data:")) continue;
          const ev = JSON.parse(chunk.slice(5)) as StreamEvent;
          switch (ev.type) {
            case "status":
              setStatuses((s) => [...s, ev.message]);
              break;
            case "search":
              setQueries((q) => [...q, ev.query]);
              break;
            case "source":
              setSources((s) => [...s, ev.source]);
              break;
            case "notes":
              setNotes(ev.text);
              break;
            case "result":
              gotResult = true;
              setEstimate(ev.estimate);
              setSources(ev.sources);
              setModel(ev.model);
              setAiInputKey(runKey);
              setPhase("done");
              setDirty(true);
              break;
            case "error":
              throw new Error(ev.message);
          }
        }
      }
      if (!gotResult) throw new Error("The research stream ended unexpectedly. Please retry.");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setPhase("idle");
        return;
      }
      setError((e as Error).message);
      setPhase("error");
    }
  }

  const descOk = input.description.trim().length >= 15;
  const canResearch = descOk && aiReady;
  const groups = ["Core", "Commerce", "Engagement", "Advanced"] as const;

  const useAiForQuote = phase === "done" && estimate !== null && !aiStale;
  const quoteBasis: QuoteBasis = useAiForQuote
    ? {
        source: "ai",
        title: estimate!.systemType,
        low: estimate!.recommended.lowINR,
        likely: estimate!.recommended.mostLikelyINR,
        high: estimate!.recommended.highINR,
        weeks: [estimate!.recommended.timelineWeeksLow, estimate!.recommended.timelineWeeksHigh],
        monthly: [
          estimate!.recurringCosts.reduce((s, c) => s + c.monthlyLowINR, 0),
          estimate!.recurringCosts.reduce((s, c) => s + c.monthlyHighINR, 0),
        ],
        scope: estimate!.modules.map((m) => m.name),
        assumptions: estimate!.assumptions,
        milestones: estimate!.paymentMilestones,
        amc: amcRange(input, estimate!.recommended.mostLikelyINR),
      }
    : {
        source: "instant",
        title: `${baseline.type.name} (${input.pages} pages/screens)`,
        low: baseline.selected.low,
        likely: baseline.selected.likely,
        high: baseline.selected.high,
        weeks: baseline.selected.weeks,
        monthly: baseline.monthly,
        amc: baseline.amc,
        scope: baseline.lineItems.map((l) => l.name),
        assumptions: [
          `${DESIGN_LEVELS.find((d) => d.id === input.design)!.name} design`,
          "Content (text, images) provided by the client",
          "Domain, hosting and third-party service fees billed separately",
        ],
      };

  const steps = [
    { id: "s-brief", n: "01", label: "Brief", done: descOk },
    { id: "s-type", n: "02", label: "System", done: true },
    { id: "s-features", n: "03", label: "Features", done: input.features.length > 0 },
    { id: "s-size", n: "04", label: "Size & quality", done: true },
    { id: "s-vendor", n: "05", label: "Builder", done: true },
    { id: "s-research", n: "06", label: "AI research", done: phase === "done" && !aiStale },
    { id: "quote", n: "07", label: "Quote", done: false },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-10 sm:px-8">
      {/* -------- Title bar -------- */}
      <div data-print-group className="no-print flex flex-wrap items-end gap-x-6 gap-y-3 border-b-[1.5px] border-ink pb-5 pt-8">
        <div className="min-w-0 flex-1">
          <div className="kicker flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${savedAt && !dirty ? "bg-moss" : "bg-accent"}`} />
            {savedAt
              ? dirty
                ? "Unsaved changes"
                : `Filed ${new Date(savedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
              : "New estimate · not saved"}
          </div>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value.slice(0, 120));
              setDirty(true);
            }}
            placeholder="Untitled estimate…"
            aria-label="Estimate name"
            className="mt-1 w-full bg-transparent font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-tight text-ink placeholder:italic placeholder:text-zinc-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyLink}
            title={input.description.length > MAX_URL_DESCRIPTION ? "Brief is too long for a link and will be left out" : "Copy a link with these inputs"}
            className="btn px-3.5 py-2 text-sm"
          >
            {linkCopied ? "Copied ✓" : "⧉ Copy link"}
          </button>
          <a href="/estimate" className="btn px-3.5 py-2 text-sm">
            ＋ New
          </a>
          <button type="button" onClick={save} className="btn btn-ink px-4 py-2 text-sm">
            {id ? "Save changes" : "Save estimate"}
          </button>
        </div>
      </div>

      {loadError && <div className="no-print mt-5 rounded-xl border-[1.5px] border-ink bg-accent-soft p-3 text-sm">{loadError}</div>}

      <div data-print-group className="no-print mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[150px_minmax(0,1fr)_400px]">
        {/* -------- Step rail -------- */}
        <nav className="hidden xl:block" aria-label="Steps">
          <ol className="sticky top-36 space-y-1">
            {steps.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-paper-2">
                  <span
                    className={`num grid h-6 w-6 place-items-center rounded-full border-[1.5px] text-[10px] ${
                      s.done ? "border-ink bg-ink text-lime" : "border-zinc-400 text-zinc-500 group-hover:border-ink"
                    }`}
                  >
                    {s.done ? "✓" : s.n}
                  </span>
                  <span className={s.done ? "text-ink" : "text-zinc-500"}>{s.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* -------- Form -------- */}
        <div className="min-w-0 space-y-12">
          <section>
            <SectionTitle id="s-brief" n="01" title="The brief" hint={`${input.description.length} / 6000`} />
            <div className="sheet overflow-hidden">
              <textarea
                value={input.description}
                onChange={(e) => set("description", e.target.value.slice(0, 6000))}
                rows={6}
                aria-label="Client brief"
                placeholder="Paste the client's brief, email or call notes. e.g. We are a textile manufacturer in Surat. We want a B2B website where dealers can log in, see our catalogue with dealer pricing, place bulk orders and track dispatch…"
                className="block w-full resize-y bg-transparent p-5 text-[16px] leading-relaxed text-ink placeholder:text-zinc-400 focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-1.5 border-t border-dashed border-zinc-300 bg-paper-2/50 px-4 py-2.5">
                <span className="kicker mr-1">templates</span>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      setInput(normalizeInput({ ...DEFAULT_INPUT, ...ex.input }));
                      setDirty(true);
                    }}
                    className="chip !py-0.5 !text-xs"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <SectionTitle id="s-type" n="02" title="What is it, really?" hint="AI re-classifies from the brief" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PROJECT_TYPES.map((t) => {
                const on = input.projectType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => chooseType(t.id)}
                    className={`tile relative overflow-hidden p-4 text-left ${on ? "tile-on" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`grid h-10 w-10 place-items-center rounded-lg border-[1.5px] ${on ? "border-paper/30 bg-accent text-white" : "border-ink bg-paper"}`}>
                        <TypeIcon id={t.id} className="h-5 w-5" />
                      </span>
                      <span className={`num text-[11px] ${on ? "text-lime" : "text-zinc-500"}`}>from {formatINRCompact(t.market[0])}</span>
                    </div>
                    <div className="mt-3 font-semibold">{t.name}</div>
                    <div className="tile-sub text-xs text-zinc-500">{t.tagline}</div>
                  </button>
                );
              })}
            </div>
            {input.projectType === "ecommerce" && (
              <div className="fade-up mt-4">
                <div className="kicker mb-2">Store platform · biggest single price swing</div>
                <Segment options={ECOM_PLATFORMS} value={input.ecomPlatform} onChange={(v) => set("ecomPlatform", v)} />
              </div>
            )}
          </section>

          <section>
            <SectionTitle id="s-features" n="03" title="Features" hint={`${input.features.length} picked · hover for hours`} />
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g} className="grid gap-2 sm:grid-cols-[110px_1fr]">
                  <span className="kicker pt-1.5">{g}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {FEATURES.filter((f) => f.group === g).map((f) => {
                      const included = f.includedIn?.includes(input.projectType);
                      const on = input.features.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          aria-pressed={on || Boolean(included)}
                          onClick={() => toggleFeature(f.id)}
                          title={
                            included
                              ? "Already included in this project type"
                              : f.id === "mobile"
                                ? `≈${f.hours[0]}–${f.hours[1]} hrs per app (cross-platform, Android + iOS)`
                                : `≈${Math.round(f.hours[0] * baseline.featureScale)}–${Math.round(f.hours[1] * baseline.featureScale)} hrs for this build`
                          }
                          className={`chip ${included ? "chip-incl" : on ? "chip-on" : ""}`}
                        >
                          <span className="num text-[10px]">{included ? "INCL" : on ? "✓" : "+"}</span>
                          {f.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {input.features.includes("mobile") && (
              <div className="fade-up mt-4 flex flex-wrap items-center gap-2 rounded-xl border-[1.5px] border-dashed border-zinc-400 px-4 py-3">
                <span className="kicker mr-1">How many separate apps?</span>
                {[
                  [1, "1 app"],
                  [2, "2 apps"],
                  [3, "3 apps"],
                ].map(([n, label]) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set("mobileApps", n as number)}
                    className={`chip ${input.mobileApps === n ? "chip-on" : ""}`}
                  >
                    {label}
                  </button>
                ))}
                <span className="text-xs text-zinc-500">e.g. customer + vendor + delivery = 3. Each extra app ≈ +60% (shared backend).</span>
              </div>
            )}
          </section>

          <section>
            <SectionTitle id="s-size" n="04" title="Size & quality" />
            <div className="card p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="kicker">Pages / screens</div>
                  <div className="num text-5xl font-semibold leading-none">{input.pages}</div>
                </div>
                <div className="flex gap-1.5">
                  {[5, 10, 20, 40, 80].map((n) => (
                    <button key={n} type="button" onClick={() => set("pages", n)} className={`chip num !px-2.5 !text-xs ${input.pages === n ? "chip-on" : ""}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={120}
                value={input.pages}
                onChange={(e) => set("pages", Number(e.target.value))}
                className="mt-4 w-full"
                aria-label="Pages or screens"
              />
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <div className="kicker mb-2">Design</div>
                <Segment options={DESIGN_LEVELS} value={input.design} onChange={(v) => set("design", v)} />
              </div>
              <div>
                <div className="kicker mb-2">Timeline</div>
                <Segment options={URGENCY} value={input.urgency} onChange={(v) => set("urgency", v)} />
              </div>
            </div>
            <div className="mt-5">
              <div className="kicker mb-2">Scale & reliability</div>
              <Segment options={SCALE_LEVELS} value={input.scale} onChange={(v) => set("scale", v)} />
            </div>
          </section>

          <section>
            <SectionTitle id="s-vendor" n="05" title="Who builds it" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {VENDORS.map((v) => {
                const on = input.vendor === v.id;
                return (
                  <button key={v.id} type="button" aria-pressed={on} onClick={() => set("vendor", v.id)} className={`tile p-4 text-left ${on ? "tile-on" : ""}`}>
                    <div className="font-semibold">{v.name}</div>
                    <div className="tile-sub text-xs text-zinc-500">{v.desc}</div>
                    <div className={`num mt-3 text-sm ${on ? "text-lime" : "text-ink"}`}>
                      ₹{v.rate[0].toLocaleString("en-IN")}–{v.rate[1].toLocaleString("en-IN")}/h
                    </div>
                  </button>
                );
              })}
            </div>
            <div className={`mt-3 flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] p-3 ${input.vendor === "own" ? "tile-on" : "border-dashed border-zinc-400"}`}>
              <button
                type="button"
                aria-pressed={input.vendor === "own"}
                disabled={!input.myRate}
                onClick={() => set("vendor", "own")}
                className="font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {input.vendor === "own" ? "✓ " : ""}Me / my team
              </button>
              <label className="flex shrink-0 items-center gap-2 text-sm">
                <span className={`whitespace-nowrap ${input.vendor === "own" ? "text-paper/70" : "text-zinc-600"}`}>your blended rate ₹</span>
                <input
                  type="number"
                  min={0}
                  max={20000}
                  step={50}
                  value={input.myRate || ""}
                  placeholder="e.g. 1200"
                  onChange={(e) => {
                    const r = Math.min(20000, Math.max(0, Math.round(Number(e.target.value) || 0)));
                    setInput((p) => ({ ...p, myRate: r, vendor: r ? "own" : p.vendor === "own" ? "small" : p.vendor }));
                    setDirty(true);
                  }}
                  className="field num w-28 px-2 py-1.5 text-sm"
                  aria-label="Your blended hourly rate in rupees"
                />
                <span className={input.vendor === "own" ? "text-paper/70" : "text-zinc-600"}>/h</span>
              </label>
              <span className={`text-xs ${input.vendor === "own" ? "text-paper/70" : "text-zinc-500"}`}>
                Prices this scope at your own rate. Market quotes stay on the receipt for comparison.
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="kicker">Vendor city</span>
              {CITY_TIERS.map((c) => (
                <button key={c.id} type="button" onClick={() => set("city", c.id)} title={c.name} className={`chip ${input.city === c.id ? "chip-on" : ""}`}>
                  {c.id === "metro" ? "Metro" : "Tier-2/3 (−18%)"}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* -------- Receipt + AI -------- */}
        <aside className="space-y-8 lg:sticky lg:top-32 lg:self-start">
          <BaselinePanel baseline={baseline} city={input.city} />

          <div id="s-research" className="sheet relative scroll-mt-32 overflow-hidden">
            <div className="flex items-center justify-between border-b-[1.5px] border-ink bg-cobalt px-4 py-2.5 text-white">
              <span className="font-display text-2xl leading-none">
                AI <em>analyst</em>
              </span>
              <span className="num text-[10px] uppercase tracking-widest text-white/75">
                {aiReady ? (userKey ? "your key ✓" : "server key ✓") : serverAi === null ? "checking…" : "needs key"}
              </span>
            </div>
            <div className="p-4">
              <p className="text-sm leading-relaxed text-ink-2">
                Reads the brief, searches current Indian rate cards and comparable quotes, then prices it module by module. 1–3 minutes.
              </p>

              {serverAi !== null && !aiReady ? (
                <form
                  className="mt-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveKey();
                  }}
                >
                  <label htmlFor="key" className="kicker">
                    Your Anthropic API key
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="key"
                      type="password"
                      value={keyDraft}
                      onChange={(e) => setKeyDraft(e.target.value)}
                      placeholder="sk-ant-..."
                      autoComplete="off"
                      spellCheck={false}
                      className="field num min-w-0 flex-1 px-3 py-2 text-sm"
                    />
                    <button type="submit" disabled={!keyDraft.trim()} className="btn btn-cobalt px-3 py-2 text-sm">
                      Save
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    Stays in this browser only.{" "}
                    <Link href="/settings" className="underline">
                      Manage
                    </Link>
                  </p>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={!canResearch || phase === "running"}
                    onClick={runResearch}
                    className="btn btn-cobalt mt-4 w-full px-4 py-3 text-sm"
                  >
                    {phase === "running" ? <span className="num">Researching… {elapsed}s</span> : phase === "done" ? "↻ Re-run research" : "✦ Run deep research"}
                  </button>
                  {!descOk && <p className="mt-2 text-xs text-zinc-500">Write at least a sentence in the brief to enable.</p>}
                  {phase === "running" && (
                    <button type="button" onClick={() => abortRef.current?.abort()} className="mt-2 text-xs underline">
                      Cancel
                    </button>
                  )}
                </>
              )}
              {aiStale && <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-xs">Inputs changed since the last research. Re-run to update it.</p>}
              {phase !== "error" && error && <p className="mt-2 text-xs text-brand-700">{error}</p>}
            </div>
          </div>
        </aside>
      </div>

      {/* -------- AI report -------- */}
      <div ref={reportRef} data-print-group className="scroll-mt-32">
        {phase !== "idle" && (
          <section className="mt-16 space-y-6">
            <div className="no-print flex items-baseline gap-3 border-b-[1.5px] border-ink pb-3">
              <span className="font-display text-5xl leading-none text-cobalt">06</span>
              <h2 className="text-5xl leading-none">
                The <em>research</em>
              </h2>
            </div>
            {(phase === "running" || phase === "error") && (
              <ResearchLog statuses={statuses} queries={queries} sources={sources} running={phase === "running"} elapsed={elapsed} />
            )}
            {phase === "error" && (
              <div className="rounded-xl border-[1.5px] border-ink bg-accent-soft p-4 text-sm">
                <strong>Research failed:</strong> {error}
                <button type="button" onClick={runResearch} className="ml-3 font-semibold underline">
                  Retry
                </button>
              </div>
            )}
            {phase === "done" && estimate && (
              <AiReport estimate={estimate} sources={sources} notes={notes} queries={queries} model={model} baseline={baseline} />
            )}
          </section>
        )}
      </div>

      {/* -------- Quote -------- */}
      <section id="quote" data-print-group className="mt-16 scroll-mt-32">
        <div className="no-print mb-6 flex items-baseline gap-3 border-b-[1.5px] border-ink pb-3">
          <span className="font-display text-5xl leading-none text-accent">07</span>
          <h2 className="text-5xl leading-none">
            The <em>quote</em>
          </h2>
        </div>
        <QuoteBuilder
          basis={quoteBasis}
          clientName={name.trim()}
          value={quote}
          onChange={(q) => {
            setQuote(q);
            setDirty(true);
          }}
        />
      </section>
    </div>
  );
}
