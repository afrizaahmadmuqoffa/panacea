"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CircleCheck,
  CircleX,
  Flame,
  Leaf,
  LoaderCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { motion, type PanInfo } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { GameArenaSkeleton } from "@/components/skeletons/member";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { finishGameAction, startGameAction } from "@/lib/actions/member";
import { categoryName } from "@/lib/data/categories";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  statement: string;
  statementEn: string;
  categorySlug: string;
  isReview: boolean;
  imageUrl?: string | null;
};

type Feedback = {
  guessIsFact: boolean;
  correct: boolean;
  xpAwarded: number;
  isReview: boolean;
  nextReviewAt: string;
  correctAnswerIsFact: boolean;
  explanation: string;
  sourceUrl: string;
  pending?: boolean;
};

export function GameArena() {
  const { locale, tr } = useI18n();
  const { refresh } = usePanacea();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadError, setLoadError] = useState("");
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [answering, setAnswering] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const startedRef = useRef(false);
  const pendingRef = useRef<Map<string, Promise<void>>>(new Map());
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startGameAction(locale)
      .then((result) => {
        if (result.error || !result.session) {
          setLoadError(result.error ?? tr("Sesi game tidak dapat dimulai.", "The game session could not start."));
          return;
        }
        const nextQuestions = (result.session.questions ?? []) as Question[];
        if (nextQuestions.length === 0) {
          setLoadError(tr("Belum ada soal aktif untuk dimainkan.", "No active statements are available to play."));
          return;
        }
        setSessionId(result.session.sessionId);
        setQuestions(nextQuestions);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : tr("Sesi game tidak dapat dimulai.", "The game session could not start."));
      });
  }, [locale, tr]);

  const statement = questions[index];
  const answered = feedback !== null;
  const finished = questions.length > 0 && index === questions.length - 1;

  async function answer(answerIsFact: boolean) {
    if (!sessionId || !statement || answered || answering) return;
    setAnswering(true);
    setFeedback({
      guessIsFact: answerIsFact,
      correct: false,
      xpAwarded: 0,
      isReview: statement.isReview,
      nextReviewAt: "",
      correctAnswerIsFact: answerIsFact,
      explanation: "",
      sourceUrl: "",
      pending: true,
    });

    const task = (async () => {
      const { data, error } = await supabase.rpc("submit_game_answer", {
        p_session_id: sessionId,
        p_statement_id: statement.id,
        p_answer_is_fact: answerIsFact,
      });

      if (error) {
        toast.error(tr("Jawaban gagal dikirim.", "The answer could not be sent."));
        setFeedback((prev) => (prev && prev.guessIsFact === answerIsFact ? null : prev));
        return;
      }

      const result = data as Record<string, unknown> | null;
      if (!result) {
        toast.error(tr("Jawaban gagal dikirim.", "The answer could not be sent."));
        setFeedback((prev) => (prev && prev.guessIsFact === answerIsFact ? null : prev));
        return;
      }

      const correct = Boolean(result.isCorrect);
      const awarded = Number(result.xpAwarded ?? result.pointsAwarded ?? 0);
      const nextFeedback: Feedback = {
        guessIsFact: answerIsFact,
        correct,
        xpAwarded: awarded,
        isReview: Boolean(result.isReview),
        nextReviewAt: String(result.nextReviewAt ?? ""),
        correctAnswerIsFact: Boolean(result.isFact),
        explanation: String(locale === "en" ? result.explanationEn ?? "" : result.explanationId ?? ""),
        sourceUrl: String(result.sourceUrl ?? ""),
        pending: false,
      };

      setFeedback((prev) => {
        if (!prev) return prev;
        if (prev.guessIsFact !== answerIsFact) return prev;
        return nextFeedback;
      });
      if (correct) setCorrectCount((value) => value + 1);
      if (awarded > 0) setXp((value) => value + awarded);
    })();

    pendingRef.current.set(statement.id, task);
    void task.finally(() => {
      pendingRef.current.delete(statement.id);
      setAnswering(false);
    });
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (answered || answering) return;
    if (info.offset.x > 80 || info.velocity.x > 500) void answer(true);
    else if (info.offset.x < -80 || info.velocity.x < -500) void answer(false);
  }

  async function next() {
    if (feedback?.pending) return;
    if (!finished) {
      setIndex((value) => value + 1);
      setFeedback(null);
      return;
    }
    if (!sessionId) return;
    if (pendingRef.current.size > 0) {
      await Promise.allSettled(Array.from(pendingRef.current.values()));
    }
    setFinishing(true);
    const result = await finishGameAction(locale, sessionId);
    setFinishing(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await refresh();
    router.push(`/${locale}/game/hasil/${sessionId}`);
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl rounded-[22px] border border-rose-100 bg-rose-100 p-6 cozy-shadow-rose">
        <h1 className="font-heading text-[21px] font-black tracking-[-0.45px] text-rose-700">
          {tr("Game belum bisa dimulai", "The game could not start")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#7a3734]">{loadError}</p>
        <Link href={`/${locale}/game`} className="mt-4 inline-flex text-sm font-bold text-sage-700 hover:underline">
          {tr("Kembali ke lobi game", "Back to the game lobby")}
        </Link>
      </div>
    );
  }

  if (!statement) {
    return <GameArenaSkeleton />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/${locale}/game`} className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 transition hover:text-sage-700">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {tr("Keluar sesi", "Exit session")}
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="butter">
            <Flame className="size-3.5" aria-hidden="true" />
            {xp} {tr("poin", "points")}
          </Badge>
          <Badge variant="sage">
            <Trophy className="size-3.5" aria-hidden="true" />
            {correctCount} {tr("benar", "correct")}
          </Badge>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-bold text-bark-700">
          <span>
            {tr("Kartu", "Card")} {index + 1} / {questions.length}
          </span>
          <span>{Math.round(((index + (answered ? 1 : 0)) / questions.length) * 100)}%</span>
        </div>
        <Progress value={index + (answered ? 1 : 0)} max={questions.length} className="mt-2" label={tr("Progres sesi", "Session progress")} />
      </div>

      <div className="relative mt-6">
        <div className={cn("pointer-events-none absolute top-1/2 left-0 hidden -translate-x-[120%] -translate-y-1/2 items-center gap-2 sm:flex", answered && "opacity-40")}>
          <span className="grid size-10 place-items-center rounded-full border border-rose-200 bg-rose-100 text-rose-700 shadow-soft">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </span>
          <span className="text-xs font-extrabold tracking-[0.2em] text-rose-700">HOAKS</span>
        </div>
        <div className={cn("pointer-events-none absolute top-1/2 right-0 hidden translate-x-[120%] -translate-y-1/2 items-center gap-2 sm:flex", answered && "opacity-40")}>
          <span className="text-xs font-extrabold tracking-[0.2em] text-sage-700">FAKTA</span>
          <span className="grid size-10 place-items-center rounded-full border border-sage-300 bg-sage-100 text-sage-700 shadow-soft">
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </div>

        <motion.div
          key={statement.id}
          drag={answered ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          onDragEnd={onDragEnd}
          animate={answered ? { x: feedback?.guessIsFact ? 16 : -16, rotate: feedback?.guessIsFact ? 1.5 : -1.5, opacity: 1 } : { x: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="relative mx-auto max-w-[490px] rounded-[26px] border border-[#eae5d9] bg-[#fffdf8] overflow-hidden shadow-[0_15px_34px_rgb(92_113_65/0.1)]"
        >
          <div className="flex items-center justify-between gap-2 p-5 pb-0 sm:px-7 sm:pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid size-7 place-items-center rounded-[10px] bg-butter-300/70 text-[#8a641a] font-heading text-xs font-black">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Badge variant="default">{categoryName(statement.categorySlug, locale)}</Badge>
              <Badge variant={statement.isReview ? "butter" : "sage"}>
                {statement.isReview ? tr("Review", "Review") : tr("Soal baru", "New statement")}
              </Badge>
            </div>
          </div>

          <div className="relative mt-4 mx-5 sm:mx-7 h-[120px] sm:h-[150px] overflow-hidden rounded-[16px] border border-[#e8e2d5]">
            {statement.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={statement.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(125deg,#f0f5e3,#fdf2d5_62%,#fae5d6)]" />
                <div className="pointer-events-none absolute -left-[20%] -bottom-[48px] h-[95px] w-[90%] rounded-[50%] bg-[#cedfb5]" />
                <div className="pointer-events-none absolute left-[30%] -bottom-[61px] h-[95px] w-[90%] rounded-[50%] bg-[#9cc68c]" />
                <div className="pointer-events-none absolute top-[23px] right-[18%] h-[14px] w-[50px] rounded-full bg-[#fffdf5b8]">
                  <span className="absolute -bottom-[3px] left-[9px] h-[17px] w-[17px] rounded-full bg-inherit" />
                  <span className="absolute -bottom-[3px] left-[25px] h-[15px] w-[15px] rounded-full bg-inherit" />
                </div>
                <div className="pointer-events-none absolute left-1/2 bottom-[15px] grid size-[58px] -translate-x-1/2 place-items-center rounded-[6px_11px_8px_6px] bg-[linear-gradient(90deg,#628a61_0_48%,#81a574_48%)] text-[#f4efd9] shadow-[0_7px_0_#4d6d4b] rotate-[-7deg]">
                  <BookOpen className="size-7" />
                </div>
                <Leaf className="pointer-events-none absolute left-[calc(50%+35px)] bottom-[48px] size-6 text-[#709a62] animate-[cozy-leaf-sway_3.6s_ease-in-out_infinite_alternate]" />
                <Sparkles className="pointer-events-none absolute left-[25%] top-[23px] size-5 text-[#d6b25b] animate-[cozy-bob_3s_ease-in-out_infinite]" />
                <Sparkles className="pointer-events-none absolute right-[24%] bottom-[23px] size-[18px] text-[#d6b25b] animate-[cozy-bob_3s_ease-in-out_infinite_1.2s]" />
              </>
            )}
          </div>

          <div className="px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
            <span className="text-[9px] font-extrabold uppercase tracking-[1.2px] text-bark-500">
              {tr("PERNYATAAN", "STATEMENT")}
            </span>
            <p className="mt-2 font-heading text-[19px] font-black tracking-[-0.25px] leading-snug text-bark-900 sm:text-[21px]">
              {locale === "en" ? statement.statementEn : statement.statement}
            </p>
            {!answered ? (
              <p className="mt-2 text-xs text-bark-500">
                {tr("Menurutmu, apakah pernyataan ini fakta atau hoaks?", "Is this statement a fact or a hoax?")}
              </p>
            ) : null}
          </div>

          {answered ? (
            <div
              aria-live="polite"
              className={cn(
                "mx-5 mb-5 rounded-[18px] border p-4 sm:mx-7 sm:mb-7",
                feedback.correct ? "border-sage-300 bg-sage-100" : "border-rose-100 bg-rose-100",
              )}
            >
              {feedback.pending ? (
                <div className="flex items-center gap-2 text-sm font-bold text-bark-700">
                  <LoaderCircle className="size-4 animate-spin text-sage-700" aria-hidden="true" />
                  {tr("Memeriksa bukti...", "Checking evidence...")}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {feedback.correct ? (
                      <CircleCheck className="size-5 text-sage-700" aria-hidden="true" />
                    ) : (
                      <CircleX className="size-5 text-rose-700" aria-hidden="true" />
                    )}
                    <p className={cn("font-heading text-base font-extrabold", feedback.correct ? "text-sage-700" : "text-rose-700")}>
                      {feedback.correct ? tr("Tepat!", "Correct!") : tr("Belum tepat", "Not quite")}
                    </p>
                    <Badge variant={feedback.correct ? "sage" : "rose"} className="ml-auto">
                      {feedback.xpAwarded > 0
                        ? `+${feedback.xpAwarded} ${tr("poin", "points")}`
                        : tr("Tanpa poin", "No points")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-bark-700">{feedback.explanation}</p>
                  <p className="mt-1.5 text-xs font-semibold text-bark-500">
                    {feedback.correct
                      ? tr("Soal ini muncul lagi dalam 30 hari sebagai penyegaran ingatan.", "This statement comes back in 30 days as a memory refresh.")
                      : tr("Soal ini akan muncul lagi besok sampai kamu menjawabnya dengan benar.", "This statement will come back tomorrow until you answer it correctly.")}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    {feedback.sourceUrl ? (
                      <a
                        href={feedback.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline"
                      >
                        {tr("Buka sumber", "Open source")}
                        <ArrowRight className="size-3 rotate-[-45deg]" aria-hidden="true" />
                      </a>
                    ) : <span />}
                    <span className="text-xs font-semibold text-bark-500">
                      {tr("Jawaban benar", "Correct answer")}: {feedback.correctAnswerIsFact ? tr("Fakta", "Fact") : tr("Hoaks", "Hoax")}
                    </span>
                  </div>
                  <Button variant="cozy" onClick={() => void next()} fullWidth className="mt-3" disabled={finishing || feedback.pending}>
                    {finishing ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : finished ? <Trophy className="size-4" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
                    {finished ? tr("Lihat hasil sesi", "View session result") : tr("Kartu berikutnya", "Next card")}
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </motion.div>
      </div>

      {!answered ? (
        <div className="mx-auto mt-5 flex max-w-[490px] items-center justify-center gap-3">
          <button
            type="button"
            disabled={answering}
            onClick={() => void answer(false)}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[15px] border border-rose-200 bg-rose-100 px-5 text-sm font-extrabold text-rose-700 shadow-[0_4px_0_#d68c7d] transition hover:-translate-y-1 hover:bg-rose-50 active:translate-y-[1px] active:shadow-[0_2px_0_#d68c7d] disabled:opacity-60"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {tr("Hoaks", "Hoax")}
          </button>
          <span className="text-xs font-semibold text-bark-500">{tr("atau", "or")}</span>
          <button
            type="button"
            disabled={answering}
            onClick={() => void answer(true)}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[15px] border border-sage-300 bg-sage-100 px-5 text-sm font-extrabold text-sage-700 shadow-[0_4px_0_#aecb9d] transition hover:-translate-y-1 hover:bg-[#f1f6eb] active:translate-y-[1px] active:shadow-[0_2px_0_#aecb9d] disabled:opacity-60"
          >
            {tr("Fakta", "Fact")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
