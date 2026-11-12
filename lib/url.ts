/**
 * Encode / decode estimator inputs in the URL so every estimate has a
 * shareable, bookmarkable link.
 */
import {
  CITY_TIERS,
  DEFAULT_INPUT,
  DESIGN_LEVELS,
  ECOM_PLATFORMS,
  FEATURES,
  PROJECT_TYPES,
  SCALE_LEVELS,
  URGENCY,
  VENDORS,
  normalizeInput,
  type EstimateInput,
  type VendorId,
} from "./pricing";
import { EXAMPLES } from "./examples";

/** Longer briefs are left out of the link (use Save instead). */
export const MAX_URL_DESCRIPTION = 1500;

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function pick<T extends string>(value: string | undefined, options: { id: T }[], fallback: T): T {
  return options.some((o) => o.id === value) ? (value as T) : fallback;
}

export function inputFromParams(params: Params): EstimateInput {
  const ex = EXAMPLES.find((e) => e.id === first(params.ex));
  const base: EstimateInput = normalizeInput({ ...DEFAULT_INPUT, ...ex?.input });
  if (ex) return base;

  const featureIds = new Set(FEATURES.map((f) => f.id));
  const f = first(params.f);
  const pages = Number(first(params.p));

  const vendorParam = first(params.vendor);
  return normalizeInput({
    description: (first(params.d) ?? base.description).slice(0, 6000),
    projectType: pick(first(params.t), PROJECT_TYPES, base.projectType),
    features: f !== undefined ? f.split(",").filter((x) => featureIds.has(x)) : base.features,
    pages: Number.isFinite(pages) && pages >= 1 ? Math.min(120, Math.round(pages)) : base.pages,
    design: pick(first(params.design), DESIGN_LEVELS, base.design),
    scale: pick(first(params.scale), SCALE_LEVELS, base.scale),
    urgency: pick(first(params.urgency), URGENCY, base.urgency),
    vendor: vendorParam === "own" ? ("own" as VendorId) : pick(vendorParam, VENDORS, base.vendor),
    city: pick(first(params.city), CITY_TIERS, base.city),
    ecomPlatform: pick(first(params.ec), ECOM_PLATFORMS, base.ecomPlatform),
    mobileApps: Number(first(params.apps)) || base.mobileApps,
    myRate: Number(first(params.rate)) || 0,
  });
}

export function inputToQuery(input: EstimateInput, name?: string): string {
  const q = new URLSearchParams();
  if (name) q.set("name", name);
  q.set("t", input.projectType);
  q.set("f", input.features.join(","));
  q.set("p", String(input.pages));
  q.set("design", input.design);
  q.set("scale", input.scale);
  q.set("urgency", input.urgency);
  q.set("vendor", input.vendor);
  q.set("city", input.city);
  if (input.projectType === "ecommerce") q.set("ec", input.ecomPlatform);
  if (input.features.includes("mobile") && input.mobileApps > 1) q.set("apps", String(input.mobileApps));
  if (input.myRate > 0) q.set("rate", String(input.myRate));
  const d = input.description.trim();
  if (d && d.length <= MAX_URL_DESCRIPTION) q.set("d", d);
  return q.toString();
}
