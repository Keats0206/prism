import {
  Activity,
  ArrowRight,
  Check,
  Dumbbell,
  Flame,
  HeartPulse,
  type LucideIcon,
  Moon,
  Play,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";

export const iconNames = [
  "activity",
  "arrowRight",
  "check",
  "dumbbell",
  "flame",
  "heartPulse",
  "moon",
  "play",
  "timer",
  "trophy",
  "zap",
] as const;

export type IconName = (typeof iconNames)[number];

const icons: Record<IconName, LucideIcon> = {
  activity: Activity,
  arrowRight: ArrowRight,
  check: Check,
  dumbbell: Dumbbell,
  flame: Flame,
  heartPulse: HeartPulse,
  moon: Moon,
  play: Play,
  timer: Timer,
  trophy: Trophy,
  zap: Zap,
};

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Lucide = icons[name];

  return <Lucide aria-hidden="true" className={className} strokeWidth={2} />;
}
