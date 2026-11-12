import type { Metadata } from "next";
import Estimator from "@/components/Estimator";
import { inputFromParams } from "@/lib/url";

export const metadata: Metadata = { title: "Estimate" };

export default async function EstimatePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const savedId = one(params.id) || undefined;

  return (
    <main>
      <Estimator key={savedId ?? "new"} initialInput={inputFromParams(params)} initialName={one(params.name).slice(0, 120)} savedId={savedId} />
    </main>
  );
}
