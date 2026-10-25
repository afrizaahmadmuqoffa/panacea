import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow ? (
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#dce8d4] bg-[#fffdf8]/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sage-700 shadow-[inset_0_1px_0_#fff]">
            <span className="size-1.5 rounded-full bg-sage-600" aria-hidden="true" />
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-heading text-[clamp(1.8rem,3.2vw,2.5rem)] font-black leading-[1.1] tracking-[-0.6px] text-bark-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-bark-700">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
