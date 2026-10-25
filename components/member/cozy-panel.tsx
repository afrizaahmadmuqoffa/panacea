import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const accents = {
  sage: "from-sage-300 to-sage-600",
  butter: "from-butter-300 to-[#e2c16b]",
} as const;

const shadows = {
  default: "cozy-shadow",
  sage: "cozy-shadow-sage",
  butter: "cozy-shadow-butter",
  rose: "cozy-shadow-rose",
} as const;

export function CozyPanel({
  children,
  accent,
  shadow = "default",
  interactive,
  padded = true,
  className,
}: {
  children: ReactNode;
  accent?: keyof typeof accents;
  shadow?: keyof typeof shadows;
  interactive?: boolean;
  padded?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-[22px] border border-[#eae5d9] bg-[#fffdf8]",
        shadows[shadow],
        padded && "p-5 sm:p-6",
        interactive && "cozy-hover hover:border-sage-300",
        className,
      )}
    >
      {accent ? (
        <span
          className={cn(
            "absolute inset-x-5 top-0 h-[3px] origin-left scale-x-50 rounded-b-[5px] bg-gradient-to-r transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none",
            accents[accent],
          )}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </section>
  );
}

export function CozyPanelHeader({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-dashed border-[#e8e2d5] px-5 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-sage-100 text-sage-700 shadow-[inset_0_-2px_0_rgb(84_122_96/0.12)]">
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-heading text-[21px] font-black leading-tight tracking-[-0.45px] text-bark-900">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-xs leading-relaxed text-bark-500">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
