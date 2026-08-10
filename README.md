# Study Engine

AI-generated study topics: **flashcards + questions (multiple choice / true-false) + roadmap**, with spaced review dates.

- A **topic** is the umbrella: title, description, summary, roadmap steps, flashcards, questions.
- Feed it a **dataset** (notes, exam goal, pasted content) → the AI generates everything.
- Cards and questions carry a `visualizationDate` — created items are due today; each review schedules the next one (Again → 1d, Good → ×2, Easy → ×4, cap 90d).
- **Finish the roadmap** (or not — you can expand anytime), then **Expand topic** sends the summary back to the AI for a deeper patch.

## Stack

- **AI**: DeepSeek via LangChain (`@langchain/deepseek`). Without `DEEPSEEK_API_KEY` the app runs in **sample mode** (deterministic content so you can try the full flow).
- **Data**: MongoDB (`mongodb` driver), one embedded document per topic. No `MONGODB_URI` → falls back to `data/db.json` for local dev.
- Single user, no auth — the repo interface (`lib/repo/types.ts`) is the seam where owner scoping lands later.

## Run

```bash
npm install
cp .env.local.example .env.local   # add DEEPSEEK_API_KEY and/or MONGODB_URI
npm run dev                        # http://localhost:3000
```

Note: on Termux/Android this project builds with `--webpack` (Turbopack has no native bindings there).

## Layout

```
lib/types.ts        data model
lib/scheduling.ts   spaced-review math (visualizationDate)
lib/repo/           data layer: TopicRepo interface + mongo.ts + json.ts fallback
lib/store.ts        facade over the current repo backend
lib/ai.ts           DeepSeek + LangChain generation (sample fallback without a key)
lib/engine.ts       topic building / patch merging
app/api/            HTTP API (create/expand/rate/answer/toggle/delete)
app/page.tsx        dashboard (topics grouped by subject)
app/topics/[id]/    topic detail: summary, roadmap, study, expand
components/         client UI (flip cards, quiz, forms)
```

```bash
npm test   # node:test, no deps
```
