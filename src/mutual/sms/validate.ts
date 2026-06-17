import { validateRequest } from "twilio";

/** Public URL Twilio signed — must match the webhook URL in Twilio console. */
export function getTwilioWebhookUrl(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;
  return `${proto}://${host}${url.pathname}${url.search}`;
}

export function validateTwilioSignature(
  requestUrl: string,
  params: Record<string, string>,
  signature: string | null,
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    throw new Error("Missing TWILIO_AUTH_TOKEN");
  }

  // Allow skipping validation in local dev when explicitly configured.
  if (process.env.TWILIO_SKIP_SIGNATURE_VALIDATION === "true") {
    return true;
  }

  if (!signature) {
    return false;
  }

  return validateRequest(authToken, signature, requestUrl, params);
}

export function parseTwilioFormBody(
  formData: FormData,
): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}
