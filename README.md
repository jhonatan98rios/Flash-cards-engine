# Study Engine

AI-generated study topics: **flashcards + questions (multiple choice / true-false) + roadmap**, with spaced review dates.

- A **topic** is the umbrella: title, description, summary, roadmap steps, flashcards, questions.
- Feed it a **dataset** (notes, exam goal, pasted content) → the AI generates everything.
- Cards and questions carry a `visualizationDate` — created items appear *tomorrow*, then each review schedules the next one (Again → 1d, Good → ×2, Easy → ×4, cap 90d).
- **Finish the roadmap** (or not — you can expand anytime), then **Expand topic** sends the summary back to the AI for a deeper patch.

## Run

```bash
npm install
cp .env.local.example .env.local   # add your AI_API_KEY
npm run dev                        # http://localhost:3000
```

Note: on Termux/Android this project builds with `--webpack` (Turbopack has no native bindings there). Without `AI_API_KEY` the app runs in **sample mode** — deterministic content so you can try the full flow.

## API

Any OpenAI-compatible endpoint works (OpenAI, OpenRouter, Groq, Ollama…): set `AI_API_URL`, `AI_API_KEY`, `AI_MODEL` in `.env.local`.

## Layout

```
lib/types.ts        data model
lib/scheduling.ts   spaced-review math (visualizationDate)
lib/store.ts        JSON file store (data/db.json, gitignored)
lib/ai.ts           content generation (OpenAI-compatible + sample fallback)
lib/engine.ts       topic building / patch merging
app/api/            HTTP API (create/expand/rate/answer/toggle/delete)
app/page.tsx        dashboard (topics grouped by subject)
app/topics/[id]/    topic detail: summary, roadmap, study, expand
components/         client UI (flip cards, quiz, forms)
```

```bash
npm test   # node:test, no deps
```
