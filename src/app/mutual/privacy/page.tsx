import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mutual — Privacy",
  description: "Privacy policy for Mutual.",
};

export default function MutualPrivacyPage() {
  return (
    <main className="overflow-y-auto px-6 py-16 text-[#999999]">
      <Link
        href="/mutual"
        className="text-sm text-[#666666] hover:text-[#1aad77]"
      >
        ← Back to Mutual
      </Link>

      <h1 className="mutual-heading mt-6 text-2xl text-[#e8e8e8]">Privacy</h1>

      <div className="mt-6 space-y-4 text-sm leading-7">
        <p>
          Mutual is a web chat service that helps you coordinate plans with
          friends. We verify your phone number by one-time code and use email to
          notify you about activity (like a friend joining or replying).
        </p>

        <p>
          We collect your phone number, email, and the content of messages you
          send and receive through Mutual. We use this to operate the service —
          for example, to draft and deliver coordination messages you approve.
        </p>

        <p>
          We do not sell your personal information or message content. We share
          message content with a friend only when you explicitly approve sending
          it.
        </p>

        <p>
          We send transactional messages only (verification codes and activity
          notifications). You can stop email notifications from your account or
          by contacting us.
        </p>

        <p>
          To delete your data or ask questions, contact the operator of this
          service.
        </p>
      </div>
    </main>
  );
}
