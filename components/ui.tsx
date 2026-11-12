"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectTypeId } from "@/lib/pricing";

/** Tween a number toward `value` (ease-out), for rolling price readouts. */
export function useTween(value: number, ms = 650): number {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  const shownRef = useRef(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      shownRef.current = value;
      return;
    }
    fromRef.current = shownRef.current;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const v = fromRef.current + (value - fromRef.current) * e;
      shownRef.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}

export function RollingNumber({ value, format, className = "" }: { value: number; format: (n: number) => string; className?: string }) {
  const v = useTween(value);
  return <span className={`num ${className}`}>{format(v)}</span>;
}

/** Cycles through words with a typewriter feel. */
export function RotatingWord({ words, className = "" }: { words: string[]; className?: string }) {
  const [i, setI] = useState(0);
  const [len, setLen] = useState(words[0].length);
  const [dir, setDir] = useState<1 | -1>(1);
  useEffect(() => {
    const w = words[i];
    let t: ReturnType<typeof setTimeout>;
    if (dir === 1 && len === w.length) t = setTimeout(() => setDir(-1), 2200);
    else if (dir === -1 && len === 0) {
      setI((i + 1) % words.length);
      setDir(1);
    } else t = setTimeout(() => setLen((l) => l + dir), dir === 1 ? 70 : 35);
    return () => clearTimeout(t);
  }, [i, len, dir, words]);
  return (
    <span className={`caret ${className}`}>
      {words[i].slice(0, len)}
      <span className="sr-only">{words.join(", ")}</span>
    </span>
  );
}

export function TypeIcon({ id, className = "h-6 w-6" }: { id: ProjectTypeId; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {id === "landing" && (
        <g {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M7 7h10M7 11h6M7 15h8" />
        </g>
      )}
      {id === "business" && (
        <g {...common}>
          <path d="M4 21V8l8-5 8 5v13" />
          <path d="M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01" />
        </g>
      )}
      {id === "ecommerce" && (
        <g {...common}>
          <path d="M5 8h14l-1.2 12H6.2z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </g>
      )}
      {id === "webapp" && (
        <g {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M9 9v11M12 13h6M12 16h4" />
        </g>
      )}
      {id === "platform" && (
        <g {...common}>
          <circle cx="12" cy="5" r="2.2" />
          <circle cx="5" cy="18" r="2.2" />
          <circle cx="19" cy="18" r="2.2" />
          <path d="M11 7l-5 9M13 7l5 9M7.2 18h9.6" />
        </g>
      )}
      {id === "enterprise" && (
        <g {...common}>
          <ellipse cx="12" cy="6" rx="8" ry="3" />
          <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </g>
      )}
    </svg>
  );
}

export function SectionTitle({ n, title, hint, id }: { n: string; title: string; hint?: string; id?: string }) {
  return (
    <div id={id} className="mb-4 flex scroll-mt-32 items-end justify-between gap-3">
      <h3 className="flex items-baseline gap-3">
        <span className="font-display text-4xl leading-none text-accent">{n}</span>
        <span className="font-display text-[28px] leading-none text-ink">{title}</span>
      </h3>
      {hint && <span className="kicker hidden text-right sm:block">{hint}</span>}
    </div>
  );
}
