import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mutual",
  description: "Coordinate plans with friends by text.",
};

function formatPhoneNumber(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return e164;
}

export default function MutualPage() {
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  const displayNumber = phoneNumber ? formatPhoneNumber(phoneNumber) : null;
  const smsHref = phoneNumber
    ? `sms:${phoneNumber}?body=${encodeURIComponent("START")}`
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <article className="w-full max-w-lg text-center">
        <h1 className="text-2xl font-medium text-neutral-900">Mutual</h1>

        <p className="mt-6 text-base leading-7 text-neutral-600">
          Mutual helps you make plans with friends over SMS. You say who you
          want to see and what you want to do. Mutual drafts a text to send
          them. You approve it before anything goes out.
        </p>

        <div className="mt-10">
          {displayNumber && smsHref ? (
            <a
              href={smsHref}
              className="text-2xl text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
            >
              {displayNumber}
            </a>
          ) : (
            <p className="text-neutral-400">Phone number not configured</p>
          )}
          <p className="mt-2 text-sm text-neutral-500">
            Text START to sign up
          </p>
        </div>
      </article>
    </main>
  );
}
