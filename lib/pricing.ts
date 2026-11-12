/**
 * Rule-based pricing engine for the Indian market (INR).
 *
 * Calibrated against public 2026 Indian pricing guides and freelancer/agency
 * rate cards (Hostinger India, Upgrowth, freelance rate calculators, etc.).
 * It is an *anchor*: the AI deep-research mode re-checks it against live data.
 */
import { roundQuote } from "./format";

export type ProjectTypeId =
  | "landing"
  | "business"
  | "ecommerce"
  | "webapp"
  | "platform"
  | "enterprise";

export interface ProjectType {
  id: ProjectTypeId;
  name: string;
  tagline: string;
  examples: string;
  /** Core effort (hours) incl. setup, core design, QA, deployment */
  hours: [number, number];
  /** Pages included in the base effort */
  includedPages: number;
  /** Typical market price range shown in the tier guide (INR, excl. GST) */
  market: [number, number];
  typicalWeeks: [number, number];
  stack: string;
  includes: string[];
  /** Monthly running cost (hosting, email, SaaS) [lo, hi] */
  monthlyRunning: [number, number];
  /**
   * How heavy add-on features are for this kind of build. Simple sites use
   * plugins/SaaS (e.g. a booking plugin), so the same feature costs far less
   * than a custom-engineered module in a platform.
   */
  featureScale: number;
}

export const PROJECT_TYPES: ProjectType[] = [
  {
    id: "landing",
    featureScale: 0.4,
    name: "Landing / Static Site",
    tagline: "1–5 pages, fast, no backend",
    examples: "Event page, portfolio, product launch, doctor/CA profile",
    hours: [12, 25],
    includedPages: 5,
    market: [8_000, 60_000],
    typicalWeeks: [1, 2],
    stack: "HTML/Next.js/Framer/Webflow or WordPress theme",
    includes: ["Responsive design", "Contact form / WhatsApp CTA", "Basic on-page SEO", "Hosting setup"],
    monthlyRunning: [150, 1_000],
  },
  {
    id: "business",
    featureScale: 0.45,
    name: "Business / CMS Website",
    tagline: "5–20 pages, editable content",
    examples: "Company site, school, clinic, real-estate builder, restaurant",
    hours: [35, 70],
    includedPages: 10,
    market: [25_000, 2_00_000],
    typicalWeeks: [2, 5],
    stack: "WordPress / Webflow / headless CMS + Next.js",
    includes: ["Custom-themed design", "CMS for content edits", "Blog / news", "Lead forms + analytics", "SEO setup"],
    monthlyRunning: [300, 2_500],
  },
  {
    id: "ecommerce",
    featureScale: 0.75,
    name: "E-commerce Store",
    tagline: "Catalog, cart, payments, orders",
    examples: "D2C brand, boutique, grocery, electronics store",
    hours: [90, 180],
    includedPages: 12,
    market: [40_000, 8_00_000],
    typicalWeeks: [3, 10],
    stack: "Shopify / WooCommerce / Medusa or custom (Next.js + Node)",
    includes: ["Product catalog & cart", "Razorpay / PayU / UPI checkout", "Order & inventory admin", "Shipping (Shiprocket) setup", "GST invoices"],
    monthlyRunning: [1_500, 15_000],
  },
  {
    id: "webapp",
    featureScale: 0.85,
    name: "Custom Web Application",
    tagline: "Logins, dashboards, workflows",
    examples: "Booking system, CRM, LMS, portal, internal tool",
    hours: [300, 600],
    includedPages: 15,
    market: [2_00_000, 15_00_000],
    typicalWeeks: [8, 20],
    stack: "React/Next.js + Node/Django/Laravel + PostgreSQL",
    includes: ["User auth & roles", "Admin dashboard", "Custom business logic", "API & database design", "Testing & deployment"],
    monthlyRunning: [3_000, 25_000],
  },
  {
    id: "platform",
    featureScale: 0.95,
    name: "SaaS / Marketplace",
    tagline: "Multi-sided, subscriptions, scale",
    examples: "Multi-vendor marketplace, SaaS product, aggregator, fintech/edtech app",
    hours: [650, 1300],
    includedPages: 25,
    market: [8_00_000, 45_00_000],
    typicalWeeks: [16, 36],
    stack: "Next.js + Node/Go microservices, PostgreSQL, Redis, AWS/GCP",
    includes: ["Multi-tenant / multi-vendor", "Subscription billing", "Analytics & reporting", "Notifications", "Scalable cloud infra"],
    monthlyRunning: [15_000, 1_50_000],
  },
  {
    id: "enterprise",
    featureScale: 1.2,
    name: "Enterprise System",
    tagline: "Integrations, compliance, high scale",
    examples: "ERP/CRM integrated portal, banking/insurance, government, hospital system",
    hours: [1500, 3200],
    includedPages: 40,
    market: [30_00_000, 1_50_00_000],
    typicalWeeks: [26, 60],
    stack: "Microservices, SSO, audit trails, cloud/hybrid, CI/CD",
    includes: ["SSO & granular RBAC", "ERP/CRM/legacy integrations", "Security audit & compliance (DPDP, ISO)", "Load testing & SLAs", "Dedicated team"],
    monthlyRunning: [75_000, 6_00_000],
  },
];

