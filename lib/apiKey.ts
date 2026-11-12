/**
 * The visitor's own Anthropic API key, kept only in this browser's
 * localStorage and sent to our /api/estimate route per request.
 */
const KEY = "quotesense:anthropic-key";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setApiKey(value: string) {
  const v = value.trim();
  if (v) window.localStorage.setItem(KEY, v);
  else window.localStorage.removeItem(KEY);
}

export function looksLikeKey(value: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{10,}$/.test(value.trim());
}

export function maskKey(value: string): string {
  return value.length > 14 ? `${value.slice(0, 10)}…${value.slice(-4)}` : "••••";
}
