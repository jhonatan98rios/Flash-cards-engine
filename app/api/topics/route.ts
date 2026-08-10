import { NextResponse } from "next/server";
import { buildTopic } from "@/lib/engine";
import { deleteTopic, saveTopic } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const subject = String(body.subject ?? "").trim();
  const prompt = String(body.prompt ?? "").trim();
  if (!subject || !prompt) {
    return NextResponse.json(
      { ok: false, message: "Subject and dataset prompt are required." },
      { status: 400 }
    );
  }
  try {
    const { topic, sample } = await buildTopic(subject, prompt);
    await saveTopic(topic);
    return NextResponse.json({
      ok: true,
      topicId: topic.id,
      message: sample
        ? `Sample topic created (${topic.flashcards.length} cards, ${topic.questions.length} questions). Add AI_API_KEY for real content.`
        : `Topic "${topic.title}" created (${topic.flashcards.length} cards, ${topic.questions.length} questions).`,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `Generation failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const topicId = new URL(req.url).searchParams.get("topicId");
  if (!topicId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await deleteTopic(topicId);
  return NextResponse.json({ ok: true });
}
