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
    hours: [6, 14],
    includedPages: 5,
    market: [5_000, 50_000],
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
    hours: [14, 30],
    includedPages: 10,
    market: [25_000, 2_50_000],
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
    hours: [30, 70],
    includedPages: 12,
    market: [20_000, 8_00_000],
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
    hours: [90, 200],
    includedPages: 15,
    market: [1_50_000, 15_00_000],
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
    hours: [220, 460],
    includedPages: 25,
    market: [6_00_000, 55_00_000],
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
    hours: [650, 1400],
    includedPages: 40,
    market: [50_00_000, 1_50_00_000],
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
  { id: "auth", name: "User accounts & login", hours: [3, 8], includedIn: ["webapp", "platform", "enterprise"], group: "Core" },
  { id: "admin", name: "Admin dashboard", hours: [10, 24], includedIn: ["webapp", "platform", "enterprise"], group: "Core" },
  { id: "cms", name: "Blog / CMS", hours: [3, 6], includedIn: ["business"], group: "Core" },
  { id: "seo", name: "SEO setup & speed optimisation", hours: [3, 6], group: "Core" },
  { id: "multilang", name: "Multi-language (Hindi/regional)", hours: [6, 16], group: "Core" },
  { id: "search", name: "Advanced search & filters", hours: [4, 12], group: "Core" },
  { id: "roles", name: "Roles & permissions", hours: [4, 12], includedIn: ["enterprise"], group: "Core" },

  { id: "payments", name: "Payment gateway (Razorpay/UPI)", hours: [4, 10], includedIn: ["ecommerce"], group: "Commerce" },
  { id: "catalog", name: "Product catalog & cart", hours: [12, 30], includedIn: ["ecommerce"], group: "Commerce" },
  { id: "booking", name: "Booking / appointments", hours: [10, 26], group: "Commerce" },
  { id: "subscriptions", name: "Subscription billing", hours: [8, 20], includedIn: ["platform"], group: "Commerce" },
  { id: "multivendor", name: "Multi-vendor marketplace", hours: [40, 90], group: "Commerce" },
  { id: "gst", name: "GST invoicing & reports", hours: [6, 14], group: "Commerce" },

  { id: "notifications", name: "Email / SMS / WhatsApp alerts", hours: [3, 8], monthly: [500, 5_000], group: "Engagement" },
  { id: "chat", name: "Real-time chat", hours: [12, 32], monthly: [0, 3_000], group: "Engagement" },
  { id: "maps", name: "Maps & location", hours: [2, 6], monthly: [0, 4_000], group: "Engagement" },
  { id: "reviews", name: "Ratings & reviews", hours: [3, 8], group: "Engagement" },
  { id: "analytics", name: "Analytics & reports dashboard", hours: [8, 24], group: "Engagement" },

  { id: "ai", name: "AI chatbot / recommendations", hours: [10, 32], monthly: [2_000, 20_000], group: "Advanced" },
  { id: "integrations", name: "3rd-party API integrations", hours: [6, 16], group: "Advanced" },
  { id: "erp", name: "ERP / CRM / Tally integration", hours: [20, 60], group: "Advanced" },
  { id: "migration", name: "Data migration from old system", hours: [6, 20], group: "Advanced" },
  { id: "mobile", name: "Mobile app (Android + iOS)", hours: [120, 280], monthly: [700, 2_000], group: "Advanced" },
  { id: "pwa", name: "PWA / offline support", hours: [4, 10], group: "Advanced" },
];

