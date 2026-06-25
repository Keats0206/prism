export type DevOutboxMessage = {
  id: number;
  sid: string;
  to: string;
  body: string;
  at: string;
};

const outbox: DevOutboxMessage[] = [];
let seq = 0;

export function isMutualDevMode(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.MUTUAL_DEV_MODE === "true"
  );
}

export function clearDevOutbox(): void {
  outbox.length = 0;
}

export function recordDevOutbox(to: string, body: string): string {
  const sid = `DEV${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  outbox.push({ id: ++seq, sid, to, body, at: new Date().toISOString() });
  return sid;
}

export function getDevOutbox(): DevOutboxMessage[] {
  return [...outbox];
}
