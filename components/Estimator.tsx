"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CITY_TIERS,
  DEFAULT_INPUT,
  DESIGN_LEVELS,
  FEATURES,
  PROJECT_TYPES,
  SCALE_LEVELS,
  URGENCY,
  VENDORS,
  computeBaseline,
  type EstimateInput,
  type ProjectTypeId,
} from "@/lib/pricing";
import type { AiEstimate, Source, StreamEvent } from "@/lib/schema";
import BaselinePanel from "./BaselinePanel";
import AiReport from "./AiReport";
import ResearchLog from "./ResearchLog";

const EXAMPLES: { label: string; input: Partial<EstimateInput> }[] = [
  {
    label: "Clinic site + booking",
    input: {
      description:
        "Dental clinic in Pune with 2 branches wants a website with doctor profiles, treatments, online appointment booking with slot selection, WhatsApp/SMS reminders, Google reviews, and a simple admin to manage appointments.",
      projectType: "business",
      features: ["booking", "notifications", "seo", "admin", "maps"],
      pages: 12,
    },
  },
  {
    label: "D2C fashion store",
    input: {
      description:
        "Ethnic-wear D2C brand needs an online store with ~300 products, size variants, Razorpay & COD, Shiprocket shipping, discount coupons, GST invoices, Instagram feed, and a mobile-first premium design.",
      projectType: "ecommerce",
      features: ["payments", "catalog", "gst", "seo", "notifications", "reviews"],
      pages: 15,
      design: "premium",
    },
  },
  {
    label: "Grocery marketplace",
    input: {
      description:
        "Multi-vendor grocery marketplace for a Tier-2 city: customer app & website, vendor panel to manage inventory, delivery partner app with live tracking, wallet & UPI payments, commission management, and admin analytics.",
      projectType: "platform",
      features: ["auth", "admin", "payments", "multivendor", "mobile", "maps", "notifications", "analytics", "search"],
      pages: 40,
      scale: "growth",
      vendor: "mid",
    },
  },
  {
    label: "School ERP portal",
    input: {
      description:
        "CBSE school group with 3 campuses wants a portal for admissions, fee collection with receipts, attendance, timetable, report cards, parent-teacher communication and a parent mobile app. ~4,000 students.",
      projectType: "webapp",
      features: ["auth", "admin", "roles", "payments", "notifications", "mobile", "analytics", "migration"],
      pages: 30,
      vendor: "small",
    },
  },
];

type Phase = "idle" | "running" | "done" | "error";

function Pill({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? "border-violet-400/70 bg-violet-500/20 text-white"
          : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

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
          onClick={() => onChange(o.id)}
          className={`rounded-xl border px-3 py-2.5 text-left transition ${
            value === o.id ? "ring-brand border-transparent bg-violet-500/15" : "border-white/10 bg-white/[0.02] hover:border-white/25"
          }`}
        >
          <div className="text-sm font-medium text-white">{o.name}</div>
          {o.desc && <div className="mt-0.5 text-xs leading-snug text-zinc-500">{o.desc}</div>}
        </button>
      ))}
    </div>
  );
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <span className="text-sm font-semibold text-zinc-200">{children}</span>
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </div>
  );
}

