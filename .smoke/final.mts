// Final E2E on the production build
const BASE = "http://localhost:3111";
const assert = (c: unknown, m: string) => {
  if (!c) throw new Error(`ASSERT FAILED: ${m}`);
  console.log("✓", m);
};
const j = (r: Response) => r.json().catch(() => ({}));

const sample = await j(await fetch(`${BASE}/api/sample`, { method: "POST" }));
assert(sample.ok && sample.topicId, "create");
const id = sample.topicId;

const page = await (await fetch(`${BASE}/topics/${id}`)).text();
assert(page.includes("Summary") && page.includes("Roadmap"), "topic page renders");

const db = JSON.parse(await (await import("node:fs/promises")).readFile("data/db.json", "utf8"));
const t = db.topics.find((x: any) => x.id === id);

const r = await j(await fetch(`${BASE}/api/items`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ kind: "card", id: t.flashcards[0].id, rating: "good" }),
}));
assert(r.ok, "rate card");

const a = await j(await fetch(`${BASE}/api/items`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ kind: "question", id: t.questions[0].id, chosenIndex: t.questions[0].answerIndex }),
}));
assert(a.correct === true, "answer question");

const home = await (await fetch(`${BASE}/`)).text();
assert(home.includes(t.title.slice(0, 20)), "dashboard lists topic");

await fetch(`${BASE}/api/topics?topicId=${id}`, { method: "DELETE" });
console.log("\nFINAL E2E PASSED");
