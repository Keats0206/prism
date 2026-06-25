"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleUserRound } from "lucide-react";
import type { ChatMessage } from "@/app/mutual/lib/types";
import type { CardPayload } from "@/mutual/types";
import { AVATAR_GRADIENTS } from "@/app/mutual/lib/gradients";
import { streamText } from "@/app/mutual/lib/stream-text";
import { delay, isValidEmail, uid } from "@/app/mutual/lib/utils";
import { MessageCard } from "./cards/MessageCard";
import { ProfileSheet } from "./ProfileSheet";

function highlightMessage(text: string) {
  const parts = text.split(/(@[\w]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="text-[#6dd4b0]">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

type ServerMessage = {
  id: string;
  role: "mutual" | "user";
  text: string;
  card?: CardPayload | null;
};

type ChatContextValue = {
  messages: ChatMessage[];
  typing: boolean;
  setTyping: (value: boolean) => void;
  addUserMessage: (text: string) => void;
  addMutualMessage: (text: string, pauseMs?: number) => Promise<void>;
  addStreamingMutualMessage: (
    text: string,
    options?: { pauseMs?: number; chunkDelayMs?: number; signal?: AbortSignal },
  ) => Promise<void>;
  addMutualMessages: (texts: string[], pauseMs?: number) => Promise<void>;
  addOptimisticUser: (text: string) => string;
  applyServerMessages: (items: ServerMessage[]) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }, []);

  const addUserMessage = useCallback(
    (text: string) => {
      setMessages((prev) => [...prev, { id: uid(), role: "user", text }]);
      scrollToBottom();
    },
    [scrollToBottom],
  );

  const addMutualMessage = useCallback(
    async (text: string, pauseMs = 650) => {
      setTyping(true);
      scrollToBottom();
      await delay(pauseMs);
      setMessages((prev) => [...prev, { id: uid(), role: "mutual", text }]);
      setTyping(false);
      scrollToBottom();
    },
    [scrollToBottom],
  );

  const addStreamingMutualMessage = useCallback(
    async (
      text: string,
      {
        pauseMs = 650,
        chunkDelayMs = 14,
        signal,
      }: { pauseMs?: number; chunkDelayMs?: number; signal?: AbortSignal } = {},
    ) => {
      if (signal?.aborted) return;
      setTyping(true);
      scrollToBottom();
      await delay(pauseMs);
      if (signal?.aborted) return;

      const id = uid();
      setMessages((prev) => [...prev, { id, role: "mutual", text: "", streaming: true }]);
      setTyping(false);

      await streamText(text, {
        chunkDelayMs,
        signal,
        onChunk: (partial) => {
          if (signal?.aborted) return;
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, text: partial } : m)),
          );
          scrollToBottom();
        },
      });

      if (signal?.aborted) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        return;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, streaming: false } : m)),
      );
      scrollToBottom();
    },
    [scrollToBottom],
  );

  const addMutualMessages = useCallback(
    async (texts: string[], pauseMs = 650) => {
      for (const text of texts) {
        await addMutualMessage(text, pauseMs);
      }
    },
    [addMutualMessage],
  );

  // Show a user bubble immediately; reconciled away once the server echo arrives.
  const addOptimisticUser = useCallback(
    (text: string) => {
      const id = `opt:${uid()}`;
      setMessages((prev) => [...prev, { id, role: "user", text }]);
      scrollToBottom();
      return id;
    },
    [scrollToBottom],
  );

  // Server-authoritative merge: drop optimistic bubbles, add any new persisted
  // messages by id (dedupe), keeping order. Used for history load + polling.
  const applyServerMessages = useCallback((items: ServerMessage[]) => {
    setMessages((prev) => {
      const kept = prev.filter((m) => !m.id.startsWith("opt:"));
      const existing = new Set(kept.map((m) => m.id));
      const additions = items.filter((i) => !existing.has(i.id));
      if (additions.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...additions];
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, typing, scrollToBottom]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        typing,
        setTyping,
        addUserMessage,
        addMutualMessage,
        addStreamingMutualMessage,
        addMutualMessages,
        addOptimisticUser,
        applyServerMessages,
        scrollRef,
        scrollToBottom,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function MutualBubble({
  children,
  streaming,
}: {
  children: ReactNode;
  streaming?: boolean;
}) {
  const text = typeof children === "string" ? children : null;

  return (
    <div className="w-full border-b border-white/[0.08] px-4 py-3.5">
      <p className="whitespace-pre-wrap text-[16px] leading-[1.55] text-[#e8e8e8]">
        {text ? highlightMessage(text) : children}
        {streaming ? (
          <span
            className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-px animate-pulse bg-[#1aad77]"
            aria-hidden
          />
        ) : null}
      </p>
    </div>
  );
}

export function ChatFormCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full border-b border-white/[0.08] bg-white/[0.04] px-4 py-4">
      {children}
    </div>
  );
}

export function FormLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-2 block text-[14px] font-medium text-[#e8e8e8]">
      {children}
      {required ? <span className="text-[#2ec89a]"> *</span> : null}
    </span>
  );
}

const formInputClass =
  "w-full rounded-xl border border-white/[0.08] bg-[#333333] px-3.5 py-2.5 text-[16px] text-[#e8e8e8] outline-none placeholder:text-[#666666] focus:border-[#1aad77]/50 focus:ring-2 focus:ring-[#1aad77]/15";

function FormSubmit({
  label,
  disabled,
}: {
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-4 w-full rounded-xl bg-[#1aad77] py-2.5 text-[15px] font-medium text-white transition hover:bg-[#159a6a] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export function ChatContactForm({
  phone,
  email,
  onPhoneChange,
  onEmailChange,
  onSubmit,
  error,
}: {
  phone: string;
  email: string;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  error?: string | null;
}) {
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  const digits = phone.replace(/\D/g, "");
  const canSubmit = digits.length >= 10 && isValidEmail(email.trim().toLowerCase());

  return (
    <ChatFormCard>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit();
        }}
      >
        <div className="mb-4">
          <FormLabel required>Phone Number</FormLabel>
          <div className="flex gap-2">
            <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#333333] px-3 py-2.5 text-[14px] text-[#999999]">
              <span aria-hidden>🇺🇸</span>
              <span>+1</span>
              <span className="text-[#555555]">▾</span>
            </div>
            <input
              ref={phoneRef}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="5551234567"
              className={`${formInputClass} min-w-0 flex-1`}
            />
          </div>
        </div>

        <div>
          <FormLabel required>Email</FormLabel>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="jane@company.com"
            className={formInputClass}
          />
        </div>

        {error ? <p className="mt-3 text-xs text-[#ff8a8a]">{error}</p> : null}

        <FormSubmit label="Submit" disabled={!canSubmit} />
      </form>
    </ChatFormCard>
  );
}

