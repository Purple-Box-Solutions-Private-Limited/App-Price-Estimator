/** Round to a "quote-friendly" figure so we never show fake precision like ₹1,23,457. */
export function roundQuote(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n < 20_000) return Math.round(n / 500) * 500;
  if (n < 1_00_000) return Math.round(n / 1_000) * 1_000;
  if (n < 10_00_000) return Math.round(n / 5_000) * 5_000;
  if (n < 1_00_00_000) return Math.round(n / 25_000) * 25_000;
  return Math.round(n / 1_00_000) * 1_00_000;
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹1,25,000 */
export function formatINR(n: number): string {
  return `₹${inr.format(Math.round(n))}`;
}

/** ₹1.25 L / ₹2.4 Cr / ₹45K — compact Indian notation */
export function formatINRCompact(n: number): string {
  const v = Math.round(n);
  if (v >= 1_00_00_000) return `₹${trim(v / 1_00_00_000)} Cr`;
  if (v >= 1_00_000) return `₹${trim(v / 1_00_000)} L`;
  if (v >= 1_000) return `₹${trim(v / 1_000)}K`;
  return `₹${v}`;
}

function trim(x: number): string {
  const s = x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2);
  return s.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

export function formatRange(lo: number, hi: number): string {
  if (Math.abs(hi - lo) < 1) return formatINRCompact(lo);
  return `${formatINRCompact(lo)} – ${formatINRCompact(hi)}`;
}
