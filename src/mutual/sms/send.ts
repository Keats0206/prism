import { getTwilioClient, getTwilioPhoneNumber } from "./client";

const START_CTA =
  "\n\nWant your own Mutual? Text START.";

export async function sendSms(
  to: string,
  body: string,
  options?: { includeStartCta?: boolean },
): Promise<string> {
  const client = getTwilioClient();
  const from = getTwilioPhoneNumber();
  const messageBody =
    options?.includeStartCta && !body.includes("Text START")
      ? `${body}${START_CTA}`
      : body;

  const message = await client.messages.create({
    to,
    from,
    body: messageBody,
  });

  return message.sid;
}

export function twimlEmptyResponse(): Response {
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { "Content-Type": "text/xml" } },
  );
}
