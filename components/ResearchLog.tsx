"use client";

import type { Source } from "@/lib/schema";

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function ResearchLog({
  statuses,
  queries,
  sources,
  running,
  elapsed = 0,
}: {
  statuses: string[];
  queries: string[];
  sources: Source[];
  running: boolean;
  elapsed?: number;
}) {
  return (
    <div className="sheet fade-up overflow-hidden">
      <div className="flex items-center justify-between border-b-[1.5px] border-ink bg-ink px-5 py-3 text-paper">
        <div className="flex items-center gap-3">
          {running && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime" />
            </span>
          )}
          <span className="font-display text-2xl leading-none">{running ? "Researching the Indian market" : "Research log"}</span>
        </div>
        <span className="num text-xs text-paper/60">
          {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
        </span>
      </div>
      <div className="num border-b border-dashed border-zinc-300 bg-paper-2/50 px-5 py-2.5 text-sm">
        <span className="text-accent">›</span> <span className={running ? "caret" : ""}>{statuses[statuses.length - 1] ?? "Starting…"}</span>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="border-zinc-300 p-5 md:border-r md:border-dashed">
          <div className="kicker mb-3">Searches · {queries.length}</div>
          <ol className="space-y-2">
            {queries.map((q, i) => (
              <li key={i} className="print-line num flex gap-3 text-[13px]">
                <span className="text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
                <span>{q}</span>
              </li>
            ))}
            {running && <li className="shimmer h-4 w-3/4 rounded" />}
          </ol>
        </div>
        <div className="p-5">
          <div className="kicker mb-3">Sources read · {sources.length}</div>
          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-2">
            {sources.map((s) => (
              <li key={s.url} className="print-line truncate text-sm">
                <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                  <span className="num text-xs text-zinc-500">{host(s.url)}</span> · {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
