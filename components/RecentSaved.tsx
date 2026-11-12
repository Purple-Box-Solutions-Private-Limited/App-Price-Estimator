"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listSaved, type SavedEstimate } from "@/lib/saved";
import { formatRange } from "@/lib/format";

export default function RecentSaved() {
  const [items, setItems] = useState<SavedEstimate[] | null>(null);
  useEffect(() => setItems(listSaved().slice(0, 5)), []);

  return (
    <div className="plate flex flex-col bg-paper-2/60 p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-4xl leading-none">
          On your <em className="text-accent">desk</em>
        </h2>
        <Link href="/saved" className="kicker underline decoration-accent decoration-2 underline-offset-4 hover:text-ink">
          All saved →
        </Link>
      </div>
      {items === null ? (
        <div className="shimmer mt-5 h-24 rounded-lg" />
      ) : items.length === 0 ? (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-zinc-400 p-6 text-center">
          <div className="font-display text-3xl italic text-zinc-500">Nothing filed yet.</div>
          <p className="mt-2 max-w-xs text-sm text-zinc-600">Saved estimates stay in this browser, ready to reopen, re-price or print.</p>
          <Link href="/estimate" className="btn btn-ink mt-4 px-4 py-2 text-sm">
            Start one
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((s, i) => (
            <li key={s.id} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <Link
                href={`/estimate?id=${s.id}`}
                className="group flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-ink bg-sheet px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-ink)]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="kicker !text-[10px]">
                    {s.summary.source === "ai" ? "AI · " : ""}
                    {s.summary.typeName.slice(0, 32)} · {new Date(s.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </span>
                <span className="num shrink-0 font-semibold group-hover:text-accent">{formatRange(s.summary.low, s.summary.high)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
