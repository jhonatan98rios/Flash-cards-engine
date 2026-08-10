import { generateTopicContent, hasAI } from "./ai";
import type { TopicPatch } from "./ai";
import { newItemVisualizationDate } from "./scheduling";
import type { Topic } from "./types";

export function uid(): string {
  return crypto.randomUUID();
}

export async function buildTopic(
  subject: string,
  prompt: string
): Promise<{ topic: Topic; sample: boolean }> {
  const sample = !hasAI();
  const content = await generateTopicContent(subject, prompt);
  const now = new Date().toISOString();
  const viz = newItemVisualizationDate();
  const topic: Topic = {
    id: uid(),
    subject,
    title: content.title,
    description: content.description,
    summary: content.summary,
    status: "active",
    createdAt: now,
    updatedAt: now,
    roadmap: content.roadmap.map((s, i) => ({
      id: uid(),
      order: i,
      title: s.title,
      detail: s.detail,
      done: false,
    })),
    flashcards: content.flashcards.map((c) => ({
      id: uid(),
      front: c.front,
      back: c.back,
      visualizationDate: viz,
      interval: 0,
      createdAt: now,
    })),
    questions: content.questions.map((q) => ({
      id: uid(),
      question: q.question,
      alternatives: q.alternatives,
      answerIndex: q.answerIndex,
      visualizationDate: viz,
      interval: 0,
      createdAt: now,
    })),
  };
  return { topic, sample };
}

/** Append AI patch content (new roadmap steps / cards / questions) to a topic. */
export function applyPatch(topic: Topic, patch: TopicPatch): number[] {
  const now = new Date().toISOString();
  const viz = newItemVisualizationDate();
  const order = Math.max(...topic.roadmap.map((s) => s.order), -1) + 1;
  topic.roadmap.push(
    ...patch.roadmap.map((s, i) => ({
      id: uid(),
      order: order + i,
      title: s.title,
      detail: s.detail,
      done: false,
    }))
  );
  topic.flashcards.push(
    ...patch.flashcards.map((c) => ({
      id: uid(),
      front: c.front,
      back: c.back,
      visualizationDate: viz,
      interval: 0,
      createdAt: now,
    }))
  );
  topic.questions.push(
    ...patch.questions.map((q) => ({
      id: uid(),
      question: q.question,
      alternatives: q.alternatives,
      answerIndex: q.answerIndex,
      visualizationDate: viz,
      interval: 0,
      createdAt: now,
    }))
  );
  topic.updatedAt = now;
  return [patch.roadmap.length, patch.flashcards.length, patch.questions.length];
}
