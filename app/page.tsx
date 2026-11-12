import Link from "next/link";
import QuickCheck from "@/components/QuickCheck";
import RecentSaved from "@/components/RecentSaved";
import RupeeField from "@/components/RupeeField";
import { RotatingWord, TypeIcon } from "@/components/ui";
import { EXAMPLES } from "@/lib/examples";
import { PROJECT_TYPES, VENDORS } from "@/lib/pricing";
import { formatINRCompact, formatRange } from "@/lib/format";

const WORDS = ["website", "online store", "mobile app", "school portal", "marketplace", "booking system"];

export default function Home() {
  const minLog = Math.log10(PROJECT_TYPES[0].market[0]);
  const maxLog = Math.log10(PROJECT_TYPES[PROJECT_TYPES.length - 1].market[1]);
  const pct = (v: number) => ((Math.log10(v) - minLog) / (maxLog - minLog)) * 100;

  return (
    <main className="mx-auto max-w-[1400px] px-5 sm:px-8">
      {/* ------------ Hero: the brief goes straight in ------------ */}
      <section className="grid items-stretch gap-8 pb-14 pt-10 lg:grid-cols-[1.15fr_1fr] lg:pt-14">
        <div className="fade-up flex flex-col">
          <div className="kicker flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" /> Pricing desk · India · INR
          </div>
          <h1 className="mt-5 text-[clamp(3rem,7.2vw,6.6rem)] leading-[0.92]">
            What should this <br />
            <em className="text-accent">
              <RotatingWord words={WORDS} />
            </em>
            <br />
            really cost?
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
            Paste the client&apos;s brief. Get a <span className="marker">defensible INR price</span> in seconds, check it against live market
            research, and send a quote with your margin and GST.
          </p>

          <form action="/estimate" method="get" className="sheet mt-8 overflow-hidden">
            <label htmlFor="brief" className="kicker flex items-center justify-between border-b-[1.5px] border-ink bg-paper-2 px-4 py-2">
              <span>Client brief</span>
              <span>↵ opens estimator</span>
            </label>
            <textarea
              id="brief"
              name="d"
              rows={3}
              maxLength={1500}
              required
              minLength={10}
              placeholder="e.g. Ayurveda clinic in Kochi wants a bilingual website with online consultations, Razorpay payments and WhatsApp reminders…"
              className="block w-full resize-none bg-transparent px-4 py-3 text-[16px] leading-relaxed text-ink placeholder:text-zinc-400 focus:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-zinc-300 px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="kicker mr-1">or try</span>
                {EXAMPLES.map((ex) => (
                  <Link key={ex.id} href={`/estimate?ex=${ex.id}`} className="chip !py-1 !text-xs">
                    {ex.label}
                  </Link>
                ))}
              </div>
              <button type="submit" className="btn btn-ink px-5 py-2.5 text-sm">
                Estimate it →
              </button>
            </div>
          </form>
        </div>

        {/* Focal plate */}
        <div className="plate relative min-h-[420px] overflow-hidden bg-[radial-gradient(circle_at_70%_30%,#fff8ec,transparent_60%)] lg:min-h-0">
          <div className="kicker absolute left-4 top-4 z-10">Fig. 01 — the rupee</div>
          <div className="kicker absolute right-4 top-4 z-10 hidden sm:block">move your cursor ↘</div>
          <div className="absolute inset-x-6 bottom-16 top-12">
            <RupeeField />
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t-[1.5px] border-ink bg-sheet/90 backdrop-blur-sm">
            {VENDORS.map((v, i) => (
              <div key={v.id} className={`px-3 py-2.5 ${i ? "border-l border-zinc-300" : ""}`}>
                <div className="kicker !text-[9px]">{v.name}</div>
                <div className="num text-sm font-semibold">₹{v.rate[0].toLocaleString("en-IN")}+/h</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------ Desk ------------ */}
      <section className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <QuickCheck />
        <RecentSaved />
      </section>

      {/* ------------ Price index board ------------ */}
      <section className="mt-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-5xl leading-none">
            The price <em className="text-accent">index</em>
          </h2>
          <Link href="/guide" className="kicker underline decoration-accent decoration-2 underline-offset-4 hover:text-ink">
            Full price guide →
          </Link>
        </div>
        <div className="sheet overflow-hidden">
          <div className="kicker grid grid-cols-[1.4fr_2.4fr_1fr] gap-4 border-b-[1.5px] border-ink bg-ink px-5 py-2.5 !text-paper/70 max-md:hidden">
            <span>Project level</span>
            <span className="flex justify-between">
              <span>{formatINRCompact(PROJECT_TYPES[0].market[0])}</span>
              <span>log scale</span>
              <span>{formatINRCompact(PROJECT_TYPES[PROJECT_TYPES.length - 1].market[1])}</span>
            </span>
            <span className="text-right">Typical quote</span>
          </div>
          {PROJECT_TYPES.map((t, i) => (
            <Link
              key={t.id}
              href={`/estimate?t=${t.id}&p=${t.includedPages}&f=`}
              className="group grid items-center gap-4 border-b border-zinc-200 px-5 py-4 transition last:border-0 hover:bg-lime/40 md:grid-cols-[1.4fr_2.4fr_1fr]"
            >
              <div className="flex items-center gap-3">
                <span className="num w-6 text-xs text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
                <span className="grid h-10 w-10 place-items-center rounded-lg border-[1.5px] border-ink bg-sheet transition group-hover:bg-accent group-hover:text-white">
                  <TypeIcon id={t.id} className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-zinc-500">
                    {t.typicalWeeks[0]}–{t.typicalWeeks[1]} weeks
                  </div>
                </div>
              </div>
              <div className="relative h-7 max-md:hidden">
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-zinc-300" />
                <div
                  className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-accent transition-all group-hover:h-5"
                  style={{ left: `${pct(t.market[0])}%`, width: `${Math.max(4, pct(t.market[1]) - pct(t.market[0]))}%` }}
                />
              </div>
              <div className="num text-right text-lg font-semibold">{formatRange(t.market[0], t.market[1])}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
