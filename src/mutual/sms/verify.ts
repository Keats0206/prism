import { getTwilioClient } from "./client";
import { isMutualDevMode } from "./dev";
import { normalizePhone } from "@/mutual/db/client";

const DEV_CODE = "000000";

function verifyServiceSid(): string {
  const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid) throw new Error("Missing TWILIO_VERIFY_SERVICE_SID");
  return sid;
}

// Send a one-time code via SMS. In dev mode this is a no-op — any phone
// "receives" the code 000000 — so the flow works with no Twilio account.
export async function startPhoneVerification(phone: string): Promise<void> {
  const to = normalizePhone(phone);
  if (isMutualDevMode()) {
    console.info(`[mutual dev] VERIFY → ${to}: use code ${DEV_CODE}`);
    return;
  }
  await getTwilioClient()
    .verify.v2.services(verifyServiceSid())
    .verifications.create({ to, channel: "sms" });
}

export async function checkPhoneVerification(
  phone: string,
  code: string,
): Promise<boolean> {
  const to = normalizePhone(phone);
  if (isMutualDevMode()) {
    return code === DEV_CODE;
  }
  const check = await getTwilioClient()
    .verify.v2.services(verifyServiceSid())
    .verificationChecks.create({ to, code });
  return check.status === "approved";
}
