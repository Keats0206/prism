"use client";

import { useEffect, useState } from "react";
import { DEFAULT_GRADIENT } from "@/app/mutual/lib/gradients";
import {
  formatPhone,
  generateInviteCode,
  isValidEmail,
  isValidUsername,
} from "@/app/mutual/lib/utils";
import { LiveChat } from "./LiveChat";
import { MutualIntro } from "./MutualIntro";
import {
  AvatarPicker,
  ChatContactForm,
  ChatProvider,
  ChatShell,
  ChatTextForm,
  CodeInput,
  SharePanel,
  useChat,
} from "./chat-ui";

// Account creation only — phone OTP, username, avatar, then a share step so the
// new user can pull friends in. Everything about WHAT the user wants (dating,
// work, friendship, activities) is now learned by the agent in chat via
// capture_preference, so there's no preference questionnaire here.
type FormStep = "contact" | "code" | "username" | "avatar" | "share";

const CREATOR_INTRO =
  "Hey — I'm Mutual. I help you and your friends turn ideas into plans, and I'll introduce you to people worth meeting.\n\nDrop your phone and email to get started.";

function inferFormStepFromMessages(
  messages: { role: string; text: string }[],
): FormStep | null {
  const transcript = messages.map((m) => m.text).join("\n");
  if (transcript.includes("Pull in a few friends")) return "share";
  if (transcript.includes("Pick a color for your avatar")) return "avatar";
  if (transcript.includes("Pick a username")) return "username";
  if (/Sent a 6-digit code to/.test(transcript)) return "code";
  if (transcript.includes("Drop your phone and email")) return "contact";
  return null;
}

