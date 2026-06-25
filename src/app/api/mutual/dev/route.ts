import { handleInboundSms } from "@/mutual/agent/handle-inbound";
import {
  isMutualDevMode,
  getDevOutbox,
  clearDevOutbox,
} from "@/mutual/sms/dev";
import {
  getDevEmailOutbox,
  clearDevEmailOutbox,
} from "@/mutual/notify/dev";
import type { InboundSms } from "@/mutual/types";

// Dev-only HTTP transport for the Mutual agent. Mirrors the Twilio webhook
// (`/api/sms/inbound`) but skips signature validation and Twilio entirely, so
// the native test app can drive the *real* agent over plain JSON.
//
// Enabled when `isMutualDevMode()` is true (NODE_ENV=development, or
// MUTUAL_DEV_MODE=true on a deployed instance). Otherwise returns 404.

const DEV_TO = process.env.TWILIO_PHONE_NUMBER ?? "+10000000000";

function guard(): Response | null {
  if (!isMutualDevMode()) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

// Send a message to Mutual as any phone number, then return Mutual's direct
// reply plus the full dev outbox (every text Mutual "sent" to anyone).
export async function POST(request: Request) {
  const blocked = guard();
  if (blocked) return blocked;

  const { from, body } = (await request.json()) as {
    from?: string;
    body?: string;
  };

  if (!from?.trim() || !body?.trim()) {
    return Response.json(
      { error: "from and body are required" },
      { status: 400 },
    );
  }

  const inbound: InboundSms = {
    from: from.trim(),
    to: DEV_TO,
    body: body.trim(),
    messageSid: `DEVIN${Date.now()}`,
  };

  try {
    const reply = await handleInboundSms(inbound);
    return Response.json({
      reply,
      outbox: getDevOutbox(),
      emails: getDevEmailOutbox(),
    });
  } catch (error) {
    console.error("Mutual dev handler error:", error);
    const message =
      error instanceof Error ? error.message : "Agent failed unexpectedly.";
    return Response.json({ error: message }, { status: 500 });
  }
}

// Poll every text + email Mutual has sent (to the owner and to contacts).
export async function GET() {
  const blocked = guard();
  if (blocked) return blocked;
  return Response.json({ outbox: getDevOutbox(), emails: getDevEmailOutbox() });
}

// Clear the in-memory outboxes (does not touch the database).
export async function DELETE() {
  const blocked = guard();
  if (blocked) return blocked;
  clearDevOutbox();
  clearDevEmailOutbox();
  return Response.json({ ok: true });
}
