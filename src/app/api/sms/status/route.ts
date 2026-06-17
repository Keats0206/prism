import { twimlEmptyResponse } from "@/mutual/sms/send";
import {
  getTwilioWebhookUrl,
  parseTwilioFormBody,
  validateTwilioSignature,
} from "@/mutual/sms/validate";

export async function POST(request: Request) {
  const formData = await request.formData();
  const params = parseTwilioFormBody(formData);

  const signature = request.headers.get("x-twilio-signature");
  if (!validateTwilioSignature(getTwilioWebhookUrl(request), params, signature)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const status = params.MessageStatus;
  const sid = params.MessageSid;
  if (status && sid) {
    console.info(`SMS status ${sid}: ${status}`);
  }

  return twimlEmptyResponse();
}
