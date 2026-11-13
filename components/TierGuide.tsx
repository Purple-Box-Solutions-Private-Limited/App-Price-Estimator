import Link from "next/link";
import { DEFAULT_INPUT, DESIGN_LEVELS, FEATURES, PROJECT_TYPES, SCALE_LEVELS, URGENCY, VENDORS } from "@/lib/pricing";
import { formatINRCompact, formatRange, roundQuote } from "@/lib/format";
import { inputToQuery } from "@/lib/url";
import { TypeIcon } from "./ui";

function H2({ id, n, children, sub }: { id: string; n: string; children: React.ReactNode; sub?: string }) {
  return (
    <div id={id} className="mb-6 grid scroll-mt-32 gap-2 border-b-[1.5px] border-ink pb-3 md:grid-cols-[1fr_minmax(0,420px)] md:items-end">
      <h2 className="flex items-baseline gap-3 text-5xl leading-none">
        <span className="italic text-accent">{n}</span>
        {children}
      </h2>
      {sub && <p className="text-sm text-ink-2 md:text-right">{sub}</p>}
    </div>
  );
}

export default function TierGuide() {
  const minLog = Math.log10(PROJECT_TYPES[0].market[0]);
  const maxLog = Math.log10(PROJECT_TYPES[PROJECT_TYPES.length - 1].market[1]);
  const pct = (v: number) => ((Math.log10(v) - minLog) / (maxLog - minLog)) * 100;
  const ticks = [1e4, 1e5, 1e6, 1e7].filter((v) => v >= PROJECT_TYPES[0].market[0]);
  const small = VENDORS.find((v) => v.id === "small")!;
  const smallRate = (small.rate[0] + small.rate[1]) / 2;
  const groups = ["Core", "Commerce", "Engagement", "Advanced"] as const;
  const maxH = Math.max(...FEATURES.map((f) => f.hours[1]));

  return (
    <div className="space-y-20">
      {/* -------- Levels -------- */}
      <section>
        <H2 id="levels" n="I" sub="Low end: freelancer or template build. High end: reputable agency, custom design.">
          Project levels
        </H2>

        <div className="sheet p-6">
          <div className="relative h-6">
            {ticks.map((t) => (
              <span key={t} className="num absolute -translate-x-1/2 text-[11px] text-zinc-500" style={{ left: `${pct(t)}%` }}>
                {formatINRCompact(t)}
              </span>
            ))}
          </div>
          <div className="relative space-y-3">
            {ticks.map((t) => (
              <div key={t} className="absolute inset-y-0 border-l border-dashed border-zinc-300" style={{ left: `${pct(t)}%` }} />
            ))}
            {PROJECT_TYPES.map((t, i) => (
              <div key={t.id} className="group relative h-11">
                <div
                  className="absolute top-0 flex h-11 items-center gap-2 overflow-hidden whitespace-nowrap rounded-lg border-[1.5px] border-ink px-3 text-sm font-semibold shadow-[3px_3px_0_var(--color-ink)] transition group-hover:-translate-y-0.5"
                  style={{
                    left: `${pct(t.market[0])}%`,
                    width: `${Math.max(14, pct(t.market[1]) - pct(t.market[0]))}%`,
                    background: ["#d6f45a", "#fffdf8", "#ffe1d4", "#ff5420", "#2c4bff", "#17140f"][i],
                    color: i >= 3 ? "#fff" : "#17140f",
                  }}
                >
                  <TypeIcon id={t.id} className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t.name}</span>
                  <span className="num ml-auto pl-2 text-xs font-normal opacity-80">{formatRange(t.market[0], t.market[1])}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="kicker mt-4 text-right">log scale · INR excl. GST</div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PROJECT_TYPES.map((t, i) => (
            <article key={t.id} className="card group flex flex-col p-6 transition hover:-translate-y-1 hover:border-ink hover:shadow-[5px_5px_0_var(--color-ink)]">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-lg border-[1.5px] border-ink bg-paper transition group-hover:bg-accent group-hover:text-white">
                  <TypeIcon id={t.id} className="h-5 w-5" />
                </span>
                <span className="font-display text-4xl italic text-zinc-300">{["i", "ii", "iii", "iv", "v", "vi"][i]}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{t.name}</h3>
              <p className="text-sm text-zinc-500">{t.tagline}</p>
              <div className="num mt-4 text-3xl font-bold tracking-tight">{formatRange(t.market[0], t.market[1])}</div>
              <div className="num mt-1 text-xs text-zinc-500">
                {t.typicalWeeks[0]}–{t.typicalWeeks[1]} wk · running {formatRange(t.monthlyRunning[0], t.monthlyRunning[1])}/mo
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {t.includes.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="text-accent">✦</span>
                    {x}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-dashed border-zinc-300 pt-3 text-xs leading-relaxed text-zinc-600">
                <span className="kicker mr-1">e.g.</span> {t.examples}
                <br />
                <span className="kicker mr-1">stack</span> {t.stack}
              </p>
              <Link
                href={`/estimate?${inputToQuery({ ...DEFAULT_INPUT, projectType: t.id, pages: t.includedPages, features: [] })}`}
                className="mt-auto pt-4 text-sm font-semibold underline decoration-accent decoration-2 underline-offset-4"
              >
                Estimate this type →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* -------- Vendors -------- */}
      <section>
        <H2 id="rates" n="II" sub="Blended rate covers design, development, QA and PM. Tier-2/3 city vendors run about 18% lower.">
          Vendor rate card
        </H2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {VENDORS.map((v, i) => (
            <div key={v.id} className="sheet relative overflow-hidden p-5">
              <div className="kicker">{v.desc}</div>
              <div className="mt-1 font-display text-3xl leading-none">{v.name}</div>
              <div className="num mt-5 text-3xl font-bold">
                ₹{v.rate[0].toLocaleString("en-IN")}
                <span className="text-zinc-400">–</span>
                {v.rate[1].toLocaleString("en-IN")}
              </div>
              <div className="kicker">per hour, blended</div>
              <div className="mt-4 h-2 rounded-full bg-zinc-100">
                <div className="h-2 rounded-full border border-ink bg-accent" style={{ width: `${(v.rate[1] / 5000) * 100}%`, marginLeft: 0 }} />
              </div>
              <div className="mt-4 flex justify-between border-t border-dashed border-zinc-300 pt-3 text-xs">
                <span className="text-zinc-600">{v.fit}</span>
                <span className="num">~{v.capacity}h/wk</span>
              </div>
              <span className="pointer-events-none absolute -right-2 -top-4 font-display text-8xl italic text-zinc-100">{i + 1}</span>
            </div>
          ))}
        </div>
      </section>

      {/* -------- Features -------- */}
      <section>
        <H2
          id="features"
          n="III"
          sub={`Hands-on build time for a modern team (managed auth, SDKs, AI-assisted coding), priced at a small agency (~₹${Math.round(smallRate).toLocaleString("en-IN")}/h). On plugin-based sites it's about half. Design, QA, PM and deployment are added separately.`}
        >
          Feature costs
        </H2>
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
          {groups.map((g) => (
            <div key={g}>
              <div className="kicker mb-2">{g}</div>
              <ul>
                {FEATURES.filter((f) => f.group === g).map((f) => (
                  <li key={f.id} className="group grid grid-cols-[1fr_auto] items-center gap-x-4 border-b border-dashed border-zinc-300 py-2.5">
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="relative h-1.5 w-full max-w-[220px] rounded-full bg-zinc-100">
                          <div
                            className="absolute h-1.5 rounded-full bg-ink transition-colors group-hover:bg-accent"
                            style={{ left: `${(f.hours[0] / maxH) * 100}%`, width: `${Math.max(3, ((f.hours[1] - f.hours[0]) / maxH) * 100)}%` }}
                          />
                        </div>
                        <span className="num text-[11px] text-zinc-500">
                          {f.hours[0]}–{f.hours[1]}h
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num font-semibold">{formatRange(roundQuote(f.hours[0] * smallRate), roundQuote(f.hours[1] * smallRate))}</div>
                      {f.monthly && <div className="num text-[11px] text-zinc-500">+{formatRange(f.monthly[0], f.monthly[1])}/mo</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* -------- Method -------- */}
      <section>
        <H2 id="method" n="IV">
          How it&apos;s calculated
        </H2>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Build hours", "Core build for the type (scaled down for fewer pages), 1–3 h per extra page, plus honest hands-on hours per feature."],
              ["Add features", "Hours for each feature not already included, scaled by how heavy that build type is."],
              ["Add the real overheads", "Design (8–45% of build by level), QA 12%, PM & client calls 10%, deployment. Each is its own line, so no feature is padded. Then × scale × timeline."],
              ["Price it", "Likely hours × vendor's mid blended rate (×0.82 Tier-2/3). Range −15% / +20%, wider for thin briefs or big projects. Rounded to quotable figures."],
            ].map(([t, d], i) => (
              <div key={t} className="card p-5">
                <div className="font-display text-4xl italic text-accent">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 font-semibold">{t}</div>
                <p className="mt-1 text-sm text-ink-2">{d}</p>
              </div>
            ))}
            <div className="sheet bg-cobalt p-5 text-white sm:col-span-2">
              <div className="font-display text-3xl">
                + AI <em>deep research</em>
              </div>
              <p className="mt-2 text-sm text-white/85">
                Reads the brief for the real system and hidden scope, searches current Indian rate cards, comparable quotes and running costs, then
                prices bottom-up by module and cross-checks against the comparables. Sources and confidence included.
              </p>
            </div>
          </div>
          <div className="sheet self-start overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="kicker border-b-[1.5px] border-ink bg-ink text-left">
                  <th className="px-5 py-2.5 font-normal !text-paper/70">Factor</th>
                  <th className="px-5 py-2.5 font-normal !text-paper/70">Option</th>
                  <th className="px-5 py-2.5 text-right font-normal !text-paper/70">Effect</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...DESIGN_LEVELS.map((d) => ["Design", d.name, `+${Math.round(d.pct * 100)}% of build`]),
                  ...SCALE_LEVELS.map((s) => ["Scale", s.name, s.mult]),
                  ...URGENCY.map((u) => ["Timeline", u.name, u.mult]),
                ].map(([f, n, m]) => (
                  <tr key={`${f}-${n}`} className="border-b border-dashed border-zinc-300 last:border-0">
                    <td className="kicker px-5 py-2.5">{f}</td>
                    <td className="px-5 py-2.5">{n}</td>
                    <td
                      className={`num px-5 py-2.5 text-right font-semibold ${
                        typeof m === "string" ? "text-ink-2" : m > 1 ? "text-accent" : m < 1 ? "text-moss" : ""
                      }`}
                    >
                      {typeof m === "string" ? m : `×${m.toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
