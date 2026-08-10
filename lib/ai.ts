import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Topic } from "./types";

// Generation engine: DeepSeek via LangChain. Without DEEPSEEK_API_KEY it
// falls back to a deterministic sample generator so the app runs out of
// the box (e.g. on machines where nothing is configured yet).

export interface RawStep {
  title: string;
  detail?: string;
}
export interface RawCard {
  front: string;
  back: string;
}
export interface RawQuestion {
  question: string;
  alternatives: string[];
  answerIndex: number;
  isTrueFalse?: boolean;
}
export interface TopicContent {
  title: string;
  description: string;
  summary: string;
  roadmap: RawStep[];
  flashcards: RawCard[];
  questions: RawQuestion[];
}
export interface TopicPatch {
  roadmap: RawStep[];
  flashcards: RawCard[];
  questions: RawQuestion[];
}

export const hasAI = () => Boolean(process.env.DEEPSEEK_API_KEY);

function model() {
  return new ChatDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
    temperature: 0.7,
    maxTokens: 4096,
    timeout: 120_000,
  });
}

const SCHEMA = `Respond with ONLY a JSON object, no markdown, matching exactly:
{
  "title": "short title",
  "description": "one sentence",
  "summary": "paragraph that would let another AI continue this topic",
  "roadmap": [{"title": "step name", "detail": "optional hint"}],
  "flashcards": [{"front": "question/prompt", "back": "answer"}],
  "questions": [{"question": "...", "alternatives": ["...", "..."], "answerIndex": 0}]
}
Rules: 4-6 roadmap steps, 6-8 flashcards, 5-6 questions, 3-5 alternatives each.
For true/false questions use alternatives ["True", "False"] and the correct index.
answerIndex must point at the correct alternative.`;

async function chatJSON(system: string, user: string): Promise<unknown> {
  const response = await model().invoke([
    new SystemMessage(system),
    new HumanMessage(user),
  ]);
  const content = response.content;
  const text = typeof content === "string" ? content : JSON.stringify(content);
  return parseJSON(text);
}

/** Strip markdown fences if the model wrapped the JSON, then parse. */
function parseJSON(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned);
}

function assertTopicShape(v: unknown): TopicContent {
  const o = v as Partial<TopicContent>;
  if (
    typeof o.title !== "string" ||
    typeof o.description !== "string" ||
    typeof o.summary !== "string" ||
    !Array.isArray(o.roadmap) ||
    !Array.isArray(o.flashcards) ||
    !Array.isArray(o.questions)
  ) {
    throw new Error("AI response did not match the expected schema");
  }
  const roadmap = o.roadmap.map((s) => ({
    title: String(s.title),
    detail: s.detail ? String(s.detail) : undefined,
  }));
  const flashcards = o.flashcards.map((c) => ({
    front: String(c.front),
    back: String(c.back),
  }));
  const questions = o.questions.map((q) => {
    const alternatives = Array.isArray(q.alternatives)
      ? q.alternatives.map(String)
      : [];
    if (alternatives.length < 2) {
      throw new Error("AI generated a question with fewer than 2 alternatives");
    }
    const answerIndex = Number(q.answerIndex);
    if (!Number.isInteger(answerIndex) || answerIndex >= alternatives.length) {
      throw new Error("AI generated a question with an out-of-range answer");
    }
    return { question: String(q.question), alternatives, answerIndex };
  });
  return {
    title: o.title,
    description: o.description,
    summary: o.summary,
    roadmap,
    flashcards,
    questions,
  };
}

