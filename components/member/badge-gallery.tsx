"use client";

import { Award, Info } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { BadgeGallerySkeleton } from "@/components/skeletons/member";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BadgeIcon } from "@/components/panacea/badge-icon";
import { formatDate } from "@/lib/i18n/format";
import type { Badge as BadgeType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MemberHero } from "./member-hero";

export function BadgeGallery() {
  const { tr } = useI18n();
  const { badges, hydrated } = usePanacea();
  if (!hydrated) return <BadgeGallerySkeleton />;
  const earned = badges.filter((badge) => badge.earned);
  const verification = badges.filter((badge) => badge.type === "verification_count");
  const streak = badges.filter((badge) => badge.type === "streak");

  return (
    <div className="space-y-6">
      <MemberHero
        kicker={tr("Koleksi", "Collection")}
        kickerIcon={Award}
        title={tr("Koleksi badgemu", "Your badges collection")}
        description={tr(
          `Kamu sudah membuka ${earned.length} dari ${badges.length} badge. Badge permanen dan tidak hilang saat streak terputus.`,
          `You have unlocked ${earned.length} of ${badges.length} badges. Badges are permanent and do not disappear when a streak breaks.`,
        )}
        mascot="badge"
        actions={
          <span className="rounded-full border border-[#e8e2d5] bg-white/80 px-4 py-2.5 text-xs font-extrabold text-bark-700 shadow-[0_3px_0_rgb(232_226_213/0.7)]">
            {earned.length} / {badges.length} {tr("terbuka", "unlocked")}
          </span>
        }
      />

      <BadgeSection
        title={tr("Verifikasi", "Verification")}
        description={tr("Dari jawaban game yang benar dan kontribusi yang dibantu pakar.", "From correct game answers and expert-assisted contributions.")}
        badges={verification}
      />
      <BadgeSection
        title={tr("Streak", "Streak")}
        description={tr("Dari konsistensi bermain dan belajar. Terputus bukan kegagalan.", "From consistent play and learning. A break is not failure.")}
        badges={streak}
      />

      <div className="flex items-start gap-2 rounded-[18px] border border-dashed border-[#d9e3d2] bg-[#fffdf8]/70 p-4 text-xs leading-relaxed text-bark-700">
        <Info className="mt-0.5 size-4 shrink-0 text-sage-700" aria-hidden="true" />
        <p>
          {tr(
            "Ambang badge dapat berubah. Perubahan hanya berlaku untuk pencapaian baru dan tidak mencabut badge yang sudah terbuka.",
            "Badge treshold can changed. Changes only apply to new achievements and do not revoke badges already unlocked.",
          )}
        </p>
      </div>
    </div>
  );
}

function BadgeSection({ title, description, badges }: { title: string; description: string; badges: BadgeType[] }) {
  const { locale, tr } = useI18n();
  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">{title}</h2>
          <p className="mt-0.5 text-xs text-bark-500">{description}</p>
        </div>
        <Badge variant="outline">
          {badges.filter((badge) => badge.earned).length}/{badges.length}
        </Badge>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {badges.map((badge) => (
          <article
              key={badge.code}
              className={cn(
                "group relative overflow-hidden rounded-[22px] border p-5 cozy-hover",
                badge.earned
                  ? "border-butter-300 bg-gradient-to-br from-[#fff7de] to-[#fffdf8] cozy-shadow-butter"
                  : "border-dashed border-border-strong bg-cream-50 cozy-shadow",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "grid size-14 place-items-center rounded-[18px] border-4",
                    badge.earned
                      ? "border-butter-300 bg-[#f6d982] text-[#7c5c17] shadow-[inset_0_-4px_0_rgb(138_100_26/0.18),0_6px_12px_rgb(246_217_130/0.4)]"
                      : "border-cream-200 bg-cream-100 text-bark-500",
                  )}
                >
                  <BadgeIcon iconKey={badge.iconKey} className={cn("size-6", badge.earned && "cozy-wiggle-slow")} />
                </span>
                <Badge variant={badge.earned ? "sage" : "outline"}>
                  {badge.earned ? tr("Terbuka", "Unlocked") : tr("Terkunci", "Locked")}
                </Badge>
              </div>
              <h3 className={cn("mt-3 font-heading text-base font-black", badge.earned ? "text-bark-900" : "text-bark-700")}>
                {badge.name[locale]}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-bark-700">{badge.description[locale]}</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-bold text-bark-500">
                  <span>{tr("Progres", "Progress")}</span>
                  <span>{Math.min(badge.progress, badge.threshold)}/{badge.threshold}</span>
                </div>
                <Progress
                  value={badge.progress}
                  max={badge.threshold}
                  className="mt-1.5"
                  barClassName={badge.earned ? "bg-[#c7a53c]" : "bg-sage-300"}
                  label={badge.name[locale]}
                />
              </div>
              {badge.earned && badge.earnedAt ? (
                <p className="mt-3 text-xs font-semibold text-bark-500">
                  {tr("Diraih", "Earned")} {formatDate(badge.earnedAt, locale)}
                </p>
              ) : (
                <p className="mt-3 text-xs font-semibold text-bark-500">
                  {tr("Teruskan untuk membuka", "Keep going to unlock")}
                </p>
              )}
            </article>
        ))}
      </div>
    </section>
  );
}
