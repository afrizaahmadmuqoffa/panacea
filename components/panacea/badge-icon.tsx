import { Flame, Leaf, Shield, Sprout, Star, TreeDeciduous, type LucideIcon } from "lucide-react";
import type { Badge } from "@/lib/types";
import { cn } from "@/lib/utils";

export const BADGE_ICONS: Record<Badge["iconKey"], LucideIcon> = {
  sprout: Sprout,
  leaf: Leaf,
  tree: TreeDeciduous,
  flame: Flame,
  star: Star,
  shield: Shield,
};

export function BadgeIcon({ iconKey, className }: { iconKey: Badge["iconKey"]; className?: string }) {
  const Icon = BADGE_ICONS[iconKey];
  return <Icon className={cn("size-5", className)} aria-hidden="true" />;
}
