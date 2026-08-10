import { repo } from "./repo";
import type { Topic } from "./types";

// Facade over the current backend so callers stay backend-agnostic.
export const listTopics = (): Promise<Topic[]> => repo.listTopics();
export const getTopic = (id: string): Promise<Topic | null> => repo.getTopic(id);
export const saveTopic = (topic: Topic): Promise<void> => repo.saveTopic(topic);
export const deleteTopic = (id: string): Promise<void> => repo.deleteTopic(id);

/** Find an item (card or question) across all topics and mutate it in place. */
export async function mutateItem(
  id: string,
  fn: (item: { visualizationDate: string; interval: number }, topic: Topic) => void
): Promise<void> {
  for (const topic of await repo.listTopics()) {
    const card = topic.flashcards.find((c) => c.id === id);
    if (card) {
      fn(card, topic);
      topic.updatedAt = new Date().toISOString();
      await repo.saveTopic(topic);
      return;
    }
    const question = topic.questions.find((q) => q.id === id);
    if (question) {
      fn(question, topic);
      topic.updatedAt = new Date().toISOString();
      await repo.saveTopic(topic);
      return;
    }
  }
}
