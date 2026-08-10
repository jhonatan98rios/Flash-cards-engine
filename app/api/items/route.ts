import { NextResponse } from "next/server";
import { newItemVisualizationDate, nextInterval } from "@/lib/scheduling";
import { listTopics, mutateItem, saveTopic } from "@/lib/store";
import type { Rating } from "@/lib/types";

// Study actions: rate a flashcard or answer a question. Updates the item's
// visualizationDate (spaced review) and returns feedback for the client.
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { kind, id } = body;

  if (kind === "card") {
    const rating = body.rating as Rating;
    if (!id || !["again", "good", "easy"].includes(rating)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await mutateItem(id, (card) => {
      card.interval = nextInterval(card.interval, rating);
      card.visualizationDate = newItemVisualizationDate();
    });
    return NextResponse.json({ ok: true, nextDate: newItemVisualizationDate() });
  }

  if (kind === "question") {
    const chosenIndex = Number(body.chosenIndex);
    const topics = await listTopics();
    const topic = topics.find((t) => t.questions.some((q) => q.id === id));
    const question = topic?.questions.find((q) => q.id === id);
    if (!topic || !question || !Number.isInteger(chosenIndex)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const correct = chosenIndex === question.answerIndex;
    question.interval = nextInterval(question.interval, correct ? "good" : "again");
    question.visualizationDate = newItemVisualizationDate();
    topic.updatedAt = new Date().toISOString();
    await saveTopic(topic);
    return NextResponse.json({
      ok: true,
      correct,
      correctIndex: question.answerIndex,
      nextDate: question.visualizationDate,
    });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
