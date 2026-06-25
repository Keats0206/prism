"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChatComposer,
  ChatProvider,
  ChatShell,
  useChat,
} from "./chat-ui";

type ServerMsg = {
  id: string;
  role: "mutual" | "user";
  text: string;
  createdAt: string;
};

function LiveChatInner({ greeting }: { greeting?: string }) {
  const {
    typing,
    setTyping,
    addOptimisticUser,
    addMutualMessage,
    applyServerMessages,
  } = useChat();
  const [composer, setComposer] = useState("");
  const cursorRef = useRef<string | null>(null);
  const sendingRef = useRef(false);
  const initialized = useRef(false);

  const refresh = useCallback(async () => {
    const url = cursorRef.current
      ? `/api/mutual/chat?after=${encodeURIComponent(cursorRef.current)}`
      : "/api/mutual/chat";
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = (await res.json()) as {
        messages: ServerMsg[];
        cursor: string | null;
      };
      if (data.messages.length > 0) applyServerMessages(data.messages);
      if (data.cursor) cursorRef.current = data.cursor;
    } catch {
      // Transient network blip (dev recompile, sleep/wake) — the next poll
      // will recover. Never surface a polling failure to the user.
    }
  }, [applyServerMessages]);

  // Load history once, then greet if the thread is still empty.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void (async () => {
      const url = "/api/mutual/chat";
      let empty = true;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as {
            messages: ServerMsg[];
            cursor: string | null;
          };
          empty = data.messages.length === 0;
          if (data.messages.length > 0) applyServerMessages(data.messages);
          if (data.cursor) cursorRef.current = data.cursor;
        }
      } catch {
        /* next poll recovers */
      }
      if (greeting && empty) {
        await addMutualMessage(greeting, 400);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Poll for out-of-band activity (friend joined, relayed reply).
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!sendingRef.current) void refresh();
    }, 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function send() {
    const text = composer.trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;
    setComposer("");
    addOptimisticUser(text);
    setTyping(true);
    try {
      await fetch("/api/mutual/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      // Reconcile: pulls the persisted user message + Mutual's reply.
      await refresh();
    } catch {
      await addMutualMessage("Something went wrong — try again.", 200);
    } finally {
      setTyping(false);
      sendingRef.current = false;
    }
  }

  return (
    <ChatShell
      composer={
        <ChatComposer
          value={composer}
          onChange={setComposer}
          onSubmit={() => void send()}
          placeholder={typing ? "Mutual is typing…" : "Message Mutual…"}
          disabled={typing}
        />
      }
    />
  );
}

export function LiveChat({ greeting }: { greeting?: string }) {
  return (
    <ChatProvider>
      <LiveChatInner greeting={greeting} />
    </ChatProvider>
  );
}
