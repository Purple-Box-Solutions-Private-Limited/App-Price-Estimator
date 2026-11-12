import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { computeBaseline, describeInput, type EstimateInput } from "@/lib/pricing";
import { formatINR } from "@/lib/format";
import { EstimateSchema, type Source, type StreamEvent } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODEL = process.env.ESTIMATOR_MODEL || "claude-opus-5-5";

const InputSchema = z.object({
  description: z.string().max(6000),
  projectType: z.enum(["landing", "business", "ecommerce", "webapp", "platform", "enterprise"]),
  features: z.array(z.string()).max(40),
  pages: z.number().int().min(1).max(500),
  design: z.enum(["template", "custom", "premium"]),
  scale: z.enum(["standard", "growth", "critical"]),
  urgency: z.enum(["flexible", "standard", "rush"]),
  vendor: z.enum(["freelancer", "small", "mid", "premium"]),
  city: z.enum(["metro", "tier2"]),
});

const SYSTEM = `You are a senior pre-sales estimator at an Indian software services company with 15 years of experience quoting websites, web apps and mobile apps for Indian clients (SMBs, startups and enterprises).

Your job: tell the sales team what this project would REALISTICALLY cost in India today, in INR, so they can quote a client confidently.

Principles:
- Be grounded. Every number must be explainable from scope (hours) x realistic Indian rates, or from comparable published prices. No inflated "global agency" numbers, no USD-converted Western rates unless the vendor type is premium.
- Understand the real system first: identify what kind of product this is (e.g. "a brochure site" vs "a booking platform" vs "a multi-vendor marketplace"), and infer the hidden scope a client usually forgets (admin panel, notifications, payment reconciliation, hosting, testing, deployment, content entry).
- Prices are in INR, exclusive of 18% GST, rounded to quote-friendly figures (nearest ₹1,000 below ₹1 lakh, nearest ₹5,000 below ₹10 lakh, nearest ₹25,000 above).
- Use Indian context: Razorpay/PayU/Cashfree, UPI, Shiprocket, MSG91/Gupshup/WhatsApp Business API, AWS Mumbai / DigitalOcean Bangalore, Hostinger/GoDaddy India, DPDP Act 2023, GST.`;

