import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PanaMascot } from "@/components/panacea/pana-mascot";
import { cn } from "@/lib/utils";
import { CozyScenery } from "./cozy-scenery";

const tones = {
  sage: "border-sage-300 bg-[linear-gradient(110deg,#eaf3e2_0%,#eff4e5_53%,#f9efd9_100%)]",
  butter: "border-butter-300 from-[#fff7de] via-cream-50 to-sage-100",
} as const;

const kickerTones = {
  sage: "text-sage-700",
  butter: "text-[#8a641a]",
} as const;

export function MemberHero({
  kicker,
  kickerIcon: KickerIcon,
  title,
  description,
  actions,
  mascot = "dashboard",
  mascotClassName,
  tone = "sage",
  bubble,
  className,
}: {
  kicker: string;
  kickerIcon?: LucideIcon;
  title: string;
  description: string;
  actions?: ReactNode;
  mascot?: "dashboard" | "game" | "gameResult" | "badge" | "hero" | "leaderboard" | "teach" | "reviewer" | "summary" | "none";
  mascotClassName?: string;
  tone?: keyof typeof tones;
  bubble?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-[28px] border p-5 sm:p-7 lg:p-8",
        tone === "butter" && "bg-gradient-to-br",
        "after:content-[''] after:absolute after:z-[-1] after:right-[-62px] after:bottom-[-103px] after:h-[180px] after:w-[420px] after:rounded-[50%_45%_0_0] after:-rotate-[7deg] after:bg-[#d9e9d0]",
        "before:content-[''] before:absolute before:z-[-1] before:right-[90px] before:bottom-[-97px] before:h-[130px] before:w-[330px] before:rounded-[50%] before:bg-[#c8dfbd]",
        tones[tone],
        className,
      )}
    >
      <CozyScenery />
      <div className={cn("relative grid items-center gap-5", mascot !== "none" && "lg:grid-cols-[1.2fr_0.8fr]")}>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(185_214_182/0.65)] bg-[rgb(255_252_245/0.8)] px-3 py-1.5 text-[11px] font-black tracking-[0.04em] shadow-[0_2px_0_rgb(185_214_182/0.35)]">
            {KickerIcon ? (
              <span className="grid size-5 place-items-center rounded-full bg-butter-300 text-[#7c5c17]">
                <KickerIcon className="size-3" aria-hidden="true" />
              </span>
            ) : null}
            <span className={kickerTones[tone]}>{kicker}</span>
          </span>
          <h1 className="mt-3 max-w-xl font-heading text-[clamp(1.8rem,3.2vw,2.6rem)] font-black leading-[1.08] tracking-[-0.8px] text-bark-900">
            {title}
          </h1>
          <p className="mt-2.5 max-w-lg text-[15px] leading-[1.75] text-bark-700">{description}</p>
          {actions ? <div className="mt-5 flex flex-wrap items-center gap-2.5">{actions}</div> : null}
        </div>

        {mascot !== "none" ? (
        <div className={cn("relative mx-auto hidden w-full max-w-[260px] sm:block lg:max-w-[300px]", mascotClassName)}>
          <span
            className="absolute inset-x-4 bottom-3 h-6 rounded-full bg-[rgb(61_73_63/0.08)] blur-[2px]"
            aria-hidden="true"
          />
          <span
            className="absolute inset-2 rounded-[50%] border border-dashed border-[rgb(84_122_96/0.22)]"
            aria-hidden="true"
          />
          {bubble ? (
            <span className="cozy-bob absolute -left-4 top-1 z-10 max-w-[132px] -rotate-2 rounded-[16px] border border-[#eae5d9] bg-white px-3 py-2 font-heading text-xs font-extrabold leading-snug text-bark-900 shadow-[0_3px_0_rgb(232_226_213/0.6)]">
              {bubble}
            </span>
          ) : null}
          <div className="cozy-float relative aspect-[4/3] w-full">
            <PanaMascot pose={mascot} />
          </div>
        </div>
        ) : null}
      </div>
    </section>
  );
}
