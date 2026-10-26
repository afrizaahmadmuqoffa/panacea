"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Flame,
  SearchCheck,
  Trophy,
  User,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { DashboardSkeleton } from "@/components/skeletons/member";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatTile } from "@/components/ui/stat-tile";
import { BadgeIcon } from "@/components/panacea/badge-icon";
import { StatusBadge } from "@/components/panacea/status-badge";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { CozyPanel, CozyPanelHeader } from "./cozy-panel";
import { MemberHero } from "./member-hero";

export function DashboardHome() {
  const { locale, tr } = useI18n();
  const { profile, claims, badges, notifications, hydrated } = usePanacea();
  if (!hydrated) return <DashboardSkeleton />;
  const recentClaims = claims.slice(0, 4);
  const earnedBadges = badges.filter((badge) => badge.earned);
  const earned = earnedBadges.slice(0, 3);
  // Badge yang belum terbuka diurutkan dari rasio progres tertinggi, jadi yang paling dekat tercapai tampil dulu.
  const upcomingBadges = badges
    .filter((badge) => !badge.earned)
    .sort(
      (a, b) =>
        b.progress / Math.max(1, b.threshold) - a.progress / Math.max(1, a.threshold),
    )
    .slice(0, 3);
  // Semua badge sudah terbuka: tampilkan tiga badge yang terakhir dicapai.
  const recentlyEarned = [...earnedBadges]
    .sort(
      (a, b) =>
        new Date(b.earnedAt ?? 0).getTime() - new Date(a.earnedAt ?? 0).getTime(),
    )
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <MemberHero
        kicker={tr("Ruang anggota", "Member space")}
        kickerIcon={User}
        title={tr(`Halo, ${profile.fullName.split(" ")[0]}.`, `Hi, ${profile.fullName.split(" ")[0]}.`)}
        description={tr(
          "Klaim terbaru, progres belajar, dan notifikasi penting ada di satu tempat. Mulai dari satu pertanyaan.",
          "Your latest claims, learning progress, and important notifications are in one place. Start with one question.",
        )}
        mascot="dashboard"
        actions={
          <>
            <Link href={`/${locale}/cek-klaim`} className={buttonVariants({ variant: "cozy" })}>
              <SearchCheck className="size-4" aria-hidden="true" />
              {tr("Cek klaim baru", "Check a new claim")}
            </Link>
            <Link href={`/${locale}/game`} className={buttonVariants({ variant: "cozySoft" })}>
              {tr("Lanjutkan belajar", "Continue learning")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2">
        <StatTile
          variant="cozy"
          interactive
          label={tr("Total poin", "Total points")}
          value={profile.xp.toLocaleString(locale === "id" ? "id-ID" : "en-GB")}
          hint={tr("Dari game dan kontribusi", "From games and contributions")}
          icon={Trophy}
          tone="butter"
        />
        <StatTile
          variant="cozy"
          interactive
          label={tr("Streak harian", "Daily streak")}
          value={`${profile.streak} ${tr("hari", "days")}`}
          hint={tr("Main satu sesi untuk menjaga streak", "Play one session to keep your streak")}
          icon={Flame}
          tone="butter"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <CozyPanel padded={false} interactive className="flex h-full flex-col">
          <CozyPanelHeader
            icon={BookOpenCheck}
            title={tr("Klaim terakhir", "Recent claims")}
            description={tr("Hanya klaim milik akun ini", "Only claims owned by this account")}
            action={
              <Link href={`/${locale}/riwayat-klaim`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                {tr("Lihat semua", "View all")}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <ul className="flex flex-1 flex-col divide-y divide-[#e8e2d5]">
            {recentClaims.length === 0 ? (
              <li className="px-5 py-6 text-xs leading-relaxed text-bark-500">
                {tr(
                  "Belum ada klaim yang diperiksa. Mulai dengan satu pertanyaan.",
                  "No claims checked yet. Start with one question.",
                )}
              </li>
            ) : null}
            {recentClaims.map((claim) => (
              <li key={claim.id} className="flex-1">
                <Link
                  href={`/${locale}/cek-klaim/${claim.id}`}
                  className="group/row flex h-full items-center gap-3 px-5 py-4 transition hover:bg-sage-100/40"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-cream-100 text-bark-700 shadow-[inset_0_-2px_0_rgb(61_73_63/0.08)]">
                    <BookOpenCheck className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-bark-900">
                      {claim.originalText}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-bark-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" aria-hidden="true" />
                        {formatDate(claim.createdAt, locale)}
                      </span>
                      <StatusBadge status={claim.status} palette="warm" />
                    </div>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-bark-500 transition group-hover/row:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </CozyPanel>

        <CozyPanel interactive className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">{tr("Progres badge", "Badge progress")}</h2>
            <Link href={`/${locale}/badge`} className="text-xs font-bold text-sage-700 hover:underline">
              {tr("Semua", "All")}
            </Link>
          </div>
            {earned.length > 0 ? (
              <div className="mt-3 flex gap-2">
                {earned.map((badge) => (
                  <span
                    key={badge.code}
                    className="grid size-11 place-items-center rounded-full border border-butter-300 bg-[#fff2ce] text-[#8a641a]"
                    title={badge.name[locale]}
                  >
                    <BadgeIcon iconKey={badge.iconKey} className="size-5" />
                  </span>
                ))}
              </div>
            ) : null}

            {upcomingBadges.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                {upcomingBadges.map((badge) => (
                  <div key={badge.code} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-cream-200 bg-cream-100 text-bark-500">
                      <BadgeIcon iconKey={badge.iconKey} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-xs font-bold text-bark-700">
                        <span className="truncate">{badge.name[locale]}</span>
                        <span className="shrink-0 text-bark-500">
                          {Math.min(badge.progress, badge.threshold)}/{badge.threshold}
                        </span>
                      </div>
                      <Progress
                        value={badge.progress}
                        max={badge.threshold}
                        className="mt-1.5"
                        label={badge.name[locale]}
                      />
                      <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-bark-500">
                        {badge.description[locale]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-xs font-extrabold text-bark-900">
                  {tr("Semua badge sudah terbuka.", "Every badge is unlocked.")}
                </p>
                {recentlyEarned.map((badge) => (
                  <div
                    key={badge.code}
                    className="flex items-center justify-between gap-3 rounded-md bg-cream-100 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-butter-300 bg-[#fff2ce] text-[#8a641a]">
                        <BadgeIcon iconKey={badge.iconKey} className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-bark-900">
                          {badge.name[locale]}
                        </p>
                        <p className="mt-0.5 text-xs text-bark-500">
                          {tr("Diraih", "Earned")} {badge.earnedAt ? formatDate(badge.earnedAt, locale) : ""}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-extrabold text-sage-700">
                      {tr("Terbuka", "Unlocked")}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </CozyPanel>
      </div>

      <CozyPanel padded={false} interactive>
        <CozyPanelHeader
          icon={Bell}
          title={tr("Notifikasi terbaru", "Latest notifications")}
          action={
            <Link href={`/${locale}/notifikasi`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {tr("Lihat semua", "View all")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />
        <ul className="divide-y divide-[#e8e2d5]">
          {notifications.slice(0, 3).map((notification) => (
            <li key={notification.id} className={cn("px-5 py-3.5", !notification.isRead && "bg-sage-100/25")}>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 grid size-7 place-items-center rounded-full bg-cream-100 text-bark-700">
                  {notification.isRead ? (
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Bell className="size-3.5" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-bark-900">{notification.title[locale]}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-bark-700">{notification.body[locale]}</p>
                  <p className="mt-1 text-xs text-bark-500">{formatRelative(notification.createdAt, locale)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CozyPanel>
    </div>
  );
}
