import { PROJECT_TYPES, VENDORS } from "@/lib/pricing";
import { formatINRCompact, formatRange } from "@/lib/format";

const ACCENTS = [
  "from-emerald-400/30 to-emerald-400/0",
  "from-sky-400/30 to-sky-400/0",
  "from-violet-400/30 to-violet-400/0",
  "from-fuchsia-400/30 to-fuchsia-400/0",
  "from-amber-400/30 to-amber-400/0",
  "from-rose-400/30 to-rose-400/0",
];

const BARS = [
  "from-emerald-400 to-emerald-300",
  "from-sky-400 to-sky-300",
  "from-violet-500 to-violet-300",
  "from-fuchsia-500 to-fuchsia-300",
  "from-amber-500 to-amber-300",
  "from-rose-500 to-rose-300",
];

export default function TierGuide() {
  const maxLog = Math.log10(PROJECT_TYPES[PROJECT_TYPES.length - 1].market[1]);
  const minLog = Math.log10(PROJECT_TYPES[0].market[0]);
  const pct = (v: number) => ((Math.log10(v) - minLog) / (maxLog - minLog)) * 100;

  return (
    <section id="tiers" className="relative mx-auto max-w-7xl px-5 py-24">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-300">Market price guide · India 2026</p>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">What websites usually cost — by level</h2>
        <p className="mt-4 text-zinc-400">
          Typical INR ranges quoted in the Indian market (excl. 18% GST). The low end is a freelancer or template build, the high end is a
          reputable agency with custom design. Use this to sanity-check a client&apos;s budget in the first call.
        </p>
      </div>

      {/* Spectrum bar */}
      <div className="glass mb-10 rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
          <span>{formatINRCompact(PROJECT_TYPES[0].market[0])}</span>
          <span>log scale</span>
          <span>{formatINRCompact(PROJECT_TYPES[PROJECT_TYPES.length - 1].market[1])}+</span>
        </div>
        <div className="space-y-2.5">
          {PROJECT_TYPES.map((t, i) => (
            <div key={t.id} className="flex items-center gap-4">
              <div className="w-44 shrink-0 truncate text-sm text-zinc-300">{t.name}</div>
              <div className="relative h-3 flex-1 rounded-full bg-white/5">
                <div
                  className={`absolute h-3 rounded-full bg-gradient-to-r ${BARS[i]}`}
                  style={{ left: `${pct(t.market[0])}%`, width: `${Math.max(3, pct(t.market[1]) - pct(t.market[0]))}%` }}
                />
              </div>
              <div className="hidden w-40 shrink-0 text-right text-sm font-medium text-white sm:block">
                {formatRange(t.market[0], t.market[1])}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PROJECT_TYPES.map((t, i) => (
          <article key={t.id} className="glass group relative overflow-hidden rounded-2xl p-6 transition hover:-translate-y-1 hover:border-white/20">
            <div className={`pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full bg-gradient-to-b ${ACCENTS[i]} blur-2xl`} />
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Level {i + 1}</div>
            <h3 className="text-xl font-semibold text-white">{t.name}</h3>
            <p className="mt-1 text-sm text-zinc-400">{t.tagline}</p>
            <div className="mt-5 text-3xl font-bold tracking-tight text-white">{formatRange(t.market[0], t.market[1])}</div>
            <div className="mt-1 text-xs text-zinc-500">
              {t.typicalWeeks[0]}–{t.typicalWeeks[1]} weeks · running {formatRange(t.monthlyRunning[0], t.monthlyRunning[1])}/mo
            </div>
            <ul className="mt-5 space-y-1.5 text-sm text-zinc-300">
              {t.includes.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-violet-400">✓</span>
                  {x}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-white/5 pt-4 text-xs leading-relaxed text-zinc-500">
              <span className="text-zinc-400">e.g.</span> {t.examples}
              <br />
              <span className="text-zinc-400">Stack:</span> {t.stack}
            </p>
          </article>
        ))}
      </div>

      <div className="glass mt-10 overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-6 py-4">Who builds it</th>
              <th className="px-6 py-4">Team size</th>
              <th className="px-6 py-4">Blended rate (metro)</th>
              <th className="px-6 py-4">Best for</th>
            </tr>
          </thead>
          <tbody>
            {VENDORS.map((v) => (
              <tr key={v.id} className="border-b border-white/5 last:border-0">
                <td className="px-6 py-4 font-medium text-white">{v.name}</td>
                <td className="px-6 py-4 text-zinc-400">{v.desc}</td>
                <td className="px-6 py-4 text-zinc-200">
                  ₹{v.rate[0].toLocaleString("en-IN")} – ₹{v.rate[1].toLocaleString("en-IN")}/hr
                </td>
                <td className="px-6 py-4 text-zinc-400">{v.fit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