export interface Feature {
  id: string;
  name: string;
  hours: [number, number];
  /** Project types where this feature is already part of the base */
  includedIn?: ProjectTypeId[];
  monthly?: [number, number];
  group: "Core" | "Commerce" | "Engagement" | "Advanced";
}

export const FEATURES: Feature[] = [
  { id: "auth", name: "User accounts & login", hours: [25, 50], includedIn: ["webapp", "platform", "enterprise"], group: "Core" },
  { id: "admin", name: "Admin dashboard", hours: [40, 100], includedIn: ["webapp", "platform", "enterprise"], group: "Core" },
  { id: "cms", name: "Blog / CMS", hours: [10, 25], includedIn: ["business"], group: "Core" },
  { id: "seo", name: "SEO setup & speed optimisation", hours: [10, 25], group: "Core" },
  { id: "multilang", name: "Multi-language (Hindi/regional)", hours: [20, 50], group: "Core" },
  { id: "search", name: "Advanced search & filters", hours: [20, 50], group: "Core" },
  { id: "roles", name: "Roles & permissions", hours: [25, 60], includedIn: ["enterprise"], group: "Core" },

  { id: "payments", name: "Payment gateway (Razorpay/UPI)", hours: [15, 35], includedIn: ["ecommerce"], group: "Commerce" },
  { id: "catalog", name: "Product catalog & cart", hours: [40, 90], includedIn: ["ecommerce"], group: "Commerce" },
  { id: "booking", name: "Booking / appointments", hours: [40, 90], group: "Commerce" },
  { id: "subscriptions", name: "Subscription billing", hours: [40, 90], includedIn: ["platform"], group: "Commerce" },
  { id: "multivendor", name: "Multi-vendor marketplace", hours: [120, 260], group: "Commerce" },
  { id: "gst", name: "GST invoicing & reports", hours: [20, 45], group: "Commerce" },

  { id: "notifications", name: "Email / SMS / WhatsApp alerts", hours: [15, 35], monthly: [500, 5_000], group: "Engagement" },
  { id: "chat", name: "Real-time chat", hours: [50, 120], monthly: [0, 3_000], group: "Engagement" },
  { id: "maps", name: "Maps & location", hours: [15, 40], monthly: [0, 4_000], group: "Engagement" },
  { id: "reviews", name: "Ratings & reviews", hours: [15, 35], group: "Engagement" },
  { id: "analytics", name: "Analytics & reports dashboard", hours: [40, 100], group: "Engagement" },

  { id: "ai", name: "AI chatbot / recommendations", hours: [60, 160], monthly: [2_000, 20_000], group: "Advanced" },
  { id: "integrations", name: "3rd-party API integrations", hours: [25, 70], group: "Advanced" },
  { id: "erp", name: "ERP / CRM / Tally integration", hours: [60, 160], group: "Advanced" },
  { id: "migration", name: "Data migration from old system", hours: [20, 60], group: "Advanced" },
  { id: "mobile", name: "Mobile app (Android + iOS)", hours: [300, 650], monthly: [700, 2_000], group: "Advanced" },
  { id: "pwa", name: "PWA / offline support", hours: [20, 50], group: "Advanced" },
];

