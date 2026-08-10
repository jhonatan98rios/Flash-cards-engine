import { NextResponse } from "next/server";
import { getTopic, saveTopic } from "@/lib/store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const topic = await getTopic(id);
  if (!topic) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const step = topic.roadmap.find((s) => s.id === body.stepId);
  if (!step) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  step.done = !step.done;
  topic.updatedAt = new Date().toISOString();
  topic.status = topic.roadmap.every((s) => s.done) ? "completed" : "active";
  await saveTopic(topic);
  return NextResponse.json({ ok: true, done: step.done });
}