function assertPatchShape(v: unknown): TopicPatch {
  const o = v as Partial<TopicPatch>;
  if (
    !Array.isArray(o.roadmap) ||
    !Array.isArray(o.flashcards) ||
    !Array.isArray(o.questions)
  ) {
    throw new Error("AI response did not match the expected schema");
  }
  return {
    roadmap: o.roadmap.map((s) => ({
      title: String(s.title),
      detail: s.detail ? String(s.detail) : undefined,
    })),
    flashcards: o.flashcards.map((c) => ({
      front: String(c.front),
      back: String(c.back),
    })),
    questions: o.questions.map((q) => {
      const alternatives = Array.isArray(q.alternatives)
        ? q.alternatives.map(String)
        : [];
      const answerIndex = Number(q.answerIndex);
      return { question: String(q.question), alternatives, answerIndex };
    }),
  };
}

export async function generateTopicContent(
  subject: string,
  prompt: string
): Promise<TopicContent> {
  if (!hasAI()) return generateSampleContent(subject, prompt);
  const user = `Subject: ${subject}\nDataset / goal: ${prompt}`;
  return assertTopicShape(await chatJSON(SCHEMA, user));
}

export async function expandTopicContent(
  topic: Topic,
  instruction: string
): Promise<TopicPatch> {
  if (!hasAI()) return samplePatch(instruction);
  const system = `You extend an existing study topic with NEW material. Respond with ONLY a JSON object:
{
  "roadmap": [{"title": "...", "detail": "optional"}],
  "flashcards": [{"front": "...", "back": "..."}],
  "questions": [{"question": "...", "alternatives": ["..."], "answerIndex": 0}]
}
All fields optional (return empty arrays for what you don't add). Never repeat existing
content. Keep 3-5 new items per type at most.`;
  const user = `Existing topic: ${topic.title}
Summary: ${topic.summary}
Current roadmap: ${topic.roadmap.map((s) => s.title).join("; ") || "(none)"}
Expansion request: ${instruction}`;
  return assertPatchShape(await chatJSON(system, user));
}

// ---- sample mode (no DEEPSEEK_API_KEY) ----

function generateSampleContent(subject: string, prompt: string): TopicContent {
  const goal = prompt.trim() || "the dataset";
  return {
    title: `${subject}: ${goal.slice(0, 60)}`,
    description:
      "Sample content — set DEEPSEEK_API_KEY in .env.local to generate real study material.",
    summary: `Study topic for ${subject} built around "${goal}". This is sample mode:
the AI engine is not configured, so this content is generic. The roadmap covers
the standard study loop, flashcards and questions are placeholders that demonstrate
the format. Re-generate with a real API key for dataset-specific material.`,
    roadmap: [
      { title: "Review the dataset / source material" },
      { title: "Read the summary and identify key concepts" },
      { title: "Work through flashcards until all are 'good'" },
      { title: "Answer the questions, revisiting wrong answers" },
      { title: "Expand the topic with the summary to deepen coverage" },
    ],
    flashcards: [
      {
        front: `What is the core idea behind: ${goal}?`,
        back: "Write your own answer, then check it against the dataset. (Sample mode)",
      },
      {
        front: "Name one key concept or term from this topic.",
        back: "Add it to your notes; this card is a placeholder. (Sample mode)",
      },
      {
        front: "What would you review first to master this topic?",
        back: "The roadmap order: dataset → summary → cards → questions. (Sample mode)",
      },
    ],
    questions: [
      {
        question: `Is "${goal}" the topic you want to study?`,
        alternatives: ["Yes", "No"],
        answerIndex: 0,
      },
      {
        question: "True or False: flashcards and questions are scheduled with a visualization date.",
        alternatives: ["True", "False"],
        answerIndex: 0,
      },
    ],
  };
}

function samplePatch(instruction: string): TopicPatch {
  return {
    roadmap: [
      { title: `Deeper dive: ${instruction.slice(0, 60)}` },
    ],
    flashcards: [
      {
        front: `Follow-up question about: ${instruction.slice(0, 60)}`,
        back: "Answer from the dataset. (Sample mode — set DEEPSEEK_API_KEY for real patches)",
      },
    ],
    questions: [
      {
        question: "True or False: this expansion was generated in sample mode.",
        alternatives: ["True", "False"],
        answerIndex: 0,
      },
    ],
  };
}
