import type { Metadata } from "next";
import ApiKeySettings from "@/components/ApiKeySettings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-[1000px] px-5 sm:px-8">
      <div className="border-b-[1.5px] border-ink pb-6 pt-10">
        <div className="kicker">04 · Settings · stored in this browser only</div>
        <h1 className="mt-2 text-[clamp(3rem,6vw,5.5rem)] leading-[0.95]">
          The <em className="text-accent">key</em> drawer
        </h1>
      </div>
      <div className="mt-8">
        <ApiKeySettings />
      </div>
    </main>
  );
}
