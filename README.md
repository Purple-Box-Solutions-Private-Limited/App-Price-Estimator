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

Without an API key the site still works with the price guide and the instant estimator. The deep-research button is disabled until a key is set.

## How the AI estimate works

`app/api/estimate/route.ts` streams progress to the browser over Server-Sent Events. It works in two phases:

1. **Research**: Claude, with the `web_search` server tool (location set to India), reads the brief, identifies the system type and its hidden scope, and gathers current INR evidence. You can watch the searches and sources live in the UI.
2. **Estimate**: a second call turns the research notes into a strict JSON estimate (validated with a Zod schema). It builds the price bottom-up from module hours and rates, and checks it against the comparable prices it found. Prices exclude 18% GST and are rounded to quote-friendly figures.

The model is `claude-opus-5-5` by default. Override it with `ESTIMATOR_MODEL`.

## Project structure

| Path | What |
|---|---|
| `lib/pricing.ts` | Project tiers, features, vendor rates and the instant-estimate engine (edit here to recalibrate) |
| `lib/schema.ts` | Zod schema for the AI estimate and the stream event types |
| `lib/format.ts` | INR formatting (lakh/crore) and quote rounding |
| `app/api/estimate` | Streaming research and estimate endpoint |
| `components/` | Tier guide, estimator form, instant panel, research log, AI report |

## Calibration

The rates and tiers in `lib/pricing.ts` were calibrated in November 2026 against public Indian pricing guides and freelancer rate cards:

| Vendor | Blended metro rate |
|---|---|
| Freelancer | ₹400–1,000/hr |
| Small agency | ₹800–1,600/hr |
| Mid-size agency | ₹1,500–2,800/hr |
| Premium agency | ₹2,800–5,000/hr |

Tier-2 and Tier-3 city vendors are about 18% lower. Update these numbers whenever your own market data changes.

Stack: Next.js 16, React 19, Tailwind CSS 4, Anthropic TypeScript SDK.