export type DesignLevel = "template" | "custom" | "premium";
export const DESIGN_LEVELS: { id: DesignLevel; name: string; desc: string; mult: number }[] = [
  { id: "template", name: "Template-based", desc: "Customised premium theme", mult: 0.78 },
  { id: "custom", name: "Custom UI/UX", desc: "Figma design, unique layout", mult: 1.0 },
  { id: "premium", name: "Premium / branded", desc: "Motion, illustrations, design system", mult: 1.25 },
];

export type ScaleLevel = "standard" | "growth" | "critical";
export const SCALE_LEVELS: { id: ScaleLevel; name: string; desc: string; mult: number }[] = [
  { id: "standard", name: "Standard", desc: "< 10K monthly users", mult: 1.0 },
  { id: "growth", name: "Growth", desc: "10K–1L users, load handling", mult: 1.12 },
  { id: "critical", name: "Mission-critical", desc: "High security, audits, uptime SLA", mult: 1.3 },
];

export type Urgency = "flexible" | "standard" | "rush";
export const URGENCY: { id: Urgency; name: string; desc: string; mult: number; speed: number }[] = [
  { id: "flexible", name: "Flexible", desc: "No hard deadline", mult: 0.95, speed: 0.8 },
  { id: "standard", name: "Standard", desc: "Normal timeline", mult: 1.0, speed: 1 },
  { id: "rush", name: "Rush", desc: "Tight deadline, extra people", mult: 1.25, speed: 1.5 },
];

export type VendorId = "freelancer" | "small" | "mid" | "premium";
export interface Vendor {
  id: VendorId;
  name: string;
  desc: string;
  /** Blended hourly rate in INR (design + dev + QA + PM) for metro clients */
  rate: [number, number];
  /** Productive hours per week this vendor typically allocates */
  capacity: number;
  /** Who this suits */
  fit: string;
}

export const VENDORS: Vendor[] = [
  { id: "freelancer", name: "Freelancer", desc: "1–2 people", rate: [400, 1_000], capacity: 30, fit: "Budget, simple scope" },
  { id: "small", name: "Small Agency", desc: "5–20 people", rate: [800, 1_600], capacity: 60, fit: "Most SMB projects" },
  { id: "mid", name: "Mid-size Agency", desc: "20–150 people", rate: [1_500, 2_800], capacity: 100, fit: "Funded startups, complex apps" },
  { id: "premium", name: "Premium / Tier-1", desc: "Top studios & IT firms", rate: [2_800, 5_000], capacity: 140, fit: "Enterprise, brand-critical" },
];

export type CityTier = "metro" | "tier2";
export const CITY_TIERS: { id: CityTier; name: string; mult: number }[] = [
  { id: "metro", name: "Metro (Mumbai, Bengaluru, Delhi NCR, Pune, Hyderabad)", mult: 1 },
  { id: "tier2", name: "Tier-2/3 city vendor", mult: 0.82 },
];

export interface EstimateInput {
  description: string;
  projectType: ProjectTypeId;
  features: string[];
  pages: number;
  design: DesignLevel;
  scale: ScaleLevel;
  urgency: Urgency;
  vendor: VendorId;
  city: CityTier;
}

export const DEFAULT_INPUT: EstimateInput = {
  description: "",
  projectType: "business",
  features: ["seo"],
  pages: 8,
  design: "custom",
  scale: "standard",
  urgency: "standard",
  vendor: "small",
  city: "metro",
};

export interface LineItem {
  name: string;
  hours: [number, number];
}

export interface VendorQuote {
  vendor: Vendor;
  low: number;
  likely: number;
  high: number;
  weeks: [number, number];
}

export interface BaselineResult {
  type: ProjectType;
  lineItems: LineItem[];
  hours: [number, number];
  multiplier: number;
  quotes: VendorQuote[];
  selected: VendorQuote;
  monthly: [number, number];
  /** Annual maintenance (AMC), typically 15–20% of build */
  amc: [number, number];
  domainYearly: [number, number];
}

