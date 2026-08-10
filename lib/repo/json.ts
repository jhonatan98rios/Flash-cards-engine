import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DB } from "../types";
import type { TopicRepo } from "./types";

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

/** Dev fallback so the app runs without a MongoDB server. */
export const jsonRepo: TopicRepo = {
  async listTopics() {
    return (await readDB()).topics;
  },
  async getTopic(id) {
    return (await readDB()).topics.find((t) => t.id === id) ?? null;
  },
  async saveTopic(topic) {
    await mutateDB((db) => {
      const i = db.topics.findIndex((t) => t.id === topic.id);
      if (i === -1) db.topics.push(topic);
      else db.topics[i] = topic;
    });
  },
  async deleteTopic(id) {
    await mutateDB((db) => {
      db.topics = db.topics.filter((t) => t.id !== id);
    });
  },
};
