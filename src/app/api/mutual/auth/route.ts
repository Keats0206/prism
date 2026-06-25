import { NextResponse } from "next/server";
import {
  startPhoneVerification,
  checkPhoneVerification,
} from "@/mutual/sms/verify";
import { upsertUser } from "@/mutual/db/users";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/mutual/auth/session";

type StartBody = { action: "start"; phone: string };
type CheckBody = { action: "check"; phone: string; code: string };

// Minimal per-phone throttle so OTP sends can't be spammed (each costs money).
// In-memory is best-effort; Fluid Compute reuse covers the common case.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_SENDS = 5;
const sendLog = new Map<string, number[]>();

function rateLimited(phone: string): boolean {
  const now = Date.now();
  const recent = (sendLog.get(phone) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_SENDS) {
    sendLog.set(phone, recent);
    return true;
  }
  recent.push(now);
  sendLog.set(phone, recent);
  return false;
}

export async function POST(request: Request) {
  const body = (await request.json()) as StartBody | CheckBody;

  if (!body.phone?.trim()) {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }

  if (body.action === "start") {
    if (rateLimited(body.phone.trim())) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in a few minutes." },
        { status: 429 },
      );
    }
    try {
      await startPhoneVerification(body.phone);
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("OTP start error:", error);
      return NextResponse.json(
        { error: "Could not send a code. Try again." },
        { status: 500 },
      );
    }
  }

  if (body.action === "check") {
    if (!body.code?.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const approved = await checkPhoneVerification(body.phone, body.code);
    if (!approved) {
      return NextResponse.json({ error: "That code didn't work." }, { status: 401 });
    }

    // Verified — ensure a user row exists and issue a session.
    const user = await upsertUser(body.phone);
    const res = NextResponse.json({ ok: true, userId: user.id });
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// Log out: clear the session cookie. The OTP flow re-establishes identity, so
// there's no server-side session to revoke — expiring the cookie is enough.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
