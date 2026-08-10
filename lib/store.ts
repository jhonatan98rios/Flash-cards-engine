import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DB, Topic } from "./types";

const DATA_FILE =
  process.env.DATA_FILE ?? path.join(process.cwd(), "data", "db.json");

// ponytail: single JSON file + in-process lock. Per-topic files only if
// write contention ever becomes a problem (it won't for personal use).
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

async function readDB(): Promise<DB> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as DB;
  } catch {
    return { topics: [] };
  }
}

async function writeDB(db: DB): Promise<void> {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2));
  await rename(tmp, DATA_FILE); // atomic: no torn reads
}

async function mutateDB<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  return withLock(async () => {
    const db = await readDB();
    const result = await fn(db);
    await writeDB(db);
    return result;
  });
}

export async function listTopics(): Promise<Topic[]> {
  return (await readDB()).topics;
}

export async function getTopic(id: string): Promise<Topic | undefined> {
  return (await readDB()).topics.find((t) => t.id === id);
}

export async function saveTopic(topic: Topic): Promise<void> {
  await mutateDB((db) => {
    const i = db.topics.findIndex((t) => t.id === topic.id);
    if (i === -1) db.topics.push(topic);
    else db.topics[i] = topic;
  });
}

export async function deleteTopic(id: string): Promise<void> {
  await mutateDB((db) => {
    db.topics = db.topics.filter((t) => t.id !== id);
  });
}

/** Find an item (card or question) across all topics and mutate it in place. */
export async function mutateItem(
  id: string,
  fn: (item: { visualizationDate: string; interval: number }, topic: Topic) => void
): Promise<void> {
  await mutateDB((db) => {
    for (const topic of db.topics) {
      const card = topic.flashcards.find((c) => c.id === id);
      if (card) {
        fn(card, topic);
        topic.updatedAt = new Date().toISOString();
        return;
      }
      const question = topic.questions.find((q) => q.id === id);
      if (question) {
        fn(question, topic);
        topic.updatedAt = new Date().toISOString();
        return;
      }
    }
  });
}
