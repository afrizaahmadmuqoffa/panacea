import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "sage",
  variant = "cozy",
  interactive = true,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "sage" | "sky" | "peach" | "butter";
  variant?: "plain" | "cozy";
  interactive?: boolean;
  className?: string;
}) {
  const tones = {
    sage: "bg-sage-100 text-sage-700",
    sky: "bg-sage-100 text-sage-700",
    peach: "bg-[#fff2ce] text-[#8a641a]",
    butter: "bg-[#fff2ce] text-[#8a641a]",
  };
  const cozy = variant === "cozy";
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[22px] border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow",
        interactive && "cozy-hover hover:border-sage-300",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-bold text-bark-700">{label}</p>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-md",
            tones[tone],
            cozy && "size-10 rounded-[13px] shadow-[inset_0_-3px_0_rgb(61_73_63/0.08)]",
          )}
        >
          <Icon className={cn("size-[18px]", cozy && "cozy-wiggle-slow")} aria-hidden="true" />
        </span>
      </div>
      <p
        className={cn(
          "mt-3 font-heading text-3xl font-black tracking-[-0.6px] text-bark-900 [font-variant-numeric:tabular-nums]",
          cozy && "mt-2.5 text-[2rem] font-black",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-bark-500">{hint}</p> : null}
    </div>
  );
}