export function ChatTextForm({
  formKey,
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  type = "text",
  inputMode,
  autoComplete,
  error,
  hint,
  prefix,
  submitLabel = "Submit",
  multiline = false,
  required = false,
}: {
  formKey: string;
  label?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
  error?: string | null;
  hint?: string;
  prefix?: string;
  submitLabel?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [formKey]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <ChatFormCard>
      <form onSubmit={handleSubmit}>
        {label ? <FormLabel required={required}>{label}</FormLabel> : null}

        {prefix ? (
          <div className="flex items-center gap-2">
            <span className="text-[15px] text-[#666666]">{prefix}</span>
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              type={type}
              inputMode={inputMode}
              autoComplete={autoComplete}
              placeholder={placeholder}
              className={`${formInputClass} flex-1`}
            />
          </div>
        ) : multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={`${formInputClass} resize-none`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            placeholder={placeholder}
            className={formInputClass}
          />
        )}

        {error ? (
          <p className="mt-2 text-xs text-[#ff8a8a]">{error}</p>
        ) : hint ? (
          <p className="mt-2 text-xs text-[#666666]">{hint}</p>
        ) : null}

        <FormSubmit label={submitLabel} disabled={!value.trim()} />
      </form>
    </ChatFormCard>
  );
}

export function ChatChipForm({
  formKey,
  label,
  options,
  selected,
  onToggle,
  onSubmit,
  customValue = "",
  onCustomChange,
  customPlaceholder = "Something else…",
  hint,
  required = false,
  minSelections = 1,
  submitLabel = "Submit",
  hideCustomInput = false,
}: {
  formKey: string;
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
  onSubmit: () => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  customPlaceholder?: string;
  hint?: string;
  required?: boolean;
  minSelections?: number;
  submitLabel?: string;
  hideCustomInput?: boolean;
}) {
  const customRef = useRef<HTMLInputElement>(null);
  const hasCustom = Boolean(onCustomChange) && !hideCustomInput;
  const canSubmit =
    selected.length >= minSelections || Boolean(customValue.trim());

  useEffect(() => {
    if (hasCustom) customRef.current?.focus();
  }, [formKey, hasCustom]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSubmit) onSubmit();
  }

  return (
    <ChatFormCard>
      <form onSubmit={handleSubmit}>
        <FormLabel required={required}>{label}</FormLabel>

        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className={`rounded-full px-3.5 py-2 text-[14px] transition ${
                  active
                    ? "bg-[#1aad77] text-white"
                    : "border border-white/[0.08] bg-[#333333] text-[#999999] hover:border-[#1aad77]/40 hover:text-[#e8e8e8]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {hasCustom ? (
          <input
            ref={customRef}
            type="text"
            value={customValue}
            onChange={(e) => onCustomChange?.(e.target.value)}
            placeholder={customPlaceholder}
            className={`${formInputClass} mt-3`}
          />
        ) : null}

        {hint ? (
          <p className="mt-2 text-xs text-[#666666]">{hint}</p>
        ) : null}

        <FormSubmit label={submitLabel} disabled={!canSubmit} />
      </form>
    </ChatFormCard>
  );
}

export function UserBubble({ children }: { children: ReactNode }) {
  const text = typeof children === "string" ? children : null;

  return (
    <div className="w-full border-b border-white/[0.08] bg-white/[0.05] px-4 py-3.5">
      <p className="whitespace-pre-wrap text-[16px] leading-[1.55] text-white">
        {text ? highlightMessage(text) : children}
      </p>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 border-b border-white/[0.08] px-4 py-3.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-pulse rounded-full bg-[#666666]"
          style={{ animationDelay: `${i * 180}ms` }}
        />
      ))}
      <span className="ml-1 text-[14px] text-[#999999]">Mutual is typing…</span>
    </div>
  );
}

export function ChatThread({ inline }: { inline?: ReactNode }) {
  const { messages, typing, scrollRef } = useChat();

  return (
    <div
      ref={scrollRef}
      className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain py-2"
    >
      {messages.map((msg) =>
        msg.role === "mutual" ? (
          <div key={msg.id}>
            <MutualBubble streaming={msg.streaming}>{msg.text}</MutualBubble>
            {msg.card ? <MessageCard card={msg.card} /> : null}
          </div>
        ) : (
          <UserBubble key={msg.id}>{msg.text}</UserBubble>
        ),
      )}
      {typing ? <TypingIndicator /> : null}
      {inline}
    </div>
  );
}

export function ChatHeader() {
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between bg-[#1aad77] px-4 py-4">
      <p className="mutual-logo text-white" aria-label="Mutual">
        mutual
      </p>
      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Your profile"
        className="-mr-1 rounded-full p-1.5 text-white/90 transition-colors hover:bg-white/15 hover:text-white"
      >
        <CircleUserRound className="h-6 w-6" />
      </button>
      <ProfileSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </header>
  );
}

export function CodeInput({
  onComplete,
  error,
}: {
  onComplete: (code: string) => void;
  error?: string | null;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const submittedRef = useRef(false);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      submittedRef.current = false;
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    }
  }, [error]);

  function update(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < 5) refs.current[index + 1]?.focus();

    const complete = next.every((d) => d !== "");
    if (complete && !submittedRef.current) {
      submittedRef.current = true;
      onComplete(next.join(""));
    }
  }

  function handleKeyDown(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <ChatFormCard>
      <FormLabel required>Verification code</FormLabel>
      <div className="space-y-3">
        <div className="flex gap-2">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e.key)}
              className="h-11 w-10 rounded-lg border border-white/[0.08] bg-[#333333] text-center text-lg text-[#e8e8e8] outline-none focus:border-[#1aad77]/50 focus:ring-2 focus:ring-[#1aad77]/15"
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        {error ? (
          <p className="text-xs text-[#ff8a8a]">{error}</p>
        ) : (
          <p className="text-xs text-[#666666]">Enter the 6-digit code we sent you.</p>
        )}
      </div>
    </ChatFormCard>
  );
}

export function AvatarPicker({
  selected,
  onSelect,
  onContinue,
}: {
  selected: string;
  onSelect: (className: string) => void;
  onContinue: () => void;
}) {
  return (
    <ChatFormCard>
      <FormLabel>Pick your avatar</FormLabel>
      <div className="space-y-4">
        <div className="flex">
          <div className={`h-[72px] w-[72px] rounded-full ${selected}`} />
        </div>
        <div className="flex flex-wrap gap-2.5">
          {AVATAR_GRADIENTS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelect(g.className)}
              className={`h-9 w-9 rounded-full ${g.className} transition ${
                selected === g.className
                  ? "ring-2 ring-[#1aad77] ring-offset-2 ring-offset-[#2a2a2a]"
                  : ""
              }`}
              aria-label={`Color ${g.id}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-xl bg-[#1aad77] py-2.5 text-[15px] font-medium text-white hover:bg-[#159a6a]"
        >
          Continue
        </button>
      </div>
    </ChatFormCard>
  );
}

export function SharePanel({
  username,
  email,
  avatarGradient,
  inviteCode,
  inviteUrl,
}: {
  username: string;
  email: string;
  avatarGradient: string;
  inviteCode: string;
  inviteUrl: string;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  async function copy(text: string, which: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "link") {
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        window.setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <ChatFormCard>
      <FormLabel>Invite friends</FormLabel>
      <div className="space-y-3">
        <div className="flex items-center gap-3 border border-white/[0.1] bg-[#333333] px-3 py-2.5">
          <div className={`h-10 w-10 shrink-0 rounded-full ${avatarGradient}`} />
          <div className="min-w-0 text-left">
            <p className="text-sm font-medium text-[#6dd4b0]">@{username}</p>
            <p className="truncate text-xs text-[#666666]">{email}</p>
          </div>
        </div>

        <p className="text-[14px] leading-snug text-[#999999]">
          Share this link or code with 2–3 friends. Once they join, I can start
          helping you build a better social life together.
        </p>

        <div className="border border-white/[0.1] bg-[#333333] px-4 py-3">
          <p className="text-xs tracking-wide text-[#666666] uppercase">
            Invite code
          </p>
          <p className="mt-1 text-2xl font-medium tracking-[0.2em] text-[#e8e8e8]">
            {inviteCode}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void copy(inviteUrl, "link")}
            className="w-full rounded-xl bg-[#1aad77] py-2.5 text-[15px] font-medium text-white hover:bg-[#159a6a]"
          >
            {copiedLink ? "Link copied!" : "Copy invite link"}
          </button>
          <button
            type="button"
            onClick={() => void copy(inviteCode, "code")}
            className="w-full border border-white/[0.1] bg-[#333333] py-2.5 text-[14px] text-[#999999] hover:text-[#e8e8e8]"
          >
            {copiedCode ? "* Code copied!" : "> Copy invite code"}
          </button>
        </div>
      </div>
    </ChatFormCard>
  );
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  placeholder = "Message Mutual…",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled, placeholder]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  return (
    <div className="mutual-glass-bar sticky bottom-0 z-20 shrink-0 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled && value.trim()) onSubmit();
        }}
        className="flex w-full items-end gap-2"
      >
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="max-h-32 min-h-[44px] w-full resize-none rounded-2xl border border-white/[0.08] bg-[#333333] px-4 py-[11px] text-[16px] leading-snug text-white outline-none placeholder:text-[#666666] focus:border-[#1aad77]/40 disabled:opacity-40"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1aad77] text-white transition hover:bg-[#159a6a] disabled:bg-[#333333] disabled:text-[#666666]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 5l7 7-7 7M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}

export function ChatShell({
  inline,
  composer,
}: {
  inline?: ReactNode;
  composer?: ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <ChatHeader />
      <div className="mutual-glass-panel relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatThread inline={inline} />
        {composer}
      </div>
    </div>
  );
}
