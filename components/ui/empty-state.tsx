import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
  compact,
  icon: Icon,
  state,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  icon: LucideIcon;
  state?: "none" | "filtered";
}) {
  return (
    <div
      data-empty={state}
      className={cn(
        "flex flex-col items-center justify-center rounded-[22px] border border-dashed border-[#e8e2d5] bg-[#fffdf8] px-6 text-center cozy-shadow",
        compact ? "py-8" : "py-14",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-[16px] bg-sage-100 text-sage-700 shadow-[inset_0_-3px_0_rgb(84_122_96/0.08)]">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-heading text-lg font-extrabold text-bark-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-bark-700">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
