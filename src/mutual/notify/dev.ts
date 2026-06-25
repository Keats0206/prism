export type DevEmail = {
  id: number;
  to: string;
  subject: string;
  body: string;
  at: string;
};

const outbox: DevEmail[] = [];
let seq = 0;

// Email is "sent" to an in-memory outbox when no provider is configured, so the
// full web flow (signup → invite → join → notify) works locally with no keys.
export function isEmailDevMode(): boolean {
  return !process.env.RESEND_API_KEY;
}

export function recordDevEmail(to: string, subject: string, body: string): void {
  console.info(`[mutual dev] EMAIL → ${to}: ${subject}`);
  outbox.push({ id: ++seq, to, subject, body, at: new Date().toISOString() });
}

export function getDevEmailOutbox(): DevEmail[] {
  return [...outbox];
}

export function clearDevEmailOutbox(): void {
  outbox.length = 0;
}
