"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { deleteSaved, listSaved, newId, upsertSaved, type SavedEstimate } from "@/lib/saved";
import { formatINRCompact, formatRange } from "@/lib/format";
import { TypeIcon } from "./ui";

export default function SavedList() {
  const [items, setItems] = useState<SavedEstimate[] | null>(null);
  const [q, setQ] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const refresh = () => setItems(listSaved());
  useEffect(refresh, []);

  const filtered = (items ?? []).filter((s) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return [s.name, s.summary.typeName, s.input.description].some((x) => x.toLowerCase().includes(needle));
  });
  const total = filtered.reduce((sum, s) => sum + s.summary.likely, 0);

  const duplicate = (s: SavedEstimate) => {
    const now = new Date().toISOString();
    upsertSaved({ ...s, id: newId(), name: `${s.name} (copy)`, createdAt: now, updatedAt: now });
    refresh();
  };

  const remove = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    deleteSaved(id);
    setConfirmId("");
    refresh();
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(listSaved(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `quotesense-estimates-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importFile = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const list = (Array.isArray(data) ? data : [data]) as SavedEstimate[];
      const valid = list.filter((s) => s && typeof s.id === "string" && s.input && s.summary);
      valid.forEach(upsertSaved);
      setMsg(`Imported ${valid.length} estimate${valid.length === 1 ? "" : "s"}.`);
      refresh();
    } catch {
      setMsg("Couldn't read that file. Use a JSON export from this site.");
    }
  };

  return (
    <div>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <span className="num pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">⌕</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, type or brief…" className="field py-2.5 pl-9 pr-3 text-sm" />
        </div>
        <button type="button" onClick={exportAll} className="btn px-3.5 py-2 text-sm">
          ↓ Export
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="btn px-3.5 py-2 text-sm">
          ↑ Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {msg && <p className="num mt-2 text-sm">{msg}</p>}

      {items && items.length > 0 && (
        <div className="mt-6 grid grid-cols-3 border-y-[1.5px] border-ink">
          {[
            ["Estimates", String(filtered.length)],
            ["Pipeline value", formatINRCompact(total)],
            ["AI-verified", String(filtered.filter((s) => s.summary.source === "ai").length)],
          ].map(([k, v], i) => (
            <div key={k} className={`px-4 py-3 ${i ? "border-l border-zinc-300" : ""}`}>
              <div className="kicker">{k}</div>
              <div className="num text-3xl font-semibold">{v}</div>
            </div>
          ))}
        </div>
      )}

      {items === null ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-56 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-2xl border-[1.5px] border-dashed border-zinc-400 px-6 py-16 text-center">
          <div className="font-display text-5xl italic text-zinc-500">{items.length === 0 ? "The drawer is empty." : "No matches."}</div>
          {items.length === 0 && (
            <>
              <p className="mt-3 max-w-sm text-ink-2">Save an estimate and it&apos;s filed here, in this browser, ready to reopen, re-price or print.</p>
              <Link href="/estimate" className="btn btn-ink mt-6 px-5 py-2.5 text-sm">
                Start an estimate →
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s, i) => (
            <article
              key={s.id}
              className="fade-up group relative"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms`, transform: `rotate(${((i % 3) - 1) * 0.6}deg)` }}
            >
              <div className="receipt-wrap transition duration-200 group-hover:-translate-y-1 group-hover:rotate-0">
                <div className="receipt px-5 pb-5 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg border-[1.5px] border-ink bg-paper">
                      <TypeIcon id={s.input.projectType} className="h-5 w-5" />
                    </span>
                    <span
                      className={`rounded-md border-[1.5px] border-ink px-2 py-0.5 text-[10px] font-bold ${s.summary.source === "ai" ? "bg-cobalt text-white" : "bg-lime"}`}
                    >
                      {s.summary.source === "ai" ? "AI" : "INSTANT"}
                    </span>
                  </div>
                  <Link href={`/estimate?id=${s.id}`} className="mt-3 block font-sans text-lg font-semibold leading-snug hover:text-accent">
                    {s.name}
                  </Link>
                  <div className="text-xs text-zinc-500">
                    {s.summary.typeName} · {s.summary.vendorName}
                  </div>
                  <div className="rule-dash my-3" />
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">likely</div>
                      <div className="text-3xl font-bold leading-none">{formatINRCompact(s.summary.likely)}</div>
                      <div className="mt-1 text-xs text-zinc-600">{formatRange(s.summary.low, s.summary.high)}</div>
                    </div>
                    <div className="text-right text-xs text-zinc-600">
                      <div>
                        {s.summary.weeks[0]}–{s.summary.weeks[1]} wk
                      </div>
                      <div>{new Date(s.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</div>
                    </div>
                  </div>
                  <div className="rule-dash my-3" />
                  <div className="flex items-center justify-between font-sans text-sm">
                    <Link href={`/estimate?id=${s.id}`} className="font-semibold underline decoration-accent decoration-2 underline-offset-4">
                      Open
                    </Link>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => duplicate(s)} className="text-zinc-600 hover:text-ink">
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(s.id)}
                        onBlur={() => setConfirmId("")}
                        className={confirmId === s.id ? "font-bold text-accent" : "text-zinc-600 hover:text-accent"}
                      >
                        {confirmId === s.id ? "Confirm delete" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="kicker mt-10">Saved in this browser only · use export / import to move between devices</p>
    </div>
  );
}
