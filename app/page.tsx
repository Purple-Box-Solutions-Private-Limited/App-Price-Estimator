import Estimator from "@/components/Estimator";
import TierGuide from "@/components/TierGuide";

const STEPS = [
  {
    n: "01",
    title: "Understand the system",
    body: "The AI reads the raw brief and works out what's really being asked — a brochure site, a booking platform or a marketplace — plus the hidden scope clients forget (admin panel, notifications, hosting, testing).",
  },
  {
    n: "02",
    title: "Research the live market",
    body: "It runs focused web searches for current Indian rate cards, comparable project quotes and running costs (hosting, Razorpay fees, WhatsApp/SMS APIs) — and flags vendor-marketing outliers.",
  },
  {
    n: "03",
    title: "Reconcile & price",
    body: "Builds the cost bottom-up from module hours × realistic INR rates, cross-checks against comparables, and rounds to quote-friendly numbers. No inflated, no fancy figures.",
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* Background */}
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[900px]" />
      <div className="floaty pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-violet-700/30 blur-[120px]" />
      <div className="floaty pointer-events-none absolute -right-40 top-60 h-[380px] w-[380px] rounded-full bg-cyan-600/20 blur-[120px] [animation-delay:-4s]" />

      {/* Nav */}
      <nav className="no-print relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6">
        <a href="#" className="flex items-center gap-2.5">
          <span className="bg-gradient-brand grid h-9 w-9 place-items-center rounded-xl text-lg font-bold text-white">₹</span>
          <span className="text-lg font-semibold tracking-tight text-white">QuoteSense</span>
        </a>
        <div className="hidden items-center gap-8 text-sm text-zinc-400 sm:flex">
          <a href="#tiers" className="hover:text-white">Price guide</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#estimate" className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/15">Estimate a project</a>
        </div>
      </nav>

      {/* Hero */}
      <header className="no-print relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-16 sm:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Indian market pricing · INR · updated with live AI research
          </div>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Know what it should cost <span className="text-gradient">before you quote.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            Paste any client requirement — from a 5-page clinic site to a multi-vendor marketplace — and get a realistic, research-backed price in
            rupees, broken down by module, vendor type, timeline and running costs.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#estimate" className="bg-gradient-brand rounded-xl px-7 py-3.5 font-semibold text-white shadow-xl shadow-violet-900/40 transition hover:brightness-110">
              Estimate a project →
            </a>
            <a href="#tiers" className="rounded-xl border border-white/15 px-7 py-3.5 font-semibold text-white transition hover:bg-white/5">
              See typical price levels
            </a>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
          {[
            ["₹8K – 60K", "Landing pages"],
            ["₹25K – 2L", "Business websites"],
            ["₹2L – 15L", "Custom web apps"],
            ["₹8L – 45L", "SaaS & marketplaces"],
          ].map(([v, l]) => (
            <div key={l} className="bg-ink-900/90 p-5 text-center">
              <div className="text-xl font-bold text-white sm:text-2xl">{v}</div>
              <div className="mt-1 text-xs text-zinc-500">{l}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="no-print">
        <TierGuide />
      </div>

      {/* How it works */}
      <section id="how" className="no-print relative mx-auto max-w-7xl px-5 py-24">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-300">How deep research works</p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">An estimator that does its homework</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="glass rounded-2xl p-7">
              <div className="text-gradient text-4xl font-bold">{s.n}</div>
              <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Estimator />

      <footer className="no-print border-t border-white/5 py-10 text-center text-xs text-zinc-600">
        Estimates are indicative and exclude 18% GST. Always confirm final scope with the client before sending a quote.
      </footer>
    </main>
  );
}
