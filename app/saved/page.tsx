import type { Metadata } from "next";
import Link from "next/link";
import SavedList from "@/components/SavedList";

export const metadata: Metadata = { title: "Saved estimates" };

export default function SavedPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-5 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-[1.5px] border-ink pb-6 pt-10">
        <div>
          <div className="kicker">02 · Filing drawer</div>
          <h1 className="mt-2 text-[clamp(3rem,6vw,5.5rem)] leading-[0.95]">
            Saved <em className="text-accent">estimates</em>
          </h1>
        </div>
        <Link href="/estimate" className="btn btn-ink px-5 py-2.5 text-sm">
          ＋ New estimate
        </Link>
      </div>
      <div className="mt-6">
        <SavedList />
      </div>
    </main>
  );
}
