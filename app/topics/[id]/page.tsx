import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DeleteTopicButton,
  ExpandForm,
  FlashcardView,
  QuestionView,
  StepToggle,
} from "@/components/study";
import { isDue, todayISO } from "@/lib/scheduling";
import { getTopic } from "@/lib/store";

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await getTopic(id);
  if (!topic) notFound();

  const today = todayISO();
  const dueCards = topic.flashcards.filter((c) => isDue(c.visualizationDate, today));
  const dueQuestions = topic.questions.filter((q) => isDue(q.visualizationDate, today));
  const allCards = [...topic.flashcards].sort((a, b) =>
    a.visualizationDate.localeCompare(b.visualizationDate)
  );
  const allQuestions = [...topic.questions].sort((a, b) =>
    a.visualizationDate.localeCompare(b.visualizationDate)
  );
  const roadmap = [...topic.roadmap].sort((a, b) => a.order - b.order);
  const doneSteps = roadmap.filter((s) => s.done).length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← All topics
      </Link>

      <header className="mt-3 mb-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{topic.title}</h1>
          {topic.status === "completed" && (
            <span className="shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
              roadmap completed
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500">{topic.subject}</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{topic.description}</p>
      </header>

      {/* Summary */}
      <section className="mb-6 rounded-xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="mb-2 font-semibold">Summary</h2>
        <p className="text-sm leading-relaxed whitespace-pre-line">{topic.summary}</p>
      </section>

      {/* Roadmap */}
      <section className="mb-6 rounded-xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="mb-1 font-semibold">
          Roadmap{" "}
          <span className="text-sm font-normal text-zinc-500">
            {doneSteps}/{roadmap.length}
          </span>
        </h2>
        {roadmap.length === 0 ? (
          <p className="text-sm text-zinc-500">No roadmap steps yet.</p>
        ) : (
          <ol className="mt-2 space-y-2">
            {roadmap.map((step) => (
              <li key={step.id} className="flex items-start gap-2">
                <StepToggle topicId={topic.id} stepId={step.id} done={step.done} />
                <div className={step.done ? "text-zinc-400 line-through" : ""}>
                  <p className="text-sm">{step.title}</p>
                  {step.detail && (
                    <p className="text-xs text-zinc-500">{step.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Study: all material, with due-today badges; the visualizationDate
          still marks what's ready for review. */}
      <section className="mb-6 rounded-xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="mb-3 font-semibold">
          Study{" "}
          <span className="text-sm font-normal text-zinc-500">
            {dueCards.length + dueQuestions.length} due today ·{" "}
            {allCards.length + allQuestions.length} items
          </span>
        </h2>
        {allCards.length === 0 && allQuestions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No cards or questions yet — expand this topic to grow it.
          </p>
        ) : (
          <div className="space-y-6">
            {allCards.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-500">
                  Flashcards ({allCards.length}) — tap to flip
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {allCards.map((card) => (
                    <div key={card.id}>
                      {isDue(card.visualizationDate, today) && (
                        <p className="mb-1 text-right text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          due today
                        </p>
                      )}
                      <FlashcardView card={card} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {allQuestions.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-500">
                  Questions ({allQuestions.length})
                </h3>
                <div className="space-y-4">
                  {allQuestions.map((q) => (
                    <div key={q.id}>
                      {isDue(q.visualizationDate, today) && (
                        <p className="mb-1 text-right text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          due today
                        </p>
                      )}
                      <QuestionView question={q} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Expand */}
      <section className="mb-6 rounded-xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="mb-1 font-semibold">Expand topic</h2>
        <p className="mb-3 text-sm text-zinc-500">
          {topic.status === "completed"
            ? "Roadmap finished — send the summary back to the AI to go deeper."
            : "Finish the roadmap first, or expand anytime to add more material."}
        </p>
        <ExpandForm topicId={topic.id} />
      </section>

      <footer>
        <DeleteTopicButton topicId={topic.id} />
      </footer>
    </main>
  );
}
