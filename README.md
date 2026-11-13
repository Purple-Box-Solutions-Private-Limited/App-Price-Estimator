# QuoteSense: Website & App Cost Estimator (India · INR)

Know what a website or app **should** cost in India before you quote a client.

- **Market price guide**: six levels of projects, from landing pages to enterprise systems, with typical INR ranges, timelines, running costs and vendor rate cards.
- **Instant estimate**: a rule-based engine that works offline. It adds up effort hours for the project type, features, pages, design level, scale and urgency, then multiplies by realistic blended Indian rates for freelancers, small, mid-size and premium agencies. Results are rounded to figures you can actually quote.
- **AI deep research**: paste the client's raw requirement. Claude works out what kind of system it really is, runs live web searches for current Indian rate cards, comparable project prices and running costs (hosting, Razorpay, WhatsApp/SMS APIs and so on), and returns a reconciled breakdown in INR:
  - module-by-module hours and cost
  - quotes for all four vendor types
  - recommended team and timeline
  - monthly running costs and AMC
  - payment milestones
  - clarifying questions to ask the client
  - cost drivers, savings and risks
  - the sources it consulted
  - a client-ready paragraph you can paste into a proposal

  You can export the result as PDF or JSON.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                   # http://localhost:3000
```

Without a server key the site still works with the price guide and the instant estimator. Visitors can also paste their own Anthropic API key (on the estimate page or under **Settings**). It is stored only in their browser's localStorage and sent per request in the `x-anthropic-key` header; the server uses it for that request and never stores it. A user key takes priority over the server key.

## Pages

| Route | What |
|---|---|
| `/` | Dashboard: quick budget check, recent estimates, templates, rate reference |
| `/estimate` | Estimator workspace. Inputs sync to the URL (shareable via **Copy link**). Save, AI research, quote builder (margin, discount, GST, payment schedule, print) |
| `/saved` | Estimates saved in this browser. Search, open, duplicate, delete, export/import JSON |
| `/guide` | Price guide: project levels, vendor rate card, feature cost table, calculation method |
| `/settings` | Add or remove your Anthropic API key |

## How the AI estimate works

`app/api/estimate/route.ts` streams progress to the browser over Server-Sent Events. It works in two phases:

1. **Research**: Claude, with the `web_search` server tool (location set to India), reads the brief, identifies the system type and its hidden scope, and gathers current INR evidence. You can watch the searches and sources live in the UI.
2. **Estimate**: a second call turns the research notes into a JSON estimate. The JSON Schema (generated from the Zod schema in `lib/schema.ts`) goes in the prompt and the reply is validated with Zod; if validation fails, the errors are sent back once for a corrected reply. Constrained decoding (`output_config.format`) is not used because this schema is too large for it (the API returns "compiled grammar is too large"). The estimate is built bottom-up from module hours and rates and checked against the comparable prices the research found. Prices exclude 18% GST and are rounded to quote-friendly figures.

The model is `claude-opus-5-5` by default. Override it with `ESTIMATOR_MODEL`.

## Project structure

| Path | What |
|---|---|
| `lib/pricing.ts` | Project tiers, features, vendor rates and the instant-estimate engine (edit here to recalibrate) |
| `lib/schema.ts` | Zod schema for the AI estimate and the stream event types |
| `lib/format.ts` | INR formatting (lakh/crore) and quote rounding |
| `app/api/estimate` | Streaming research and estimate endpoint |
| `lib/url.ts`, `lib/saved.ts`, `lib/apiKey.ts` | URL encoding of inputs, saved estimates and user API key (localStorage) |
| `components/` | Estimator, quote builder, saved list, price guide, research log, AI report |

## Design

A "pricing desk" look on a light theme: warm paper (`#f3eee4`) with a faint ledger grid and an SVG grain overlay, ink type, one signal-orange accent (`#ff5420`), cobalt for anything AI, and lime for selected states. Fonts: Instrument Serif for display, Space Grotesk for UI, JetBrains Mono for every number. Cards use hard offset shadows, like printed cut-outs.

- **Home**: the headline's rotating word, a brief box that submits straight to `/estimate?d=…` (a plain GET form, no JS needed), and `components/RupeeField.tsx`, a ₹ glyph made of about 1,200 canvas particles that scatter away from the cursor.
- **Estimator**: the instant estimate is a till receipt (`BaselinePanel.tsx`) with rolling totals (`useTween` in `components/ui.tsx`), a stamp and a barcode. The quote is an invoice document that prints on its own.
- `zinc-*` and `brand-*` are remapped to warm greys and orange in `globals.css`, so every neutral matches the paper.