export type DesignLevel = "template" | "custom" | "premium";
/** Design time as a share of build time, with a floor so tiny builds still get real design hours. */
export const DESIGN_LEVELS: { id: DesignLevel; name: string; desc: string; pct: number; min: [number, number] }[] = [
  { id: "template", name: "Template-based", desc: "Customised premium theme", pct: 0.08, min: [2, 4] },
  { id: "custom", name: "Custom UI/UX", desc: "Figma design, unique layout", pct: 0.25, min: [6, 12] },
  { id: "premium", name: "Premium / branded", desc: "Motion, illustrations, design system", pct: 0.45, min: [14, 28] },
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

export type VendorId = "freelancer" | "small" | "mid" | "premium" | "own";
export interface Vendor {
  id: VendorId;
  name: string;
  desc: string;
  /** Blended hourly rate in INR (design + dev + QA + PM) for metro clients */
  rate: [number, number];
  /** Productive hours per week this vendor typically puts on one project */
  capacity: number;
  /** Who this suits */
  fit: string;
}

/**
 * Market vendors. Rates recalibrated Nov 2026 against published Indian data:
 * domestic freelancers ₹500–2,500/h (midpoint ~₹1,500),
 * Indian firms $10–40/h, Clutch-listed mid-size firms commonly $25–49/h.
 */
export const VENDORS: Vendor[] = [
  { id: "freelancer", name: "Freelancer", desc: "1–2 people", rate: [600, 1_600], capacity: 25, fit: "Budget, simple scope" },
  { id: "small", name: "Small Agency", desc: "5–20 people", rate: [1_300, 2_400], capacity: 35, fit: "Most SMB projects" },
  { id: "mid", name: "Mid-size Agency", desc: "20–150 people", rate: [2_200, 3_800], capacity: 60, fit: "Funded startups, complex apps" },
  { id: "premium", name: "Premium / Tier-1", desc: "Top studios & IT firms", rate: [3_800, 7_000], capacity: 90, fit: "Enterprise, brand-critical" },
];

/** "Me / my team": prices the same scope at the user's own hourly rate. */
export function ownVendor(rate: number): Vendor {
  return { id: "own", name: "Your rate", desc: "You / your team", rate: [rate, rate], capacity: 30, fit: "Your own quote" };
}

export type CityTier = "metro" | "tier2";
export const CITY_TIERS: { id: CityTier; name: string; mult: number }[] = [
  { id: "metro", name: "Metro (Mumbai, Bengaluru, Delhi NCR, Pune, Hyderabad)", mult: 1 },
  { id: "tier2", name: "Tier-2/3 city vendor", mult: 0.82 },
];

/**
 * E-commerce is priced very differently by platform: a Shopify theme setup
 * (₹25–65K in the market) vs a custom storefront + backend (₹4–8L typical).
 */
export type EcomPlatform = "shopify" | "woocommerce" | "custom";
export const ECOM_PLATFORMS: {
  id: EcomPlatform;
  name: string;
  desc: string;
  hours: [number, number];
  featureScale: number;
  monthly: [number, number];
}[] = [
  { id: "shopify", name: "Shopify", desc: "Theme + apps, fastest", hours: [14, 32], featureScale: 0.5, monthly: [2_500, 12_000] },
  { id: "woocommerce", name: "WooCommerce", desc: "WordPress + plugins", hours: [20, 45], featureScale: 0.6, monthly: [1_000, 6_000] },
  { id: "custom", name: "Custom build", desc: "Own storefront + backend", hours: [70, 150], featureScale: 0.9, monthly: [3_000, 20_000] },
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
  /** Only used for e-commerce */
  ecomPlatform: EcomPlatform;
  /** Separate mobile apps (e.g. customer + vendor + delivery = 3); used with the "mobile" feature */
  mobileApps: number;
  /** User's own blended hourly rate in INR; 0 = not set */
  myRate: number;
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
  ecomPlatform: "shopify",
  mobileApps: 1,
  myRate: 0,
};

/** Fill fields missing from older saved estimates / links, and clamp numbers. */
export function normalizeInput(input: Partial<EstimateInput>): EstimateInput {
  const merged = { ...DEFAULT_INPUT, ...input };
  merged.mobileApps = Math.min(3, Math.max(1, Math.round(Number(merged.mobileApps) || 1)));
  merged.myRate = Math.min(20_000, Math.max(0, Math.round(Number(merged.myRate) || 0)));
  if (!ECOM_PLATFORMS.some((p) => p.id === merged.ecomPlatform)) merged.ecomPlatform = "shopify";
  if (merged.vendor === "own" && !merged.myRate) merged.vendor = "small";
  return merged;
}

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
  /** Effective feature scale for this build (platform-aware for e-commerce) */
  featureScale: number;
  lineItems: LineItem[];
  hours: [number, number];
  multiplier: number;
  /** Market vendors, plus "Your rate" when set */
  quotes: VendorQuote[];
  selected: VendorQuote;
  monthly: [number, number];
  /** Annual maintenance (AMC), typically 15–20% of build */
  amc: [number, number];
  domainYearly: [number, number];
  /** How wide the price range is and why */
  confidence: { label: "Normal" | "Moderate" | "Wide"; reason: string };
}

