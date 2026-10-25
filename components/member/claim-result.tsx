"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BotMessageSquare,
  CalendarDays,
  CircleAlert,
  FileQuestion,
  Globe2,
  Info,
  LoaderCircle,
  MessagesSquare,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { retryClaimAction } from "@/lib/actions/member";
import { ClaimResultSkeleton } from "@/components/skeletons/member";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EvidenceList } from "@/components/panacea/evidence-list";
import { AnalysisLoader } from "@/components/member/analysis-loader";
import { waitForClaimOutcome } from "@/components/member/wait-for-claim";
import { NewThreadDialog } from "@/components/member/new-thread-dialog";
import { ReportDialog } from "@/components/member/report-dialog";
import { PendingBadge, VerdictBadge } from "@/components/panacea/verdict-badge";
import { StatusBadge } from "@/components/panacea/status-badge";
import { formatDate } from "@/lib/i18n/format";
import type { Confidence } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";

export function ClaimResult({ id, locale: localeProp }: { id: string; locale: string }) {
  const { locale: contextLocale, tr } = useI18n();
  const locale = (contextLocale ?? localeProp) as Locale;
  const { hydrated, findClaim, refresh } = usePanacea();
  const claim = findClaim(id);
  const analysis = claim?.analysis;
  const [looking, setLooking] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const lookedUp = useRef(false);
  const inProgress =
    claim?.status === "analyzing" ||
    claim?.status === "queued" ||
    analysis?.status === "running" ||
    analysis?.status === "queued";

  useEffect(() => {
    if (!inProgress) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [inProgress, refresh]);

  useEffect(() => {
    if (!hydrated || claim || lookedUp.current) return;
    lookedUp.current = true;
    setLooking(true);
    void refresh().finally(() => setLooking(false));
  }, [claim, hydrated, refresh]);

  async function handleRetry() {
    setRetrying(true);
    try {
      const result = await retryClaimAction(locale, id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const outcome = await waitForClaimOutcome(refresh, id);
      if (outcome === "succeeded") {
        toast.success(
          tr("Analisis ulang selesai.", "The retry analysis finished."),
        );
      } else if (outcome === "failed") {
        toast.error(
          tr("Analisis ulang gagal.", "The retry analysis failed."),
        );
      } else {
        toast.info(
          tr(
            "Analisis masih berjalan di server. Cek lagi sebentar lagi.",
            "The analysis is still running on the server. Check again shortly.",
          ),
        );
      }
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : tr("Analisis ulang gagal.", "The retry analysis failed."),
      );
    } finally {
      setRetrying(false);
      await refresh();
    }
  }

  if (!hydrated || looking) return <ClaimResultSkeleton />;


  if (!claim) {
    return (
      <EmptyState
        icon={FileQuestion}
        state="none"
        title={tr("Klaim tidak ditemukan", "Claim not found")}
        description={tr(
          "Klaim ini tidak ada di akunmu atau sudah tidak tersedia. Mulai pemeriksaan baru.",
          "This claim is not in your account or is no longer available. Start a new check.",
        )}
        action={
          <Link href={`/${locale}/cek-klaim`} className={buttonVariants({ variant: "cozy" })}>
            {tr("Cek klaim baru", "Check a new claim")}
          </Link>
        }
      />
    );
  }

  const failed = claim.status === "analysis_failed" || analysis?.status === "failed";
  const confidenceLabels: Record<Confidence, { id: string; en: string }> = {
    low: { id: "Rendah", en: "Low" },
    medium: { id: "Sedang", en: "Medium" },
    high: { id: "Tinggi", en: "High" },
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/${locale}/riwayat-klaim`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 transition hover:text-sage-700"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {tr("Riwayat klaim", "Claim history")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={claim.status} palette="warm" />
            <Badge variant="sage">
              <BotMessageSquare className="size-3.5" aria-hidden="true" />
              {tr("Analisis awal AI", "Initial AI analysis")}
            </Badge>
            {claim.reportStatus ? <StatusBadge status={claim.reportStatus} palette="warm" /> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {claim.reportStatus ? null : (
              <ReportDialog claimId={claim.id} className={buttonVariants({ variant: "cozy", size: "sm" })} />
            )}
            <NewThreadDialog
              initialClaimId={claim.id}
              className={buttonVariants({ variant: "cozySoft", size: "sm" })}
            >
              <MessagesSquare className="size-3.5" aria-hidden="true" />
              {tr("Buat Diskusi", "Start a Discussion")}
            </NewThreadDialog>
          </div>
        </div>
      </div>

      <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-bark-500">
          {tr("Klaim yang diperiksa", "Claim under review")}
        </p>
        <h1 className="mt-2 max-w-3xl font-heading text-[21px] font-black tracking-[-0.45px] leading-snug text-bark-900 sm:text-2xl">
          {claim.originalText}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-bark-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {formatDate(claim.createdAt, locale, true)}
          </span>
          <span className="capitalize">{claim.inputType}</span>
          <span>{claim.language.toUpperCase()}</span>
          {claim.sourceUrl ? (
            <a href={claim.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sage-700 hover:underline">
              <Globe2 className="size-3.5" aria-hidden="true" />
              {tr("Sumber artikel", "Article source")}
            </a>
          ) : null}
          {claim.imageName ? <span className="truncate">{claim.imageName}</span> : null}
        </div>
      </section>

      {claim.reviewerFeedSlug ? (
        <section className="rounded-[22px] border border-sage-300 bg-sage-100 p-5 cozy-shadow-sage cozy-hover sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Stethoscope className="mt-0.5 size-5 shrink-0 text-sage-700" aria-hidden="true" />
              <div>
                <p className="font-heading text-base font-extrabold text-bark-900">
                  {tr("Hasil analisis reviewer sudah tersedia", "The expert review is available")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-bark-700">
                  {tr(
                    "Klaim ini sudah ditinjau dan dipublikasikan. Buka hasil reviewer, bukan analisis awal AI.",
                    "This claim has been reviewed. Open the expert result instead of the initial AI analysis.",
                  )}
                </p>
              </div>
            </div>
            <Link
              href={`/${locale}/feed-terverifikasi/${claim.reviewerFeedSlug}`}
              className={buttonVariants({ size: "sm" })}
            >
              {tr("Lihat hasil reviewer", "View expert result")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : null}

      {inProgress ? (
        <section className="rounded-[22px] border border-butter-300 bg-[#fff7de] p-6 cozy-shadow-butter cozy-hover sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="grid size-14 place-items-center rounded-full bg-white text-[#8a641a] shadow-soft">
              <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
            </span>
            <div>
              <PendingBadge kind="analysis" palette="warm" />
              <h2 className="mt-2 font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">
                {tr("Kami sedang menelusuri bukti yang relevan.", "We are searching for relevant evidence.")}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-bark-700">
                {tr(
                  "Klaim sudah tersimpan. Analisis akan muncul otomatis; kamu dapat kembali ke halaman ini nanti.",
                  "Your claim is saved. The analysis will appear automatically; you can return to this page later.",
                )}
              </p>
            </div>
          </div>
          <p className="mt-5 rounded-[14px] bg-white/70 p-3 text-xs leading-relaxed text-bark-700">
            {tr(
              "Antrean analisis dapat memerlukan beberapa menit. Halaman ini memeriksa status secara berkala.",
              "The analysis queue can take a few minutes. This page checks the status periodically.",
            )}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => void refresh()}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {tr("Muat ulang status", "Refresh status")}
          </Button>
        </section>
      ) : null}

      {failed ? (
        <section className="rounded-[22px] border border-rose-100 bg-rose-100 p-5 cozy-shadow-rose cozy-hover sm:p-6">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-rose-700" aria-hidden="true" />
            <div>
              <h2 className="font-heading text-[21px] font-black tracking-[-0.45px] text-rose-700">
                {tr("Analisis belum berhasil diselesaikan", "Analysis could not be completed")}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#7a3734]">
                {tr(
                  "Sumber ilmiah sedang sulit diakses. Klaim tetap tersimpan dan percobaan ulang tidak akan membuat duplikat.",
                  "Scientific sources are temporarily difficult to reach. Your claim is saved and retrying will not create duplicates.",
                )}
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3"
                disabled={retrying}
                onClick={() => void handleRetry()}
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                {tr("Coba analisis ulang", "Retry analysis")}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {analysis?.status === "succeeded" && analysis.verdict ? (
        <>
          <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <VerdictBadge verdict={analysis.verdict} size="lg" palette="warm" />
                <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.14em] text-bark-500">
                  {tr("Tingkat keyakinan AI", "AI confidence level")}
                </p>
                <p className="mt-1 text-sm font-bold text-bark-900">
                  {analysis.confidence ? confidenceLabels[analysis.confidence][locale] : "-"}
                </p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-bark-500">
                  {tr(
                    "Estimasi kualitatif, bukan probabilitas terkalibrasi.",
                    "A qualitative estimate, not a calibrated probability.",
                  )}
                </p>
              </div>
              <div className="rounded-[14px] bg-white/70 px-3 py-2 text-right shadow-[inset_0_-2px_0_rgb(61_73_63/0.05)]">
                <p className="text-xs font-bold uppercase tracking-wide text-bark-500">{tr("Dianalisis", "Analysed")}</p>
                <p className="mt-0.5 text-xs font-extrabold text-bark-900">
                  {analysis.analyzedAt ? formatDate(analysis.analyzedAt, locale, true) : "-"}
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-bark-900" lang={locale}>{analysis.summary[locale]}</p>
          </section>

            <section className="rounded-[18px] border border-[#e8e2d5] bg-cream-100/70 p-4">
              <h2 className="font-heading text-sm font-extrabold text-bark-900">
                {tr("Batasan bukti", "Evidence limitations")}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-bark-700" lang={locale}>
                {analysis.limitations[locale]}
              </p>
            </section>

            <div className="space-y-5">
              <section>
                <div className="flex items-end justify-between gap-3">
                  <h2 className="font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">
                    {tr("Bukti yang digunakan", "Evidence used")}
                  </h2>
                  <span className="text-xs font-semibold text-bark-500">
                    {analysis.evidence.length} {tr("sumber", "sources")}
                  </span>
                </div>
                <div className="mt-3">
                  <EvidenceList evidence={analysis.evidence} />
                </div>
              </section>

              <div className="flex gap-3 rounded-[18px] border border-[#eae5d9] bg-cream-100 p-4 text-sm leading-relaxed text-bark-700">
                <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-bold">{tr("Bukan diagnosis atau nasihat medis", "Not a diagnosis or medical advice")}</p>
                  <p className="mt-1">
                    {tr(
                      "Hasil ini adalah analisis awal AI. Untuk keputusan pengobatan, konsultasikan dengan tenaga kesehatan.",
                      "This is an initial AI analysis. For treatment decisions, consult a health professional.",
                    )}
                  </p>
                </div>
              </div>
            </div>
        </>
      ) : null}

      {retrying ? <AnalysisLoader /> : null}
    </div>
  );
}
