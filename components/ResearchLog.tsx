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
}: {
  statuses: string[];
  queries: string[];
  sources: Source[];
  running: boolean;
}) {
  return (
    <div className="glass fade-up rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        {running && (
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
          </span>
        )}
        <h3 className="text-lg font-semibold text-white">{running ? "Researching the Indian market…" : "Research log"}</h3>
      </div>
      <p className="mt-1 text-sm text-zinc-400">{statuses[statuses.length - 1] ?? "Starting…"}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Searches ({queries.length})</div>
          <ul className="space-y-2">
            {queries.map((q, i) => (
              <li key={i} className="fade-up flex gap-2 text-sm text-zinc-300">
                <span className="text-cyan-400">⌕</span>
                {q}
              </li>
            ))}
            {running && <li className="shimmer h-5 w-3/4 rounded" />}
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Sources read ({sources.length})</div>
          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-2">
            {sources.map((s) => (
              <li key={s.url} className="fade-up truncate text-sm">
                <a href={s.url} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white">
                  <span className="text-zinc-500">{host(s.url)}</span> · {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
