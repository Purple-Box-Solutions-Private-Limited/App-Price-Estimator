/**
 * Saved estimates live in the browser (localStorage). No account needed.
 */
import type { EstimateInput } from "./pricing";
import type { AiEstimate, Source } from "./schema";

export interface SavedAi {
  estimate: AiEstimate;
  sources: Source[];
  notes: string;
  queries: string[];
  model: string;
}

export interface SavedQuote {
  markup: number;
  discount: number;
  gst: boolean;
}

export interface SavedEstimate {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  input: EstimateInput;
  /** Snapshot of the headline numbers at save time (for the list view) */
  summary: {
    typeName: string;
    vendorName: string;
    low: number;
    likely: number;
    high: number;
    weeks: [number, number];
    source: "instant" | "ai";
  };
  quote?: SavedQuote;
  ai?: SavedAi | null;
}

const KEY = "quotesense:saved:v1";

export function listSaved(): SavedEstimate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedEstimate[]) : [];
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

function write(list: SavedEstimate[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function getSaved(id: string): SavedEstimate | undefined {
  return listSaved().find((s) => s.id === id);
}

export function upsertSaved(item: SavedEstimate) {
  const list = listSaved().filter((s) => s.id !== item.id);
  write([item, ...list]);
}

export function deleteSaved(id: string) {
  write(listSaved().filter((s) => s.id !== id));
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