export function computeBaseline(rawInput: EstimateInput): BaselineResult {
  const input = normalizeInput(rawInput);
  const type = PROJECT_TYPES.find((t) => t.id === input.projectType) ?? PROJECT_TYPES[1];
  const platform = type.id === "ecommerce" ? ECOM_PLATFORMS.find((p) => p.id === input.ecomPlatform) ?? ECOM_PLATFORMS[0] : null;
  // Fewer pages than the type includes = smaller core (a 1-page site is not a 5-page site), down to 50%.
  const pageFactor = input.pages < type.includedPages ? 0.5 + 0.5 * (input.pages / type.includedPages) : 1;
  const baseCore = platform ? platform.hours : type.hours;
  const coreHours: [number, number] = [Math.max(2, Math.round(baseCore[0] * pageFactor)), Math.max(4, Math.round(baseCore[1] * pageFactor))];
  const featureScale = platform ? platform.featureScale : type.featureScale;

  const lineItems: LineItem[] = [{ name: platform ? `${platform.name} store — core build` : `${type.name} — core build`, hours: coreHours }];

  const extraPages = Math.max(0, input.pages - type.includedPages);
  if (extraPages > 0) {
    lineItems.push({ name: `${extraPages} additional pages/screens`, hours: [extraPages * 1, extraPages * 3] });
  }

  let monthlyLo = platform ? platform.monthly[0] : type.monthlyRunning[0];
  let monthlyHi = platform ? platform.monthly[1] : type.monthlyRunning[1];

  for (const fid of input.features) {
    const f = FEATURES.find((x) => x.id === fid);
    if (!f) continue;
    // extra apps (vendor, delivery…) share the backend and components, so each adds ~60%
    const appMult = f.id === "mobile" ? 1 + 0.6 * (input.mobileApps - 1) : 1;
    if (f.monthly) {
      monthlyLo += f.monthly[0] * appMult;
      monthlyHi += f.monthly[1] * appMult;
    }
    if (f.includedIn?.includes(type.id)) continue;
    const scale = f.id === "mobile" ? 1 : featureScale; // an app is an app, whatever the website is
    lineItems.push({
      name: f.id === "mobile" && input.mobileApps > 1 ? `${input.mobileApps} mobile apps (Android + iOS)` : f.name,
      hours: [Math.round(f.hours[0] * scale * appMult), Math.round(f.hours[1] * scale * appMult)],
    });
  }

  // Hands-on build time so far. Everything a real team also spends time on is added
  // as its own visible line, so no single feature line is padded.
  const buildLo = lineItems.reduce((s, l) => s + l.hours[0], 0);
  const buildHi = lineItems.reduce((s, l) => s + l.hours[1], 0);
  const design = DESIGN_LEVELS.find((d) => d.id === input.design)!;
  const designH: [number, number] = [
    Math.max(design.min[0], Math.round(buildLo * design.pct)),
    Math.max(design.min[1], Math.round(buildHi * design.pct)),
  ];
  const qaH: [number, number] = [Math.max(1, Math.round(buildLo * 0.12)), Math.max(2, Math.round(buildHi * 0.12))];
  const pmH: [number, number] = [
    Math.max(1, Math.round((buildLo + designH[0] + qaH[0]) * 0.1)),
    Math.max(2, Math.round((buildHi + designH[1] + qaH[1]) * 0.1)),
  ];
  const big = type.id === "enterprise";
  const appLike = ["webapp", "platform"].includes(type.id) || platform?.id === "custom" || input.features.includes("mobile");
  const deployH: [number, number] = big ? [16, 40] : appLike ? [6, 14] : [2, 4];
  lineItems.push(
    { name: `${design.name} design`, hours: designH },
    { name: "QA & testing", hours: qaH },
    { name: "Project management & client calls", hours: pmH },
    { name: input.features.includes("mobile") ? "Deployment, app-store release & handover" : "Deployment & handover", hours: deployH },
  );

  const rawLo = lineItems.reduce((s, l) => s + l.hours[0], 0);
  const rawHi = lineItems.reduce((s, l) => s + l.hours[1], 0);
  const scale = SCALE_LEVELS.find((s) => s.id === input.scale)!;
  const urgency = URGENCY.find((u) => u.id === input.urgency)!;
  const city = CITY_TIERS.find((c) => c.id === input.city)!;

  const multiplier = scale.mult * urgency.mult;
  const hours: [number, number] = [Math.round(rawLo * multiplier), Math.round(rawHi * multiplier)];
  const hoursLikely = (hours[0] + hours[1]) / 2;

  // Range width: base −15% / +20% (vendor variance), widened when the brief is thin
  // or the project is large, because scope is then genuinely less certain.
  const briefLen = input.description.trim().length;
  let spread = 0;
  const reasons: string[] = [];
  if (briefLen < 120) {
    spread += 0.1;
    reasons.push("the brief is short");
  } else if (briefLen < 400) {
    spread += 0.05;
    reasons.push("the brief is light on detail");
  }
  if (hoursLikely > 800) {
    spread += 0.05;
    reasons.push("it's a large project");
  }
  const lowF = 0.85 - spread;
  const highF = 1.2 + spread * 1.5;
  const confidence: BaselineResult["confidence"] = {
    label: spread >= 0.1 ? "Wide" : spread > 0 ? "Moderate" : "Normal",
    reason: reasons.length ? `Range widened because ${reasons.join(" and ")}.` : "Detailed brief: range reflects normal vendor variance.",
  };

  const quoteFor = (vendor: Vendor, rate: number): VendorQuote => {
    const likely = roundQuote(hoursLikely * rate);
    const low = roundQuote(hoursLikely * rate * lowF);
    const high = roundQuote(hoursLikely * rate * highF);
    const perWeek = vendor.capacity * urgency.speed;
    // +1 week for client feedback rounds, content hand-off and launch
    const weeks: [number, number] = [
      Math.max(1, Math.round(hours[0] / perWeek)) + 1,
      Math.max(1, Math.ceil(hours[1] / perWeek)) + 1,
    ];
    return { vendor, low, likely, high, weeks };
  };

  const quotes: VendorQuote[] = VENDORS.map((v) => quoteFor(v, ((v.rate[0] + v.rate[1]) / 2) * city.mult));
  if (input.myRate > 0) quotes.push(quoteFor(ownVendor(input.myRate), input.myRate));

  const selected = quotes.find((q) => q.vendor.id === input.vendor) ?? quotes[1];
  const amc: [number, number] = [roundQuote(selected.likely * 0.15), roundQuote(selected.likely * 0.22)];

  return {
    type,
    featureScale,
    lineItems,
    hours,
    multiplier,
    quotes,
    selected,
    monthly: [roundQuote(monthlyLo), roundQuote(monthlyHi)],
    amc,
    domainYearly: [800, 1_500],
    confidence,
  };
}

