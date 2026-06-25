export type AvatarGradient = {
  id: string;
  className: string;
};

export type CreatorAnswers = {
  socialGoal: string;
  wishSeenMore: string;
  wantToDo: string;
};

export type CreatorSession = {
  inviteCode: string;
  phone: string;
  email: string;
  username: string;
  avatarGradient: string;
  answers: CreatorAnswers;
  createdAt: string;
};

export type InviteeSession = {
  inviteCode: string;
  name: string;
  username: string;
  avatarGradient: string;
  togetherIdea: string;
  createdAt: string;
};

import type { CardPayload } from "@/mutual/types";

export type ChatMessage = {
  id: string;
  role: "mutual" | "user";
  text: string;
  card?: CardPayload | null;
  /** True while a Vercel AI SDK text stream is still in progress. */
  streaming?: boolean;
};
