import { NextResponse } from "next/server";
import { getSessionUserId } from "@/mutual/auth/session";
import { getUserById, updateProfile } from "@/mutual/db/users";
import type { CreatorAnswers } from "@/mutual/types";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      name: user.name,
      bio: user.bio,
      username: user.username,
      avatarGradient: user.avatar_gradient,
      answers: user.answers,
      intents: user.intents ?? {},
      city: user.city,
      accessStatus: user.access_status,
      interviewCompleted: Boolean(user.interview_completed_at),
    },
  });
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    bio?: string;
    answers?: CreatorAnswers;
    avatarGradient?: string;
  };

  const user = await updateProfile(userId, {
    name: body.name,
    bio: body.bio,
    answers: body.answers,
    avatarGradient: body.avatarGradient,
  });

  return NextResponse.json({
    ok: true,
    profile: {
      name: user.name,
      bio: user.bio,
      username: user.username,
      avatarGradient: user.avatar_gradient,
      answers: user.answers,
      intents: user.intents ?? {},
      city: user.city,
    },
  });
}