function CreatorFlowInner({ onDone }: { onDone: () => void }) {
  const {
    messages,
    typing,
    addUserMessage,
    addMutualMessage,
    addStreamingMutualMessage,
  } = useChat();

  const [formStep, setFormStep] = useState<FormStep | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [gradient, setGradient] = useState(DEFAULT_GRADIENT);
  const [session, setSession] = useState({
    phone: "",
    email: "",
    username: "",
  });
  const [inviteCode, setInviteCode] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  // Greet once per thread. Dev HMR can remount this component while ChatProvider
  // state survives — without the transcript check we'd stack duplicate intros.
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const alreadyGreeted = messages.some(
      (m) => m.role === "mutual" && m.text.includes("I'm Mutual"),
    );
    if (alreadyGreeted) {
      setFormStep((step) => step ?? inferFormStepFromMessages(messages));
      return;
    }

    void (async () => {
      await addStreamingMutualMessage(CREATOR_INTRO, {
        pauseMs: 900,
        chunkDelayMs: 12,
        signal,
      });
      if (!signal.aborted) setFormStep("contact");
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- greet once; remount recovery uses transcript check above
  }, []);

  async function persistCreator(code: string, username: string) {
    await fetch("/api/mutual/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "creator",
        inviteCode: code,
        phone: session.phone,
        email: session.email,
        username,
        avatarGradient: gradient,
        answers: {},
      }),
    });
  }

  // After the account exists, mint an invite + show the share step. Preferences
  // are intentionally not collected here — the agent does that in chat.
  async function finishSetup(username: string) {
    const code = generateInviteCode();
    const url = `${window.location.origin}/mutual?join=${code}`;
    setInviteCode(code);
    setInviteUrl(url);
    await persistCreator(code, username);
    setFormStep(null);
    await addMutualMessage(
      "You're all set. Pull in a few friends — link or code below. The more friends on Mutual, the better the people I can introduce you to.",
    );
    setFormStep("share");
  }

  async function handleContactSubmit() {
    if (typing) return;
    setContactError(null);

    const digits = phoneInput.replace(/\D/g, "");
    const email = emailInput.trim().toLowerCase();

    if (digits.length < 10) {
      setContactError("Enter a valid 10-digit phone number.");
      return;
    }
    if (!isValidEmail(email)) {
      setContactError("Enter a valid email address.");
      return;
    }

    const formatted = formatPhone(digits);
    addUserMessage(`${formatted} · ${email}`);
    setSession((s) => ({ ...s, phone: formatted, email }));
    setPhoneInput("");
    setEmailInput("");
    setFormStep(null);

    try {
      const res = await fetch("/api/mutual/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", phone: formatted }),
      });
      if (!res.ok) throw new Error("send failed");
    } catch {
      await addMutualMessage(
        "I couldn't send a code to that number. Double-check it and try again.",
      );
      setFormStep("contact");
      return;
    }

    await addMutualMessage(`Sent a 6-digit code to ${formatted}.`);
    setFormStep("code");
  }

  async function handleUsername() {
    const value = usernameInput.trim();
    if (!value || typing) return;
    setFieldError(null);

    const username = value.toLowerCase();
    if (!isValidUsername(username)) {
      setFieldError("3–20 chars, lowercase letters, numbers, or _");
      return;
    }
    addUserMessage(`@${username}`);
    setSession((s) => ({ ...s, username }));
    setUsernameInput("");
    setFormStep(null);
    await addMutualMessage("Pick a color for your avatar.");
    setFormStep("avatar");
  }

  async function handleCode(code: string) {
    setCodeError(null);
    let ok = false;
    try {
      const res = await fetch("/api/mutual/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", phone: session.phone, code }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }

    if (!ok) {
      setCodeError("That code didn't work. Try again.");
      return;
    }

    addUserMessage(code);
    setFormStep(null);
    await addMutualMessage(
      "You're in. Pick a username — lowercase letters, numbers, underscores.",
    );
    setFormStep("username");
  }

  async function handleAvatarContinue() {
    addUserMessage("Looks good");
    setFormStep(null);
    await finishSetup(session.username);
  }

  const inline = (
    <>
      {formStep === "contact" ? (
        <ChatContactForm
          phone={phoneInput}
          email={emailInput}
          onPhoneChange={setPhoneInput}
          onEmailChange={setEmailInput}
          onSubmit={() => void handleContactSubmit()}
          error={contactError}
        />
      ) : null}
      {formStep === "code" ? (
        <CodeInput
          key={codeError ?? "code"}
          onComplete={(c) => void handleCode(c)}
          error={codeError}
        />
      ) : null}
      {formStep === "username" ? (
        <ChatTextForm
          formKey="username"
          label="Username"
          placeholder="your_name"
          prefix="@"
          value={usernameInput}
          onChange={(v) => {
            setUsernameInput(v);
            setFieldError(null);
          }}
          onSubmit={() => void handleUsername()}
          error={fieldError}
          hint="Lowercase letters, numbers, underscores"
          required
        />
      ) : null}
      {formStep === "avatar" ? (
        <AvatarPicker
          selected={gradient}
          onSelect={setGradient}
          onContinue={() => void handleAvatarContinue()}
        />
      ) : null}
      {formStep === "share" && inviteCode ? (
        <>
          <SharePanel
            username={session.username}
            email={session.email}
            avatarGradient={gradient}
            inviteCode={inviteCode}
            inviteUrl={inviteUrl}
          />
          <div className="w-full border-b border-white/[0.07] px-4 py-4">
            <button
              type="button"
              onClick={onDone}
              className="w-full rounded-xl bg-[#1aad77] py-2.5 text-[15px] font-medium text-white transition hover:bg-[#159a6a]"
            >
              Open my Mutual →
            </button>
          </div>
        </>
      ) : null}
    </>
  );

  return <ChatShell inline={inline} />;
}

export function CreatorOnboarding() {
  const [started, setStarted] = useState(false);
  const [live, setLive] = useState(false);

  if (!started) {
    return <MutualIntro onStart={() => setStarted(true)} />;
  }

  if (live) {
    // The agent picks up here: a brand-new profile triggers the conversational
    // interview (see buildSystemPrompt's onboarding section) via capture_preference.
    return (
      <LiveChat greeting="You're in 🎉 So I can find the right people and plans for you — what are you hoping Mutual helps with? Dating, meeting people for work, or doing more with friends?" />
    );
  }

  return (
    <ChatProvider>
      <CreatorFlowInner onDone={() => setLive(true)} />
    </ChatProvider>
  );
}
