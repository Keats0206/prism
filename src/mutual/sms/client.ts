import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

export function getTwilioClient() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
    }
    client = twilio(accountSid, authToken);
  }
  return client;
}

export function getTwilioPhoneNumber(): string {
  const phone = process.env.TWILIO_PHONE_NUMBER;
  if (!phone) {
    throw new Error("Missing TWILIO_PHONE_NUMBER");
  }
  return phone;
}