export default function Estimator() {
  const [input, setInput] = useState<EstimateInput>(DEFAULT_INPUT);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [queries, setQueries] = useState<string[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [estimate, setEstimate] = useState<AiEstimate | null>(null);
  const [model, setModel] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const baseline = useMemo(() => computeBaseline(input), [input]);
  const set = <K extends keyof EstimateInput>(k: K, v: EstimateInput[K]) => setInput((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setAiAvailable(Boolean(d.ai)))
      .catch(() => setAiAvailable(false));
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const toggleFeature = (id: string) =>
    set("features", input.features.includes(id) ? input.features.filter((f) => f !== id) : [...input.features, id]);

  const chooseType = (id: ProjectTypeId) => {
    const t = PROJECT_TYPES.find((x) => x.id === id)!;
    setInput((p) => ({ ...p, projectType: id, pages: Math.max(p.pages, Math.min(t.includedPages, 40)) }));
  };

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
    setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: ac.signal,
      });
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
              setPhase("done");
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

  const canResearch = input.description.trim().length >= 15 && aiAvailable !== false;
  const groups = ["Core", "Commerce", "Engagement", "Advanced"] as const;

  return (
    <section id="estimate" className="relative mx-auto max-w-7xl px-5 py-24">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-300">Estimator</p>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Paste the client&apos;s requirement. Get a defensible price.</h2>
        <p className="mt-4 text-zinc-400">
          The instant estimate updates as you type. Hit <span className="text-white">Deep research</span> and the AI reads the brief, figures out what
          system the client actually needs, searches the web for current Indian rates and comparable quotes, and returns a reconciled breakdown in INR.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* ---------------- Form ---------------- */}
        <div className="glass space-y-8 rounded-3xl p-6 sm:p-8">
          <div>
            <Label hint={`${input.description.length}/6000`}>Client requirement</Label>
            <textarea
              value={input.description}
              onChange={(e) => set("description", e.target.value.slice(0, 6000))}
              rows={6}
              placeholder="e.g. We are a 40-year-old textile manufacturer in Surat. We want a B2B website where dealers can log in, see our catalogue with dealer pricing, place bulk orders and track dispatch. Our sales team should get orders in Tally…"
              className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-4 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/60 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500">Try an example:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => setInput({ ...DEFAULT_INPUT, ...ex.input })}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 transition hover:border-cyan-400/50 hover:text-cyan-200"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>What kind of system is it?</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => chooseType(t.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    input.projectType === t.id ? "ring-brand border-transparent bg-violet-500/15" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                  }`}
                >
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{t.tagline}</div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">Not sure? Pick the closest — deep research will re-classify it from the brief.</p>
          </div>

          <div>
            <Label hint={`${input.features.length} selected`}>Features</Label>
            <div className="space-y-3">
              {groups.map((g) => (
                <div key={g} className="flex flex-wrap items-center gap-2">
                  <span className="w-24 shrink-0 text-xs uppercase tracking-wider text-zinc-600">{g}</span>
                  {FEATURES.filter((f) => f.group === g).map((f) => {
                    const included = f.includedIn?.includes(input.projectType);
                    return (
                      <Pill
                        key={f.id}
                        active={input.features.includes(f.id) || Boolean(included)}
                        onClick={() => toggleFeature(f.id)}
                        title={included ? "Already included in this project type" : `${f.hours[0]}–${f.hours[1]} hrs`}
                      >
                        {f.name}
                        {included && <span className="ml-1.5 text-[10px] text-violet-300">incl.</span>}
                      </Pill>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label hint={`${input.pages} pages / screens`}>Size</Label>
            <input
              type="range"
              min={1}
              max={120}
              value={input.pages}
              onChange={(e) => set("pages", Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-[11px] text-zinc-600">
              <span>1</span>
              <span>30</span>
              <span>60</span>
              <span>90</span>
              <span>120</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label>Design</Label>
              <Segment options={DESIGN_LEVELS} value={input.design} onChange={(v) => set("design", v)} />
            </div>
            <div>
              <Label>Timeline</Label>
              <Segment options={URGENCY} value={input.urgency} onChange={(v) => set("urgency", v)} />
            </div>
          </div>

          <div>
            <Label>Scale & reliability</Label>
            <Segment options={SCALE_LEVELS} value={input.scale} onChange={(v) => set("scale", v)} />
          </div>

          <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <Label>Who will build it?</Label>
              <Segment options={VENDORS} value={input.vendor} onChange={(v) => set("vendor", v)} />
            </div>
            <div>
              <Label>Vendor location</Label>
              <div className="flex gap-2">
                {CITY_TIERS.map((c) => (
                  <Pill key={c.id} active={input.city === c.id} onClick={() => set("city", c.id)} title={c.name}>
                    {c.id === "metro" ? "Metro" : "Tier-2/3"}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Live baseline ---------------- */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <BaselinePanel baseline={baseline} />
          <div className="glass mt-4 rounded-2xl p-5">
            <button
              type="button"
              disabled={!canResearch || phase === "running"}
              onClick={runResearch}
              className="bg-gradient-brand group relative w-full overflow-hidden rounded-xl px-5 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {phase === "running" ? `Researching… ${elapsed}s` : "✦ Deep research with AI"}
            </button>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              {aiAvailable === false
                ? "AI research is off — add ANTHROPIC_API_KEY to .env.local to enable live market research. The instant estimate above still works."
                : input.description.trim().length < 15
                  ? "Describe the requirement above (at least a sentence) to enable deep research."
                  : "Searches current Indian pricing, rate cards & running costs. Takes ~1–3 minutes."}
            </p>
            {phase === "running" && (
              <button type="button" onClick={() => abortRef.current?.abort()} className="mt-2 text-xs text-zinc-400 underline hover:text-white">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- AI report ---------------- */}
      <div ref={reportRef} className="scroll-mt-6">
        {phase !== "idle" && (
          <div className="mt-10 space-y-6">
            {(phase === "running" || phase === "error") && (
              <ResearchLog statuses={statuses} queries={queries} sources={sources} running={phase === "running"} />
            )}
            {phase === "error" && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
                <strong className="font-semibold">Research failed:</strong> {error}
                <button type="button" onClick={runResearch} className="ml-3 underline">
                  Retry
                </button>
              </div>
            )}
            {phase === "done" && estimate && (
              <AiReport estimate={estimate} sources={sources} notes={notes} queries={queries} model={model} baseline={baseline} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
