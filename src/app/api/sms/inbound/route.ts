import { handleInboundSms } from "@/mutual/agent/handle-inbound";
import {
  getTwilioWebhookUrl,
  parseTwilioFormBody,
  validateTwilioSignature,
} from "@/mutual/sms/validate";
import { sendSms, twimlEmptyResponse } from "@/mutual/sms/send";
import type { InboundSms } from "@/mutual/types";

export async function POST(request: Request) {
  const formData = await request.formData();
  const params = parseTwilioFormBody(formData);

  const signature = request.headers.get("x-twilio-signature");
  const requestUrl = getTwilioWebhookUrl(request);

  if (!validateTwilioSignature(requestUrl, params, signature)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const inbound: InboundSms = {
    from: params.From ?? "",
    to: params.To ?? "",
    body: params.Body ?? "",
    messageSid: params.MessageSid ?? "",
  };

  if (!inbound.from || !inbound.body) {
    return twimlEmptyResponse();
  }

  try {
    const reply = await handleInboundSms(inbound);
    if (reply) {
      await sendSms(inbound.from, reply);
    }
  } catch (error) {
    console.error("SMS inbound handler error:", error);
    await sendSms(
      inbound.from,
      "Something went wrong on my end. Try again in a moment.",
    ).catch(() => {});
  }

  return twimlEmptyResponse();
}