export function describeInput(rawInput: EstimateInput): string {
  const input = normalizeInput(rawInput);
  const type = PROJECT_TYPES.find((t) => t.id === input.projectType)!;
  const feats = input.features
    .map((id) => FEATURES.find((f) => f.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  const vendor =
    input.vendor === "own"
      ? `Built in-house by the sales team's own company at a blended ₹${input.myRate.toLocaleString("en-IN")}/hour (price "recommended" at this rate)`
      : VENDORS.find((v) => v.id === input.vendor)!.name;
  return [
    `Project category selected: ${type.name} (${type.tagline})`,
    ...(type.id === "ecommerce" ? [`E-commerce platform: ${ECOM_PLATFORMS.find((p) => p.id === input.ecomPlatform)!.name}`] : []),
    `Selected features: ${feats || "none selected"}`,
    ...(input.features.includes("mobile") ? [`Number of separate mobile apps: ${input.mobileApps}`] : []),
    `Approx. pages/screens: ${input.pages}`,
    `Design level: ${DESIGN_LEVELS.find((d) => d.id === input.design)!.name}`,
    `Scale & reliability: ${SCALE_LEVELS.find((s) => s.id === input.scale)!.name} (${SCALE_LEVELS.find((s) => s.id === input.scale)!.desc})`,
    `Timeline urgency: ${URGENCY.find((u) => u.id === input.urgency)!.name}`,
    `Preferred vendor type: ${vendor}`,
    `Vendor location: ${CITY_TIERS.find((c) => c.id === input.city)!.name}`,
  ].join("\n");
}
