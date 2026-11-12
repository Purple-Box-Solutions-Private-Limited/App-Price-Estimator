"use client";

import { useEffect, useState } from "react";
import { getApiKey, looksLikeKey, maskKey, setApiKey } from "@/lib/apiKey";

export default function ApiKeySettings() {
  const [saved, setSaved] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [show, setShow] = useState(false);
  const [serverKey, setServerKey] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setSaved(getApiKey());
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setServerKey(Boolean(d.ai)))
      .catch(() => setServerKey(false));
  }, []);

  const save = () => {
    if (!looksLikeKey(draft)) {
      setMsg("That doesn't look like an Anthropic key. It should start with sk-ant-.");
      return;
    }
    setApiKey(draft);
    setSaved(draft.trim());
    setDraft("");
    setMsg("Saved in this browser.");
  };

  const remove = () => {
    setApiKey("");
    setSaved("");
    setMsg("Key removed from this browser.");
  };

  return (
    <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
      <div className="sheet overflow-hidden">
        <div className="flex items-center justify-between border-b-[1.5px] border-ink bg-cobalt px-5 py-3 text-white">
          <span className="font-display text-2xl leading-none">
            Anthropic <em>API key</em>
          </span>
          <span className="num text-[10px] uppercase tracking-widest text-white/75">localStorage</span>
        </div>

        <div className="p-5">
          {/* status plate */}
          <div className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-ink bg-paper-2/60 px-4 py-3">
            {saved === null ? (
              <span className="num text-sm text-zinc-500">checking…</span>
            ) : saved ? (
              <>
                <span className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-ink bg-lime text-sm">✓</span>
                  <span>
                    <span className="block text-sm font-semibold">Using your key</span>
                    <code className="num text-xs text-zinc-600">{maskKey(saved)}</code>
                  </span>
                </span>
                <button type="button" onClick={remove} className="btn px-3 py-1.5 text-xs">
                  Remove
                </button>
              </>
            ) : (
              <span className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-dashed border-zinc-500 text-sm text-zinc-500">–</span>
                <span className="text-sm">
                  <span className="block font-semibold">No key saved</span>
                  <span className="text-zinc-600">
                    {serverKey ? "The server has its own key, so AI research still works." : "AI research stays off until you add one."}
                  </span>
                </span>
              </span>
            )}
          </div>

          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label htmlFor="apikey" className="kicker">
              {saved ? "Replace key" : "Paste key"}
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="apikey"
                type={show ? "text" : "password"}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setMsg("");
                }}
                placeholder="sk-ant-..."
                autoComplete="off"
                spellCheck={false}
                className="field num min-w-0 flex-1 px-3 py-2.5 text-sm"
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="btn px-3 py-2 text-sm">
                {show ? "Hide" : "Show"}
              </button>
            </div>
            <button type="submit" disabled={!draft.trim()} className="btn btn-ink mt-3 w-full px-4 py-2.5 text-sm">
              Save key to this browser
            </button>
          </form>
          {msg && <p className="num mt-3 text-sm">{msg}</p>}
        </div>
      </div>

      <div className="space-y-5 text-sm leading-relaxed text-ink-2">
        <div>
          <div className="kicker mb-1">Where it lives</div>
          <p>Only in this browser&apos;s localStorage. It is sent with each research request; the server uses it for that request and does not store it.</p>
        </div>
        <div>
          <div className="kicker mb-1">What it costs</div>
          <p>Each deep-research run makes several web searches and two model calls, billed to the key&apos;s Anthropic account.</p>
        </div>
        <div>
          <div className="kicker mb-1">Shared computer?</div>
          <p>Anyone using this browser profile can use the saved key. Remove it when you&apos;re done.</p>
        </div>
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="btn px-4 py-2 text-sm">
          Get a key at console.anthropic.com ↗
        </a>
      </div>
    </div>
  );
}