export function computeBaseline(input: EstimateInput): BaselineResult {
  const type = PROJECT_TYPES.find((t) => t.id === input.projectType) ?? PROJECT_TYPES[1];
  const lineItems: LineItem[] = [{ name: `${type.name} — core build`, hours: type.hours }];

  const extraPages = Math.max(0, input.pages - type.includedPages);
  if (extraPages > 0) {
    lineItems.push({ name: `${extraPages} additional pages/screens`, hours: [extraPages * 3, extraPages * 6] });
  }

  let monthlyLo = type.monthlyRunning[0];
  let monthlyHi = type.monthlyRunning[1];

  for (const fid of input.features) {
    const f = FEATURES.find((x) => x.id === fid);
    if (!f) continue;
    if (f.monthly) {
      monthlyLo += f.monthly[0];
      monthlyHi += f.monthly[1];
    }
    if (f.includedIn?.includes(type.id)) continue;
    lineItems.push({
      name: f.name,
      hours: [Math.round(f.hours[0] * type.featureScale), Math.round(f.hours[1] * type.featureScale)],
    });
  }

  // Project management + QA overhead grows with complexity
  const rawLo = lineItems.reduce((s, l) => s + l.hours[0], 0);
  const rawHi = lineItems.reduce((s, l) => s + l.hours[1], 0);
  const design = DESIGN_LEVELS.find((d) => d.id === input.design)!;
  const scale = SCALE_LEVELS.find((s) => s.id === input.scale)!;
  const urgency = URGENCY.find((u) => u.id === input.urgency)!;
  const city = CITY_TIERS.find((c) => c.id === input.city)!;

  const multiplier = design.mult * scale.mult * urgency.mult;
  const hours: [number, number] = [Math.round(rawLo * multiplier), Math.round(rawHi * multiplier)];
  const hoursLikely = (hours[0] + hours[1]) / 2;

  const quotes: VendorQuote[] = VENDORS.map((vendor) => {
    const midRate = ((vendor.rate[0] + vendor.rate[1]) / 2) * city.mult;
    // Quote range is centred on the most-likely effort; ±15–20% reflects
    // real variance between vendors of the same tier, not worst-case scope.
    const likely = roundQuote(hoursLikely * midRate);
    const low = roundQuote(hoursLikely * midRate * 0.85);
    const high = roundQuote(hoursLikely * midRate * 1.2);
    const perWeek = vendor.capacity * urgency.speed;
    const weeks: [number, number] = [
      Math.max(1, Math.round(hours[0] / perWeek)),
      Math.max(1, Math.ceil(hours[1] / perWeek)),
    ];
    return { vendor, low, likely, high, weeks };
  });

  const selected = quotes.find((q) => q.vendor.id === input.vendor) ?? quotes[1];
  const amc: [number, number] = [roundQuote(selected.likely * 0.15), roundQuote(selected.likely * 0.22)];

  return {
    type,
    lineItems,
    hours,
    multiplier,
    quotes,
    selected,
    monthly: [roundQuote(monthlyLo), roundQuote(monthlyHi)],
    amc,
    domainYearly: [800, 1_500],
  };
}

export function describeInput(input: EstimateInput): string {
  const type = PROJECT_TYPES.find((t) => t.id === input.projectType)!;
  const feats = input.features
    .map((id) => FEATURES.find((f) => f.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  return [
    `Project category selected: ${type.name} (${type.tagline})`,
    `Selected features: ${feats || "none selected"}`,
    `Approx. pages/screens: ${input.pages}`,
    `Design level: ${DESIGN_LEVELS.find((d) => d.id === input.design)!.name}`,
    `Scale & reliability: ${SCALE_LEVELS.find((s) => s.id === input.scale)!.name} (${SCALE_LEVELS.find((s) => s.id === input.scale)!.desc})`,
    `Timeline urgency: ${URGENCY.find((u) => u.id === input.urgency)!.name}`,
    `Preferred vendor type: ${VENDORS.find((v) => v.id === input.vendor)!.name}`,
    `Vendor location: ${CITY_TIERS.find((c) => c.id === input.city)!.name}`,
  ].join("\n");
}