function sse(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json(
      { error: "AI research is not configured. Add ANTHROPIC_API_KEY to .env.local and restart." },
      { status: 503 },
    );
  }

  let input: EstimateInput;
  try {
    input = InputSchema.parse(await req.json());
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (input.description.trim().length < 15) {
    return Response.json({ error: "Please describe the requirement in at least one sentence." }, { status: 400 });
  }

  const client = new Anthropic();
  const baseline = computeBaseline(input);
  const baselineText = [
    `Rule-based reference (our internal calculator, may be wrong — verify and override with research):`,
    `- Estimated effort: ${baseline.hours[0]}–${baseline.hours[1]} hours`,
    ...baseline.quotes.map(
      (q) => `- ${q.vendor.name}: ${formatINR(q.low)} – ${formatINR(q.high)} (likely ${formatINR(q.likely)}), ${q.weeks[0]}–${q.weeks[1]} weeks`,
    ),
  ].join("\n");

  const brief = `CLIENT REQUIREMENT (verbatim):
"""
${input.description.trim()}
"""

STRUCTURED INPUTS FROM THE SALES TEAM:
${describeInput(input)}

${baselineText}

Today's date: ${new Date().toISOString().slice(0, 10)}.`;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(sse(e));
      const sources = new Map<string, Source>();

      try {
        // ---------- Phase 1: live market research with web search ----------
        send({ type: "status", message: "Understanding the requirement & planning research…" });

        const messages: Anthropic.Beta.BetaMessageParam[] = [
          {
            role: "user",
            content: `${brief}

TASK (research phase):
1. First, in 2-3 sentences, state what kind of system this really is and the hidden scope it implies.
2. Use web search to gather CURRENT (2025-2026) Indian market evidence relevant to THIS project:
   - published price ranges in INR for comparable projects in India (by freelancers, small agencies, mid-size agencies),
   - hourly / monthly rates for Indian developers and designers by experience and vendor type,
   - running costs relevant to this system (hosting in India, domain, payment gateway fees, SMS/WhatsApp API, maps, app-store fees, third-party SaaS) in INR.
   Prefer specific, recent Indian sources. Run focused searches (not generic ones) and stop when you have enough evidence.
3. Finish with concise RESEARCH NOTES: bullet points of concrete figures with the source site name for each. Flag figures that look like outliers or vendor marketing.`,
          },
        ];

        let notes = "";
        for (let turn = 0; turn < 4; turn++) {
          const research = client.beta.messages.stream({
            model: MODEL,
            max_tokens: 32000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            system: SYSTEM,
            thinking: { type: "adaptive" },
            output_config: { effort: "high" },
            tools: [
              {
                type: "web_search_20260209",
                name: "web_search",
                max_uses: 8,
                user_location: { type: "approximate", country: "IN", timezone: "Asia/Kolkata" },
              },
            ],
            messages,
          });

          research.on("contentBlock", (block) => {
            if (block.type === "server_tool_use" && block.name === "web_search") {
              const q = (block.input as { query?: unknown })?.query;
              if (typeof q === "string") send({ type: "search", query: q });
            } else if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
              for (const r of block.content) {
                if (!sources.has(r.url)) {
                  const s: Source = { title: r.title, url: r.url, pageAge: r.page_age };
                  sources.set(r.url, s);
                  send({ type: "source", source: s });
                }
              }
            }
          });

          const msg = await research.finalMessage();
          if (msg.stop_reason === "refusal") throw new Error("The model declined this request.");

          for (const b of msg.content) if (b.type === "text") notes += b.text;
          if (msg.stop_reason === "pause_turn") {
            messages.push({ role: "assistant", content: msg.content });
            send({ type: "status", message: "Continuing research…" });
            continue;
          }
          break;
        }

        if (!notes.trim()) notes = "(No research notes were produced; rely on internal knowledge of the Indian market and say so in confidenceReason.)";
        send({ type: "notes", text: notes });

        // ---------- Phase 2: structured, reconciled estimate ----------
        send({ type: "status", message: `Research done (${sources.size} sources). Building the cost breakdown…` });

        const sourceList = [...sources.values()]
          .slice(0, 40)
          .map((s) => `- ${s.title} — ${s.url}`)
          .join("\n");

        const final = await client.beta.messages
          .stream({
            model: MODEL,
            max_tokens: 32000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            system: SYSTEM,
            thinking: { type: "adaptive" },
            output_config: { effort: "high", format: betaZodOutputFormat(EstimateSchema) },
            messages: [
              {
                role: "user",
                content: `${brief}

LIVE RESEARCH NOTES (gathered just now via web search):
${notes}

SOURCES CONSULTED:
${sourceList || "(none)"}

TASK (estimate phase): Produce the final estimate as JSON.
Rules:
- Build the estimate bottom-up from modules (hours x the recommended vendor's blended INR rate), then sanity-check it against the comparable prices from research. If they disagree, explain in recommended.reasoning which you trusted and why.
- The sum of module lowINR / highINR must roughly equal recommended.lowINR / highINR (within ~5%).
- recommended.vendorType should be the sales team's preferred vendor type unless it is clearly wrong for the scope (then say why).
- Provide all four vendorQuotes, in order Freelancer, Small agency, Mid-size agency, Premium agency, priced for this exact scope.
- Keep ranges tight and honest: high should generally be no more than ~1.8x low. Width should reflect real uncertainty in the brief.
- Cite only sources that appear in the research notes; if a figure is your own judgement, set source to "Estimator judgement".
- Payment milestones must sum to 100.
- clarifyingQuestions: only the ones that would materially move the price.`,
              },
            ],
          })
          .finalMessage();

        if (final.stop_reason === "refusal") throw new Error("The model declined this request.");
        if (final.stop_reason === "max_tokens") throw new Error("The estimate was cut off. Please try again with a shorter brief.");
        const estimate = final.parsed_output;
        if (!estimate) throw new Error("Could not parse the AI estimate. Please retry.");

        send({ type: "result", estimate, sources: [...sources.values()], model: final.model });
      } catch (err) {
        let message = "Something went wrong while researching.";
        if (err instanceof Anthropic.AuthenticationError) message = "Invalid ANTHROPIC_API_KEY.";
        else if (err instanceof Anthropic.RateLimitError) message = "Rate limited by the AI provider — try again in a minute.";
        else if (err instanceof Anthropic.APIError) message = `AI provider error (${err.status ?? "network"}): ${err.message}`;
        else if (err instanceof Error) message = err.message;
        console.error("[estimate]", err);
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
