import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  sage: "bg-sage-100 text-sage-700 shadow-[inset_0_-3px_0_rgb(84_122_96/0.12)]",
  butter: "bg-[#fff2ce] text-[#8a641a] shadow-[inset_0_-3px_0_rgb(138_100_26/0.12)]",
} as const;

export function MemberPageHeader({
  title,
  description,
  actions,
  icon: Icon,
  tone = "sage",
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className={cn("mt-0.5 grid size-11 shrink-0 place-items-center rounded-[15px]", tones[tone])}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="font-heading text-[clamp(1.7rem,3vw,2.31rem)] font-black leading-[1.14] tracking-[-0.45px] text-bark-900">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-bark-700">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
