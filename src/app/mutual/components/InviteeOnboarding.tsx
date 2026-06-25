"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_GRADIENT } from "@/app/mutual/lib/gradients";
import { formatPhone, isValidEmail, isValidUsername } from "@/app/mutual/lib/utils";
import {
  AvatarPicker,
  ChatChipForm,
  ChatComposer,
  ChatContactForm,
  ChatProvider,
  ChatShell,
  ChatTextForm,
  CodeInput,
  useChat,
} from "./chat-ui";
import { LiveChat } from "./LiveChat";
import { TOGETHER_IDEA_CHIPS, formatChipSelection } from "@/app/mutual/lib/onboarding-options";

type InviteeCreator = {
  userId: string;
  username: string | null;
  avatarGradient: string | null;
  answers: { socialGoal?: string; wishSeenMore?: string; wantToDo?: string };
};

type FormStep = "contact" | "code" | "name" | "username" | "avatar" | "together";

function InviteeFlowInner({
  joinCode,
  creator,
  onDone,
}: {
  joinCode: string;
  creator: InviteeCreator;
  onDone: () => void;
}) {
  const { typing, addUserMessage, addMutualMessage } = useChat();

  const [formStep, setFormStep] = useState<FormStep | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [composer, setComposer] = useState("");
  const [togetherSelected, setTogetherSelected] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [gradient, setGradient] = useState(DEFAULT_GRADIENT);
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [profile, setProfile] = useState({
    phone: "",
    email: "",
    name: "",
    username: "",
  });
  const started = useRef(false);

  const creatorName = creator.username ?? "your friend";

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      await addMutualMessage(`Hey — @${creatorName} invited you to Mutual.`, 700);
      if (creator.answers.wantToDo) {
        await addMutualMessage(
          `@${creatorName} has been thinking about "${creator.answers.wantToDo}".`,
          800,
        );
      }
      await addMutualMessage(
        "I'm Mutual — I help friends turn ideas into actual plans. Quick setup so I can reach you?",
        700,
      );
      await addMutualMessage("Drop your phone and email to verify it's you.");
      setFormStep("contact");
    })();
  }, [addMutualMessage, creator.answers.wantToDo, creatorName]);

  async function persistInvitee(togetherIdea: string) {
    await fetch("/api/mutual/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "invitee",
        inviteCode: joinCode,
        phone: profile.phone,
        email: profile.email,
        name: profile.name,
        username: profile.username,
        avatarGradient: gradient,
        togetherIdea,
      }),
    });
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
    setProfile((p) => ({ ...p, phone: formatted, email }));
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

  async function handleCode(code: string) {
    setCodeError(null);
    let ok = false;
    try {
      const res = await fetch("/api/mutual/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", phone: profile.phone, code }),
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
    await addMutualMessage("You're verified. What's your first name?");
    setFormStep("name");
  }

  async function handleNameSubmit() {
    const value = nameInput.trim();
    if (!value || typing) return;

    addUserMessage(value);
    setProfile((p) => ({ ...p, name: value }));
    setNameInput("");
    setFormStep(null);
    await addMutualMessage("Pick a username — lowercase, numbers, underscores ok.");
    setFormStep("username");
  }

  async function handleUsernameSubmit() {
    const value = usernameInput.trim();
    if (!value || typing) return;
    setFieldError(null);

    const username = value.toLowerCase();
    if (!isValidUsername(username)) {
      setFieldError("3–20 chars, lowercase letters, numbers, or _");
      return;
    }
    addUserMessage(`@${username}`);
    setProfile((p) => ({ ...p, username }));
    setUsernameInput("");
    setFormStep(null);
    await addMutualMessage("Choose an avatar color.");
    setFormStep("avatar");
  }

  async function handleTogetherSubmit() {
    const value = formatChipSelection(togetherSelected, composer);
    if (!value || typing) return;

    addUserMessage(value);
    setTogetherSelected([]);
    setComposer("");
    setFormStep(null);

    await persistInvitee(value);
    await addMutualMessage(
      `Love it — I'll let @${creatorName} know you're up for "${value}". You're connected.`,
    );
    onDone();
  }

  async function handleAvatarContinue() {
    addUserMessage("Done");
    setFormStep(null);
    await addMutualMessage(
      `What's something you'd actually want to do with @${creatorName}?`,
    );
    setFormStep("together");
  }

  function handleComposerChange(value: string) {
    setComposer(value);
    setFieldError(null);
  }

  function composerPlaceholder(): string {
    if (typing) return "Mutual is typing…";
    return "Or type something else…";
  }

  const composerEnabled = !typing && formStep === "together";

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
      {formStep === "name" ? (
        <ChatTextForm
          formKey="name"
          label="First name"
          placeholder="Jane"
          value={nameInput}
          onChange={setNameInput}
          onSubmit={() => void handleNameSubmit()}
          autoComplete="given-name"
          required
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
          onSubmit={() => void handleUsernameSubmit()}
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
      {formStep === "together" ? (
        <ChatChipForm
          formKey="together"
          label={`What would you want to do with @${creatorName}?`}
          options={TOGETHER_IDEA_CHIPS}
          selected={togetherSelected}
          onToggle={(o) =>
            setTogetherSelected((prev) =>
              prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o],
            )
          }
          customValue={composer}
          onCustomChange={setComposer}
          onSubmit={() => void handleTogetherSubmit()}
          hint="Tap all that fit, or type below"
          hideCustomInput
          required
        />
      ) : null}
    </>
  );

  return (
    <ChatShell
      inline={inline}
      composer={
        formStep === "together" ? (
          <ChatComposer
            value={composer}
            onChange={handleComposerChange}
            onSubmit={() => void handleTogetherSubmit()}
            placeholder={composerPlaceholder()}
            disabled={!composerEnabled}
          />
        ) : null
      }
    />
  );
}

function InviteeLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-[#999999]">Loading invite…</p>
    </div>
  );
}

function InviteeNotFound({ code }: { code: string }) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center px-6">
      <h1 className="mutual-heading text-2xl text-[#e8e8e8]">Invite not found</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#999999]">
        Code <span className="text-[#6dd4b0]">{code}</span> isn&apos;t active.
      </p>
      <a
        href="/mutual"
        className="mt-6 text-sm font-medium text-[#1aad77] hover:text-[#2ec89a]"
      >
        Start fresh →
      </a>
    </div>
  );
}

export function InviteeOnboarding({ joinCode }: { joinCode: string }) {
  const [creator, setCreator] = useState<InviteeCreator | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "missing">("loading");
  const [live, setLive] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(
          `/api/mutual/invite?code=${encodeURIComponent(joinCode.toUpperCase())}`,
        );
        if (!res.ok) {
          setStatus("missing");
          return;
        }
        const data = (await res.json()) as { creator: InviteeCreator };
        setCreator(data.creator);
        setStatus("found");
      } catch {
        setStatus("missing");
      }
    })();
  }, [joinCode]);

  if (status === "loading") return <InviteeLoading />;
  if (status === "missing" || !creator) return <InviteeNotFound code={joinCode} />;

  if (live) {
    return (
      <LiveChat greeting={`You're connected with @${creator.username}. Tell me what you'd love to do together and I'll help make it happen.`} />
    );
  }

  return (
    <ChatProvider>
      <InviteeFlowInner
        joinCode={joinCode.toUpperCase()}
        creator={creator}
        onDone={() => setLive(true)}
      />
    </ChatProvider>
  );
}
