import { NextResponse } from "next/server";
import { expandTopicContent } from "@/lib/ai";
import { applyPatch } from "@/lib/engine";
import { getTopic, saveTopic } from "@/lib/store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const topic = await getTopic(id);
  if (!topic) {
    return NextResponse.json({ ok: false, message: "Topic not found." }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const instruction = String(body.instruction ?? "").trim();
  if (!instruction) {
    return NextResponse.json(
      { ok: false, message: "Describe what to expand (e.g. 'deeper on transformers')." },
      { status: 400 }
    );
  }
  try {
    const patch = await expandTopicContent(topic, instruction);
    const [steps, cards, questions] = applyPatch(topic, patch);
    await saveTopic(topic);
    return NextResponse.json({
      ok: true,
      message: `Expanded: +${cards} cards, +${questions} questions, +${steps} roadmap steps.`,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: `Expansion failed: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}