Notes on the particle field:
- The loop sleeps once **every** particle is within 0.3px of home. An average-energy check let a few stragglers freeze in place.
- It tracks its own CSS size instead of comparing `canvas.width` with `clientWidth`.
- It pauses when off-screen and respects `prefers-reduced-motion`.
- `window.rupeeStep()` renders one frame by hand. Headless browsers only run a handful of rAF frames, so their screenshots show the particles mid-flight.

## Calibration

The numbers in `lib/pricing.ts` were last calibrated in November 2026 against published Indian 2026 pricing. Most of these sources are vendor or agency pages, so treat them as a market consensus, not audited data. Recalibrate when you have real quotes.

**Principle: honest hours, real rates.** Each feature line shows hands-on build time for a competent 2026 team using managed auth, payment SDKs, component kits, CMS/plugins and AI-assisted coding. Design, QA, project management and deployment are their own visible lines. The price comes from realistic hours × market rates, not padded hours. For example, login on a web app is 3–8h (1–4h on a plugin-based site), and a Razorpay checkout is 3–9h.

**Blended rates (metro; Tier-2/3 vendors ×0.82)**

| Vendor | Rate | Evidence |
|---|---|---|
| Freelancer | ₹600–1,600/hr | Domestic freelancers ₹500–2,500/hr, midpoint about ₹1,500 |
| Small agency | ₹1,300–2,400/hr | Indian firms $10–40/hr |
| Mid-size agency | ₹2,200–3,800/hr | Clutch-listed mid-size Indian firms are commonly $25–49/hr |
| Premium | ₹3,800–7,000/hr | Top studios, $45–80/hr |

**How hours are built**
- **Core build** for the type. It is scaled down when the site has fewer pages than the type includes, so a 1-page site isn't priced as 5 pages.
- **Extra pages** add 1–3h each.
- **Features** use modern hands-on hours, scaled by build type (plugins vs custom).
- **E-commerce** is priced by platform: Shopify 14–32h core, WooCommerce 20–45h, custom 70–150h.
- **Mobile apps** are 120–280h per cross-platform app. Each extra app adds about 60%.
- **Design** is 8% / 25% / 45% of build time (template / custom / premium), with a minimum. **QA** is 12% of build. **PM and client calls** are 10%. **Deployment** is 2–40h depending on project size.
- **Scale and timeline** multipliers apply on top. **Timelines** assume 25 / 35 / 60 / 90 hours a week per project, plus one week for feedback and launch.
- **Price range** is −15% / +20% for a detailed brief, wider for thin briefs or large projects.

**Check:** 16 reference projects, each compared with its published market band. Most-likely price, excl. GST:

| Scenario | Hours | Instant (likely) | Published market band |
|---|---|---|---|
| 1-page template landing, freelancer | 10–20h | ₹17K | ₹5K–25K |
| 12-page custom business site, small agency | 30–66h | ₹89K | ₹50K–1.5L |
| Clinic site with booking, alerts, admin and maps, small agency | 45–107h | ₹1.4L | ₹80K–2L |
| Shopify template store, freelancer | 22–48h | ₹39K | ₹15K–65K |
| Shopify D2C with custom theme, small agency | 49–107h | ₹1.45L | ₹85K–2.4L |
| WooCommerce store, freelancer | 42–90h | ₹73K | ₹25K–1L |
| Custom store, small agency | 151–341h | ₹4.55L | ₹2.5L–8L |
| CRM web app, freelancer | 142–315h | ₹2.5L | ₹1L–3L |
| School ERP with parent app, small agency | 378–901h | ₹11.75L | ₹6L–18L |
| SaaS MVP, small agency | 337–707h | ₹9.65L | ₹4L–15L |
| Marketplace with 3 apps, mid-size agency | 950–2,150h | ₹46.5L | ₹20L–55L |
| Enterprise portal, premium | 996–2,150h | ₹85L | ₹60L–1.5Cr |

All 16 land inside their band. A live AI research run on a 6-page clinic site with booking (Tier-2 small agency) gave ₹85K–1.3L, close to the instant engine.

Sources: [Hostinger India: website cost](https://www.hostinger.com/in/tutorials/website-cost), [Hostinger India: e-commerce cost](https://www.hostinger.com/in/tutorials/ecommerce-website-cost/), [Upgrowth design cost guide](https://upgrowth.in/website-design-cost-guide-in-india/), [Freelance Rates India calculator](https://freelanceratesindia.pages.dev/calculator/freelance-rate/web-developer), [Zartek app cost 2026](https://www.zartek.in/app-development-cost-in-india-2026/), [Riolabz app cost 2026](https://www.riolabz.com/blogs/cost-of-mobile-app-development-in-india-in-2026), [Clutch India web developers](https://clutch.co/web-developers/india.md).
