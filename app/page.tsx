import Link from "next/link";
import { connection } from "next/server";
import { CreateTopicForm } from "@/components/study";
import { hasAI } from "@/lib/ai";
import { isDue } from "@/lib/scheduling";
import { listTopics } from "@/lib/store";
import { SeedSampleButton } from "@/components/seed";

export default async function Home() {
  await connection(); // render per request: store lives on disk
  const topics = await listTopics();

  const subjects = new Map<string, typeof topics>();
  for (const t of [...topics].sort((a, b) => a.subject.localeCompare(b.subject))) {
    subjects.set(t.subject, [...(subjects.get(t.subject) ?? []), t]);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Study Engine</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          AI-generated topics: flashcards, questions and a roadmap, with spaced
          review dates.{" "}
          {hasAI() ? (
            <span className="text-green-600 dark:text-green-400">
              AI connected.
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">
              Sample mode — set DEEPSEEK_API_KEY in .env.local for real content.
            </span>
          )}
        </p>
      </header>

      <section className="mb-10 rounded-xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="mb-3 text-lg font-semibold">New topic</h2>
        <CreateTopicForm />
        <div className="mt-3">
          <SeedSampleButton />
        </div>
      </section>

      {topics.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No topics yet. Create one above, or load the sample topic.
        </p>
      ) : (
        <section className="space-y-6">
          {[...subjects.entries()].map(([subject, list]) => (
            <div key={subject}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {subject}
              </h2>
              <div className="space-y-3">
                {list.map((t) => {
                  const dueCards = t.flashcards.filter((c) => isDue(c.visualizationDate)).length;
                  const dueQuestions = t.questions.filter((q) => isDue(q.visualizationDate)).length;
                  const done = t.roadmap.filter((s) => s.done).length;
                  return (
                    <Link
                      key={t.id}
                      href={`/topics/${t.id}`}
                      className="block rounded-xl border border-black/10 p-4 transition-colors hover:border-black/30 dark:border-white/15 dark:hover:border-white/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{t.title}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                            {t.description}
                          </p>
                        </div>
                        {t.status === "completed" && (
                          <span className="shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                            completed
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span>{t.flashcards.length} cards · {t.questions.length} questions</span>
                        <span>
                          {t.status === "completed"
                            ? "roadmap finished — expandable"
                            : `roadmap ${done}/${t.roadmap.length}`}
                        </span>
                        {(dueCards > 0 || dueQuestions > 0) && (
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            🔔 {dueCards + dueQuestions} due today
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
