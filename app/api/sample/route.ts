import { NextResponse } from "next/server";
import { buildTopic } from "@/lib/engine";
import { saveTopic } from "@/lib/store";

const SAMPLE_PROMPT =
  "AWS Certified AI Practitioner (AIF-C01): fundamentals of machine learning, " +
  "generative AI, LLMs, prompt engineering, responsible AI, and core AWS AI services.";

export async function POST() {
  const { topic } = await buildTopic("AI Practitioner", SAMPLE_PROMPT);
  await saveTopic(topic);
  return NextResponse.json({
    ok: true,
    topicId: topic.id,
    message: `Sample topic "${topic.title}" loaded.`,
  });
}
