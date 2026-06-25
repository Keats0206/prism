"use client";

import { useCallback, useEffect, useState } from "react";
import { Drawer } from "vaul";
import {
  Sparkles,
  MapPin,
  Lock,
  Users,
  Globe2,
  Trash2,
  Heart,
  Briefcase,
  UserPlus,
  LogOut,
  X,
} from "lucide-react";
import { DEFAULT_GRADIENT } from "@/app/mutual/lib/gradients";
import type { CreatorAnswers, UserIntents } from "@/mutual/types";

type Profile = {
  name: string | null;
  bio: string | null;
  username: string | null;
  avatarGradient: string | null;
  answers: CreatorAnswers;
  intents: UserIntents;
  city: string | null;
};

type Memory = {
  id: string;
  content: string;
  visibility: "private" | "friends" | "public";
  subjectUserId: string | null;
  createdAt: string;
};

// The four agent intents, with how Mutual frames each as something it can do.
const INTENT_META: Record<
  keyof UserIntents,
  { label: string; icon: typeof Heart }
> = {
  friendship: { label: "Deepen friendships", icon: Users },
  intros: { label: "Make introductions", icon: UserPlus },
  dating: { label: "Help with dating", icon: Heart },
  work: { label: "Work connections", icon: Briefcase },
};

const VISIBILITY_META: Record<
  Memory["visibility"],
  { label: string; icon: typeof Lock }
> = {
  private: { label: "Private", icon: Lock },
  friends: { label: "Friends", icon: Users },
  public: { label: "Public", icon: Globe2 },
};

export function ProfileSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/mutual/auth", { method: "DELETE" });
    } catch {
      // Even if the request fails, a full reload re-probes the session and
      // sends the user to onboarding if the cookie is gone.
    }
    // Hard reload so MutualApp re-runs its session probe from a clean slate.
    window.location.assign("/mutual");
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        fetch("/api/mutual/profile"),
        fetch("/api/mutual/memories"),
      ]);
      if (p.ok) setProfile((await p.json()).profile);
      if (m.ok) setMemories((await m.json()).memories);
    } catch {
      // Surface nothing — an empty sheet is better than a crash.
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch each time the sheet opens so facts stay current as the agent learns.
  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function removeMemory(id: string) {
    setMemories((prev) => prev.filter((m) => m.id !== id)); // optimistic
    try {
      await fetch(`/api/mutual/memories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      void load(); // reconcile on failure
    }
  }

  const helpWith = (Object.keys(INTENT_META) as (keyof UserIntents)[]).filter(
    (k) => profile?.intents?.[k],
  );
  const goals = profile
    ? [profile.answers?.socialGoal, profile.answers?.wantToDo]
        .filter(Boolean)
        .flatMap((s) => s!.split(",").map((x) => x.trim()))
        .filter(Boolean)
    : [];

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Drawer.Content className="mutual-theme fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-[20px] outline-none">
          {/* Grabber */}
          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-white/15" />

          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <Drawer.Title className="text-[15px] font-semibold text-[#e8e8e8]">
              Your profile
            </Drawer.Title>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="rounded-full p-1.5 text-[#999999] transition-colors hover:bg-white/5 hover:text-[#e8e8e8]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {loading && !profile ? (
              <p className="py-10 text-center text-sm text-[#999999]">Loading…</p>
            ) : (
              <>
                {/* Profile header */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`h-16 w-16 shrink-0 rounded-full ${
                      profile?.avatarGradient ?? DEFAULT_GRADIENT
                    }`}
                  />
                  <div className="min-w-0">
                    {profile?.name ? (
                      <p className="truncate text-[17px] font-semibold text-[#e8e8e8]">
                        {profile.name}
                      </p>
                    ) : null}
                    {profile?.username ? (
                      <p className="text-[13px] text-[#6dd4b0]">
                        @{profile.username}
                      </p>
                    ) : null}
                    {profile?.city ? (
                      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#999999]">
                        <MapPin className="h-3 w-3" />
                        {profile.city}
                      </p>
                    ) : null}
                  </div>
                </div>

                {profile?.bio ? (
                  <p className="mt-3.5 text-[13.5px] leading-relaxed text-[#cccccc]">
                    {profile.bio}
                  </p>
                ) : null}

                {/* What Mutual can help with */}
                <Section title="What Mutual can help you with" icon={Sparkles}>
                  {helpWith.length === 0 && goals.length === 0 ? (
                    <Empty>Tell Mutual what you’re looking for in chat.</Empty>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {helpWith.map((k) => {
                        const { label, icon: Icon } = INTENT_META[k];
                        return (
                          <div
                            key={k}
                            className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#2a2a2a] px-3 py-2.5"
                          >
                            <Icon className="h-4 w-4 shrink-0 text-[#2ec89a]" />
                            <span className="text-[13.5px] text-[#e8e8e8]">
                              {label}
                            </span>
                          </div>
                        );
                      })}
                      {goals.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {goals.map((g, i) => (
                            <span
                              key={i}
                              className="rounded-full border border-white/[0.07] bg-[#2a2a2a] px-2.5 py-1 text-[12px] text-[#999999]"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </Section>

                {/* What Mutual is learning */}
                <Section title="What Mutual is learning about you" icon={Sparkles}>
                  {memories.length === 0 ? (
                    <Empty>
                      Nothing yet — Mutual remembers facts as you chat.
                    </Empty>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {memories.map((m) => {
                        const { label, icon: VIcon } =
                          VISIBILITY_META[m.visibility];
                        return (
                          <li
                            key={m.id}
                            className="group flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-[#2a2a2a] px-3 py-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[13.5px] leading-snug text-[#e8e8e8]">
                                {m.content}
                              </p>
                              <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#777777]">
                                <VIcon className="h-3 w-3" />
                                {label}
                              </span>
                            </div>
                            <button
                              onClick={() => removeMemory(m.id)}
                              aria-label="Forget this"
                              className="shrink-0 rounded-lg p-1.5 text-[#777777] transition-colors hover:bg-white/5 hover:text-[#ff8585]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Section>

                <button
                  onClick={logout}
                  disabled={loggingOut}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-[#2a2a2a] px-3 py-3 text-[13.5px] font-medium text-[#cccccc] transition-colors hover:bg-white/5 hover:text-[#ff8585] disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? "Logging out…" : "Log out"}
                </button>
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Sparkles;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[#999999]">
        <Icon className="h-3.5 w-3.5 text-[#2ec89a]" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-white/[0.08] px-3 py-4 text-center text-[12.5px] text-[#777777]">
      {children}
    </p>
  );
}
