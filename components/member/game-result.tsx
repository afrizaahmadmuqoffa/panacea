"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, CircleCheck, CircleX, Flame, Gamepad2, Star, Trophy } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { GameResultSkeleton } from "@/components/skeletons/member";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/i18n/format";
import type { GameStatement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MemberHero } from "./member-hero";

export function GameResult({ sessionId, statements }: { sessionId: string; statements: GameStatement[] }) {
  const { locale, tr } = useI18n();
  const { gameSessions, profile, badges, hydrated } = usePanacea();
  if (!hydrated) return <GameResultSkeleton />;
  const session = gameSessions.find((item) => item.id === sessionId);

  if (!session) {
    return (
      <EmptyState
        icon={Gamepad2}
        state="none"
        title={tr("Sesi tidak ditemukan", "Session not found")}
        description={tr("Hasil sesi mungkin sudah tidak tersedia. Mulai tantangan baru.", "The session result may be unavailable. Start a new challenge.")}
        action={
          <Link href={`/${locale}/game`} className={buttonVariants()}>
            {tr("Kembali ke lobi", "Back to lobby")}
          </Link>
        }
      />
    );
  }

  const total = session.answers.length;
  const accuracy = total > 0 ? Math.round((session.correctCount / total) * 100) : 0;
  void badges;

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/game`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 transition hover:text-sage-700"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {tr("Kembali ke lobi", "Back to lobby")}
      </Link>

      <MemberHero
        kicker={tr("Sesi selesai", "Session complete")}
        kickerIcon={Star}
        title={
          session.correctCount >= 8
            ? tr("Taman pengetahuanmu tumbuh!", "Your knowledge garden is growing!")
            : session.correctCount >= 5
              ? tr("Bagus, terus eksplorasi.", "Nice work, keep exploring.")
              : tr("Setiap kartu adalah latihan.", "Every card is practice.")
        }
        description={tr(
          `Kamu menjawab ${session.correctCount} dari ${total} kartu dengan benar dan mendapat ${session.xpEarned} poin.`,
          `You answered ${session.correctCount} of ${total} cards correctly and earned ${session.xpEarned} points.`,
        )}
        mascot="gameResult"
        actions={
          <>
            <Link href={`/${locale}/game/mainkan`} className={buttonVariants({ variant: "cozy" })}>
              <Gamepad2 className="size-4" aria-hidden="true" />
              {tr("Main lagi", "Play again")}
            </Link>
            <Link href={`/${locale}/leaderboard`} className={buttonVariants({ variant: "cozySoft" })}>
              <Trophy className="size-4" aria-hidden="true" />
              {tr("Lihat leaderboard", "View leaderboard")}
            </Link>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover">
          <p className="text-[13px] font-bold text-bark-700">{tr("Akurasi", "Accuracy")}</p>
          <p className="mt-2 font-heading text-3xl font-black tracking-[-0.6px] text-bark-900">{accuracy}%</p>
          <Progress value={accuracy} className="mt-3" label={tr("Akurasi sesi", "Session accuracy")} />
        </div>
        <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover">
          <p className="text-[13px] font-bold text-bark-700">{tr("Jawaban benar", "Correct answers")}</p>
          <p className="mt-2 font-heading text-3xl font-black tracking-[-0.6px] text-bark-900">{session.correctCount}/{total}</p>
          <p className="mt-3 text-xs text-bark-500">{tr("Tidak ada pengurangan poin untuk jawaban salah", "No point deduction for wrong answers")}</p>
        </div>
        <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover">
          <p className="text-[13px] font-bold text-bark-700">{tr("Poin sesi", "Session points")}</p>
          <p className="mt-2 font-heading text-3xl font-black tracking-[-0.6px] text-bark-900">+{session.xpEarned}</p>
          <p className="mt-3 text-xs text-bark-500">{tr("Poin hanya dari soal baru, bukan review", "Points come from new statements only, not reviews")}</p>
        </div>
        <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover">
          <p className="text-[13px] font-bold text-bark-700">{tr("Total poin akun", "Account points")}</p>
          <p className="mt-2 font-heading text-3xl font-black tracking-[-0.6px] text-bark-900">{profile.xp.toLocaleString(locale === "id" ? "id-ID" : "en-GB")}</p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs text-bark-500">
            <Flame className="size-3" aria-hidden="true" />
            {profile.streak} {tr("hari streak", "day streak")}
          </p>
        </div>
      </section>

      {null}

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">{tr("Pembahasan jawaban", "Answer explanations")}</h2>
            <p className="mt-0.5 text-xs text-bark-500">{tr("Sumber disediakan untuk setiap pernyataan.", "A source is provided for each statement.")}</p>
          </div>
          <span className="text-xs font-semibold text-bark-500">{formatDate(session.finishedAt, locale)}</span>
        </div>
        <div className="mt-4 space-y-3">
          {session.answers.map((answer, index) => {
            const statement = statements.find((item) => item.id === answer.statementId);
            if (!statement) return null;
            return (
              <article
                key={`${answer.statementId}-${index}`}
                className={cn(
                  "rounded-[18px] border bg-[#fffdf8] p-4 cozy-hover sm:p-5",
                  answer.isCorrect ? "border-sage-300 cozy-shadow-sage" : "border-rose-100 cozy-shadow-rose",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
                      answer.isCorrect ? "bg-sage-100 text-sage-700" : "bg-rose-100 text-rose-700",
                    )}
                  >
                    {answer.isCorrect ? <CircleCheck className="size-4" aria-hidden="true" /> : <CircleX className="size-4" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-extrabold text-bark-500">
                        {tr("Kartu", "Card")} {index + 1}
                      </p>
                      <Badge variant={statement.isFact ? "sage" : "rose"}>
                        {statement.isFact ? tr("Fakta", "Fact") : tr("Hoaks", "Hoax")}
                      </Badge>
                      <Badge variant={answer.isCorrect ? "sage" : "rose"}>
                        {answer.isCorrect ? tr("Benar", "Correct") : tr("Salah", "Wrong")}
                      </Badge>
                      <Badge variant={answer.isReview ? "butter" : "default"}>
                        {answer.isReview ? tr("Review", "Review") : tr("Soal baru", "New statement")}
                      </Badge>
                      <span className="text-xs font-bold text-bark-500">
                        {answer.xpAwarded > 0
                          ? `+${answer.xpAwarded} ${tr("poin", "point")}`
                          : tr("Tanpa poin", "No points")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-extrabold leading-snug text-bark-900">{statement.statement[locale]}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-bark-700">{statement.explanation[locale]}</p>
                    <a
                      href={statement.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline"
                    >
                      <BookOpen className="size-3" aria-hidden="true" />
                      {tr("Baca sumber", "Read source")}
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <p className="text-xs leading-relaxed text-bark-700">
        {tr("Sesi yang ditinggalkan tetap dihitung. Kamu bisa berhenti kapan saja.", "Abandoned sessions still count. You can stop whenever you need.")}
      </p>
    </div>
  );
}
