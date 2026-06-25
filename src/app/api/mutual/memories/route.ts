import { NextResponse } from "next/server";
import { getSessionUserId } from "@/mutual/auth/session";
import { getMemoriesForUser, deleteMemory } from "@/mutual/db/memories";

// What Mutual remembers about you — for the settings transparency/delete UI.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const memories = await getMemoriesForUser(userId, 100);
  return NextResponse.json({
    memories: memories.map((m) => ({
      id: m.id,
      content: m.content,
      visibility: m.visibility,
      subjectUserId: m.subject_user_id,
      createdAt: m.created_at,
    })),
  });
}

export async function DELETE(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await deleteMemory(id, userId);
  return NextResponse.json({ ok: true });
}
