import { isEmailDevMode, recordDevEmail } from "./dev";

const FROM = process.env.MUTUAL_EMAIL_FROM ?? "Mutual <hi@mutual.app>";

// Send a transactional email via Resend. With no RESEND_API_KEY we record to a
// dev outbox instead, so notifications are observable locally without a provider.
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  if (isEmailDevMode()) {
    recordDevEmail(to, subject, body);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to,
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      console.error("Resend send failed:", res.status, await res.text());
    }
  } catch (error) {
    // Notifications are best-effort — never block the request path on email.
    console.error("Resend send error:", error);
  }
}
