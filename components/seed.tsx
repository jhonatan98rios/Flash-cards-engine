"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SeedSampleButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadSample() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/sample", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.ok && data.topicId) {
      router.push(`/topics/${data.topicId}`);
    } else {
      setMsg(data.message ?? "Something went wrong.");
    }
  }

  return (
    <div>
      <button
        onClick={loadSample}
        disabled={busy}
        className="text-sm text-zinc-500 underline decoration-dotted hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
      >
        {busy ? "Loading…" : "or load a sample topic"}
      </button>
      {msg && <p className="mt-1 text-sm text-zinc-500">{msg}</p>}
    </div>
  );
}
