"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CITY_TIERS, DEFAULT_INPUT, PROJECT_TYPES, VENDORS, computeBaseline, type CityTier, type ProjectTypeId, type VendorId } from "@/lib/pricing";
import { formatINRCompact, formatRange } from "@/lib/format";
import { inputToQuery } from "@/lib/url";
import { RollingNumber, TypeIcon } from "./ui";

/** Budget sanity check for a first client call: type + vendor → range. */
export default function QuickCheck() {
  const [type, setType] = useState<ProjectTypeId>("business");
  const [vendor, setVendor] = useState<VendorId>("small");
  const [city, setCity] = useState<CityTier>("metro");

  const t = PROJECT_TYPES.find((x) => x.id === type)!;
  const input = useMemo(() => ({ ...DEFAULT_INPUT, projectType: type, vendor, city, pages: t.includedPages, features: [] }), [type, vendor, city, t]);
  const s = useMemo(() => computeBaseline(input), [input]).selected;

  return (
    <div className="sheet p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-4xl leading-none">
          Quick <em className="text-accent">budget</em> check
        </h2>
        <span className="kicker">base build · no add-ons</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PROJECT_TYPES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setType(p.id)}
            aria-pressed={type === p.id}
            className={`tile flex flex-col items-center gap-1.5 px-2 py-3 text-center ${type === p.id ? "tile-on" : ""}`}
          >
            <TypeIcon id={p.id} className="h-6 w-6" />
            <span className="text-[11px] font-medium leading-tight">{p.name.split(" ")[0].replace("/", "")}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {VENDORS.map((v) => (
          <button key={v.id} type="button" onClick={() => setVendor(v.id)} className={`chip ${vendor === v.id ? "chip-on" : ""}`}>
            {v.name}
          </button>
        ))}
        <span className="mx-1 self-center text-zinc-300">|</span>
        {CITY_TIERS.map((c) => (
          <button key={c.id} type="button" onClick={() => setCity(c.id)} className={`chip ${city === c.id ? "chip-on" : ""}`}>
            {c.id === "metro" ? "Metro" : "Tier-2/3"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 border-t-[1.5px] border-ink pt-5 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="kicker">Expected quote</div>
          <div className="mt-1 text-[2.6rem] font-semibold leading-none">
            <RollingNumber value={s.likely} format={formatINRCompact} />
          </div>
          <div className="num mt-1 text-sm text-zinc-600">{formatRange(s.low, s.high)}</div>
        </div>
        <div>
          <div className="kicker">Timeline</div>
          <div className="num mt-1 text-2xl font-semibold">
            {s.weeks[0]}–{s.weeks[1]} wk
          </div>
        </div>
        <div>
          <div className="kicker">Whole market</div>
          <div className="num mt-1 text-2xl font-semibold">{formatRange(t.market[0], t.market[1])}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-zinc-600">
          <span className="kicker mr-1">e.g.</span>
          {t.examples}
        </span>
        <Link href={`/estimate?${inputToQuery(input)}`} className="btn px-4 py-2 text-sm">
          Refine this →
        </Link>
      </div>
    </div>
  );
}
