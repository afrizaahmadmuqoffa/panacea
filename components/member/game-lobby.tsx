"use client";

import Link from "next/link";
import { ArrowRight, Flame, Gamepad2, Star, Trophy } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { GameLobbySkeleton } from "@/components/skeletons/member";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatTile } from "@/components/ui/stat-tile";
import { formatDate } from "@/lib/i18n/format";
import { CozyPanel } from "./cozy-panel";
import { MemberHero } from "./member-hero";

export function GameLobby() {
  const { locale, tr } = useI18n();
  const { profile, gameSessions, badges, gameProgress, hydrated } = usePanacea();
  if (!hydrated) return <GameLobbySkeleton />;
  const lastSession = gameSessions[0];
  const sessionsToday = gameProgress.sessionsToday;
  const sessionsPerDay = gameProgress.sessionsPerDay;
  const sessionsLeft = Math.max(0, sessionsPerDay - sessionsToday);
  const hasQuestions = gameProgress.newAvailable + gameProgress.dueReviews > 0;
  const bestScore = Math.max(...gameSessions.map((session) => session.correctCount), 0);
  const streakBadge = badges.find((badge) => badge.code === "streak-star");

  return (
    <div className="space-y-6">
      <MemberHero
        kicker={tr("Debunk game", "Debunk game")}
        kickerIcon={Gamepad2}
        title={tr("Latih literasimu dengan main game", "Train your literacy skills by playing games")}
        description={tr(
          "Sebuah permainan dimana kamu tinggal geser kanan untuk jawab fakta dan geser kiri untuk jawab hoaks.",
          "A game where you simply swipe right to identify a fact and swipe left to identify a hoax.",
        )}
        mascot="game"
        actions={
          <>
            {sessionsLeft > 0 && hasQuestions ? (
              <Link href={`/${locale}/game/mainkan`} className={buttonVariants({ variant: "cozy", size: "lg" })}>
                <Gamepad2 className="size-4" aria-hidden="true" />
                {tr("Mulai Tantangan", "Start Challenge")}
              </Link>
            ) : (
              <span className="rounded-full border border-[#e8e2d5] bg-white/80 px-4 py-2.5 text-xs font-bold text-bark-700 shadow-[0_3px_0_rgb(232_226_213/0.7)]">
                {sessionsLeft === 0
                  ? tr("Kuota hari ini habis", "Today's quota is used up")
                  : tr("Belum ada soal yang tersedia", "No statements available yet")}
              </span>
            )}
            <span className="text-xs font-semibold text-bark-500">
              {sessionsToday}/{sessionsPerDay} {tr("sesi hari ini", "sessions today")}
            </span>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile variant="cozy" interactive label={tr("Total poin", "Total points")} value={profile.xp.toLocaleString(locale === "id" ? "id-ID" : "en-GB")} hint={tr("Satu soal satu poin", "One statement, one point")} icon={Trophy} tone="butter" />
        <StatTile variant="cozy" interactive label={tr("Streak saat ini", "Current streak")} value={`${profile.streak} ${tr("hari", "days")}`} hint={tr("Bertambah dengan satu sesi", "Increases with one session")}           icon={Flame} tone="butter" />
        <StatTile variant="cozy" interactive label={tr("Skor terbaik", "Best score")} value={`${bestScore}/${gameProgress.questionsPerSession}`} hint={tr("Kartu benar per sesi", "Correct cards per session")} icon={Star} tone="sage" />
        <StatTile
          variant="cozy"
          interactive
          label={tr("Sesi tersisa", "Sessions left")}
          value={sessionsLeft}
          hint={tr(
            `${gameProgress.newAvailable} soal baru · ${gameProgress.dueReviews} review`,
            `${gameProgress.newAvailable} new · ${gameProgress.dueReviews} review`,
          )}
          icon={Gamepad2}
          tone="sage"
        />
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {lastSession ? (
          <CozyPanel interactive>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">{tr("Hasil terakhir", "Latest result")}</h2>
              <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-extrabold text-sage-700">
                {lastSession.correctCount}/{gameProgress.questionsPerSession}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-bark-700">
              {tr(
                `Kamu mendapat ${lastSession.xpEarned} poin pada sesi ${formatDate(lastSession.finishedAt, locale)}.`,
                `You earned ${lastSession.xpEarned} points in the session on ${formatDate(lastSession.finishedAt, locale)}.`,
              )}
            </p>
            <Link href={`/${locale}/game/hasil/${lastSession.id}`} className={buttonVariants({ variant: "cozySoft", size: "sm", className: "mt-4" })}>
              {tr("Lihat pembahasan", "View explanations")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </CozyPanel>
        ) : null}

        {streakBadge ? (
          <CozyPanel shadow="butter" interactive className="border-butter-300 bg-[#fff7de]">
            <div className="flex items-center gap-2 text-[#8a641a]">
              <Flame className="size-4" aria-hidden="true" />
              <p className="text-xs font-extrabold uppercase tracking-[0.12em]">{tr("Progres streak", "Streak progress")}</p>
            </div>
            <p className="mt-2 font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">{streakBadge.name[locale]}</p>
            <Progress value={streakBadge.progress} max={streakBadge.threshold} className="mt-3" label={streakBadge.name[locale]} />
            <p className="mt-1.5 text-xs text-[#7c5c17]">
              {streakBadge.progress}/{streakBadge.threshold} {tr("hari", "days")}
            </p>
            <Link href={`/${locale}/badge`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline">
              {tr("Lihat semua badge", "See all badges")}
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </CozyPanel>
        ) : null}
      </div>
    </div>
  );
}
