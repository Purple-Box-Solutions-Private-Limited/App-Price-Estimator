import { z } from "zod";

const Range = {
  lowINR: z.coerce.number().describe("Lower bound in INR, excluding GST, rounded to a quote-friendly figure"),
  highINR: z.coerce.number().describe("Upper bound in INR, excluding GST, rounded to a quote-friendly figure"),
};

export const EstimateSchema = z.object({
  systemType: z.string().describe("Short name of what is being built, e.g. 'Multi-vendor grocery marketplace with delivery app'"),
  complexityTier: z.enum(["Basic", "Standard", "Advanced", "Complex", "Enterprise"]),
  projectSummary: z.string().describe("2-4 sentences: what the client actually needs, in plain English"),
  understoodRequirements: z.array(z.string()).default([]).describe("Concrete functional requirements inferred from the brief"),
  assumptions: z.array(z.string()).default([]).describe("Assumptions made where the brief was silent"),
  clarifyingQuestions: z.array(z.string()).default([]).describe("Questions to ask the client that would materially change the price"),
  recommendedStack: z.string(),
  modules: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        hoursLow: z.coerce.number(),
        hoursHigh: z.coerce.number(),
        ...Range,
      }),
    )
    .describe("Work breakdown. Module costs must add up to the recommended range."),
  vendorQuotes: z
    .array(
      z.object({
        vendorType: z.enum(["Freelancer", "Small agency", "Mid-size agency", "Premium agency"]),
        ...Range,
        timelineWeeksLow: z.coerce.number(),
        timelineWeeksHigh: z.coerce.number(),
        notes: z.string(),
      }),
    )
    .describe("What each type of Indian vendor would realistically quote for this exact scope"),
  recommended: z.object({
    vendorType: z.string(),
    ...Range,
    mostLikelyINR: z.coerce.number(),
    timelineWeeksLow: z.coerce.number(),
    timelineWeeksHigh: z.coerce.number(),
    team: z.array(z.string()).describe("e.g. '1 UI/UX designer (part-time)'"),
    reasoning: z.string(),
  }),
  recurringCosts: z
    .array(
      z.object({
        item: z.string(),
        monthlyLowINR: z.coerce.number(),
        monthlyHighINR: z.coerce.number(),
        notes: z.string(),
      }),
    )
    .describe("Monthly running costs: hosting, domain (annual / 12), SMS/WhatsApp, payment gateway fees note, SaaS licences, maintenance"),
  marketRates: z
    .array(
      z.object({
        role: z.string(),
        hourlyLowINR: z.coerce.number(),
        hourlyHighINR: z.coerce.number(),
        source: z.string().describe("Publisher/site the figure came from"),
      }),
    )
    .default([])
    .describe("Hourly rates found during research that the estimate is based on"),
  comparables: z
    .array(z.object({ description: z.string(), priceRange: z.string(), source: z.string() }))
    .default([])
    .describe("Comparable projects / published price points found in research"),
  costDrivers: z.array(z.string()).default([]),
  costSavingOptions: z.array(z.string()).default([]).describe("Concrete ways to reduce cost, each with approx INR saving"),
  risks: z.array(z.string()).default([]),
  paymentMilestones: z.array(z.object({ milestone: z.string(), percent: z.coerce.number() })),
  clientPitch: z.string().describe("A short, client-ready paragraph explaining the quote, suitable to paste into a proposal"),
  confidence: z.enum(["Low", "Medium", "High"]),
  confidenceReason: z.string(),
});

export type AiEstimate = z.output<typeof EstimateSchema>;

export interface Source {
  title: string;
  url: string;
  pageAge?: string | null;
}

export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "search"; query: string }
  | { type: "source"; source: Source }
  | { type: "notes"; text: string }
  | { type: "result"; estimate: AiEstimate; sources: Source[]; model: string }
  | { type: "error"; message: string };
