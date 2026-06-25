import type { AvatarGradient } from "./types";

export const AVATAR_GRADIENTS: AvatarGradient[] = [
  { id: "violet", className: "bg-gradient-to-br from-violet-500 to-fuchsia-500" },
  { id: "ocean", className: "bg-gradient-to-br from-blue-500 to-cyan-400" },
  { id: "sunset", className: "bg-gradient-to-br from-orange-500 to-rose-500" },
  { id: "forest", className: "bg-gradient-to-br from-emerald-500 to-teal-400" },
  { id: "gold", className: "bg-gradient-to-br from-amber-500 to-orange-400" },
  { id: "indigo", className: "bg-gradient-to-br from-indigo-500 to-purple-500" },
];

export const DEFAULT_GRADIENT = AVATAR_GRADIENTS[0].className;
