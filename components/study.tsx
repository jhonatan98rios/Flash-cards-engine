"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Flashcard, Question, Rating } from "@/lib/types";

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface ApiResult {
  ok: boolean;
  message?: string;
  topicId?: string;
  nextDate?: string;
  done?: boolean;
  correct?: boolean;
  correctIndex?: number;
}

async function postJSON(url: string, body: unknown): Promise<ApiResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}

// ---------- create topic (dashboard) ----------

export function CreateTopicForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const data = await postJSON("/api/topics", { subject, prompt });
    setBusy(false);
    if (data.ok && data.topicId) {
      router.push(`/topics/${data.topicId}`);
    } else {
      setMsg({ ok: false, text: data.message ?? "Something went wrong." });
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-sm font-medium" htmlFor="subject">
          Subject
        </label>
        <input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          placeholder="e.g. AI Practitioner Exam"
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="prompt">
          Dataset / goal
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          rows={3}
          placeholder="Paste your notes, dataset description, or what you want to study..."
          className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
        />
      </div>
      <button
        disabled={busy}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {busy ? "Generating…" : "Generate topic"}
      </button>
      {msg && (
        <p
          className={`text-sm ${msg.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}

// ---------- expand topic ----------

export function ExpandForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const data = await postJSON(`/api/topics/${topicId}/expand`, { instruction });
    setBusy(false);
    setMsg({ ok: data.ok, text: data.message ?? "Something went wrong." });
    if (data.ok) router.refresh(); // show the new material
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="text-sm font-medium" htmlFor="instruction">
        Expand this topic (sends the summary + this instruction to the AI)
      </label>
      <textarea
        id="instruction"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        required
        rows={2}
        placeholder="e.g. go deeper on transformers and attention"
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
      />
      <button
        disabled={busy}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {busy ? "Expanding…" : "Expand topic"}
      </button>
      {msg && (
        <p
          className={`text-sm ${msg.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}

// ---------- roadmap step toggle ----------

export function StepToggle({
  topicId,
  stepId,
  done,
}: {
  topicId: string;
  stepId: string;
  done: boolean;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await postJSON(`/api/topics/${topicId}/steps`, { stepId });
        router.refresh();
      }}
      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
        done
          ? "border-green-500 bg-green-500 text-white"
          : "border-black/20 dark:border-white/30"
      }`}
      aria-label={done ? "Mark as not done" : "Mark as done"}
    >
      {done && <span className="text-[10px]">✓</span>}
    </button>
  );
}

// ---------- flashcard ----------

export function FlashcardView({ card }: { card: Flashcard }) {
  const [flipped, setFlipped] = useState(false);
  const [scheduled, setScheduled] = useState<string | null>(null);

  async function rate(rating: Rating) {
    const data = await postJSON("/api/items", { kind: "card", id: card.id, rating });
    setScheduled(data.nextDate ?? "");
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setFlipped(!flipped)}
        className="h-48 w-full rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900"
        style={{ perspective: "1000px" }}
      >
        <span
          className="relative block h-full w-full text-left text-sm transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "none",
          }}
        >
          <span
            className="absolute inset-0 flex items-center justify-center overflow-auto"
            style={{ backfaceVisibility: "hidden" }}
          >
            {card.front}
          </span>
          <span
            className="absolute inset-0 flex items-center justify-center overflow-auto font-medium"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {card.back}
          </span>
        </span>
      </button>
      {scheduled ? (
        <p className="text-center text-xs text-zinc-500">
          Next review {fmtDate(scheduled)} ✓
        </p>
      ) : (
        <div className="flex justify-center gap-2">
          {(["again", "good", "easy"] as const).map((r) => (
            <button
              key={r}
              onClick={() => rate(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                r === "again"
                  ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400"
                  : r === "good"
                    ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                    : "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- question ----------

export function QuestionView({ question }: { question: Question }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    correctIndex: number;
    nextDate: string;
  } | null>(null);

  async function choose(i: number) {
    if (result) return;
    setPicked(i);
    const data = await postJSON("/api/items", {
      kind: "question",
      id: question.id,
      chosenIndex: i,
    });
    setResult({
      correct: data.correct ?? false,
      correctIndex: data.correctIndex ?? 0,
      nextDate: data.nextDate ?? "",
    });
  }

  const shown = result;
  return (
    <div className="space-y-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
      <p className="text-sm font-medium">{question.question}</p>
      <div className="space-y-2">
        {question.alternatives.map((alt, i) => {
          let cls = "border-black/10 dark:border-white/15 hover:border-black/30 dark:hover:border-white/40";
          if (shown) {
            if (i === shown.correctIndex) cls = "border-green-500 bg-green-500/10";
            else if (i === picked) cls = "border-red-500 bg-red-500/10";
            else cls = "border-black/5 dark:border-white/10 opacity-50";
          }
          return (
            <button
              key={i}
              disabled={!!shown}
              onClick={() => choose(i)}
              className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${cls}`}
            >
              {alt}
            </button>
          );
        })}
      </div>
      {shown && (
        <p
          className={`text-sm ${shown.correct ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {shown.correct
            ? `Correct — next review ${fmtDate(shown.nextDate)}`
            : `Wrong — correct answer highlighted. Next review ${fmtDate(shown.nextDate)}`}
        </p>
      )}
    </div>
  );
}

// ---------- delete ----------

export function DeleteTopicButton({ topicId }: { topicId: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        if (confirm("Delete this topic and all its cards/questions?")) {
          await fetch(`/api/topics?topicId=${topicId}`, { method: "DELETE" });
          router.push("/");
        }
      }}
      className="text-sm text-red-500 hover:underline"
    >
      Delete topic
    </button>
  );
}
