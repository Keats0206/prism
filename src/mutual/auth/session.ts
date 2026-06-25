import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Minimal signed-cookie session. The phone OTP flow (Twilio Verify) is the
// real identity check; this just carries the resulting userId in a tamper-proof
// httpOnly cookie. Avoids a heavyweight auth dependency for a single claim.

const COOKIE = "mutual_session";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function secret(): string {
  return process.env.AUTH_SECRET ?? "mutual-dev-secret-change-me";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  return b64url(createHmac("sha256", secret()).update(payload).digest());
}

export function createSessionToken(userId: string): string {
  const payload = b64url(JSON.stringify({ userId, iat: Date.now() }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;

  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
    ) as { userId?: string };
    return json.userId ?? null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE;
export const SESSION_MAX_AGE = MAX_AGE;

// Read the current user id from the request cookies (server-side).
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE)?.value);
}
