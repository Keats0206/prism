"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreatorOnboarding } from "./CreatorOnboarding";
import { InviteeOnboarding } from "./InviteeOnboarding";
import { LiveChat } from "./LiveChat";

function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-[#999999]">Loading…</p>
    </div>
  );
}

function MutualAppInner() {
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join");

  // Is there a valid session? null = still checking. Probing /api/mutual/profile
  // (200 signed in, 401 not) is the same session source the profile sheet uses,
  // so a returning user lands straight in their chat instead of re-onboarding.
  // We also read access status so a waitlisted user gets the right greeting
  // (no "find a match" offer they'd just hit a wall on).
  const [session, setSession] = useState<
    | { signedIn: false }
    | { signedIn: true; granted: boolean; interviewDone: boolean }
    | null
  >(null);

  useEffect(() => {
    // Joining via an invite link always runs the invitee flow; skip the probe.
    if (joinCode) return;
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/mutual/profile");
        if (!active) return;
        if (!res.ok) {
          setSession({ signedIn: false });
          return;
        }
        const data = (await res.json()) as {
          profile?: { accessStatus?: string; interviewCompleted?: boolean };
        };
        setSession({
          signedIn: true,
          granted: data.profile?.accessStatus === "granted",
          interviewDone: Boolean(data.profile?.interviewCompleted),
        });
      } catch {
        if (active) setSession({ signedIn: false });
      }
    })();
    return () => {
      active = false;
    };
  }, [joinCode]);

  if (joinCode) {
    return <InviteeOnboarding joinCode={joinCode} />;
  }

  if (session === null) {
    return <Loading />;
  }

  if (session.signedIn) {
    if (session.granted) {
      return <LiveChat greeting="Welcome back. What do you want to do — find a match, make a plan, or just catch me up?" />;
    }
    const greeting = session.interviewDone
      ? "Welcome back — you're on the early-access list. I'll text you the moment your spot opens. Anything new you want me to know in the meantime?"
      : "Welcome back. Let's pick up where we left off — tell me a bit more about what you're looking for.";
    return <LiveChat greeting={greeting} />;
  }

  return <CreatorOnboarding />;
}

export function MutualApp() {
  return (
    <Suspense fallback={<Loading />}>
      <MutualAppInner />
    </Suspense>
  );
}
