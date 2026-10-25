"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  CircleCheck,
  Clock3,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { KBIngestJob, KBSource } from "@/lib/types";

const jobMeta = {
  queued: { id: "Antrean", en: "Queued", variant: "butter", icon: Clock3 },
  running: { id: "Berjalan", en: "Running", variant: "sky", icon: LoaderCircle },
  succeeded: { id: "Selesai", en: "Succeeded", variant: "sage", icon: CircleCheck },
  failed: { id: "Gagal", en: "Failed", variant: "rose", icon: TriangleAlert },
} as const;

export function IngestJobBadge({ job, className }: { job: KBIngestJob; className?: string }) {
  const { locale } = useI18n();
  const meta = jobMeta[job.status];
  const Icon = meta.icon;

  return (
    <Badge variant={meta.variant} className={className}>
      <Icon className={cn("size-3.5", job.status === "running" && "animate-spin")} aria-hidden="true" />
      {meta[locale]}
    </Badge>
  );
}

export function IngestStatusMark({ source }: { source: KBSource }) {
  const { tr } = useI18n();

  if (source.status === "ingested") {
    return (
      <Badge variant="sage">
        <CircleCheck className="size-3.5" aria-hidden="true" />
        {tr("Sudah ter-ingest", "Ingested")}
      </Badge>
    );
  }

  if (source.latestIngestJob) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <IngestJobBadge job={source.latestIngestJob} />
        <span className="text-xs font-bold text-bark-500">
          {source.latestIngestJob.attempts}/{source.latestIngestJob.maxAttempts}
        </span>
      </div>
    );
  }

  return <Badge variant="outline">{tr("Belum di-ingest", "Not ingested")}</Badge>;
}

function JobSteps({ job }: { job: KBIngestJob }) {
  const { tr } = useI18n();
  const steps = [
    { id: "queued", label: tr("Antrean", "Queued") },
    { id: "embedding", label: tr("Embedding", "Embedding") },
    { id: "done", label: tr("Selesai", "Done") },
  ];
  const current = job.status === "queued" ? 0 : job.status === "running" ? 1 : 2;
  const complete = job.status === "succeeded";
  const failed = job.status === "failed";

  return (
    <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-bold text-bark-500">
      {steps.map((step, index) => {
        const done = complete || index < current;
        const active = index === current && !complete && !failed;
        return (
          <div key={step.id} className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                failed && index === 2
                  ? "bg-rose-700"
                  : done
                    ? "bg-sage-700"
                    : active
                      ? "bg-sage-300"
                      : "bg-cream-200",
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                failed && index === 2
                  ? "text-rose-700"
                  : done
                    ? "text-sage-700"
                    : active
                      ? "text-sage-700"
                      : undefined,
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function IngestJobPanel({ sources }: { sources: KBSource[] }) {
  const { locale, tr } = useI18n();
  const jobs = sources.flatMap((source) =>
    source.latestIngestJob ? [{ source, job: source.latestIngestJob }] : [],
  );
  const counts = { queued: 0, running: 0, succeeded: 0, failed: 0 };
  for (const { job } of jobs) counts[job.status] += 1;
  const ingested = sources.filter((source) => source.status === "ingested").length;
  const total = sources.length;
  const percent = total ? Math.round((ingested / total) * 100) : 0;
  const recentJobs = [...jobs]
    .sort((left, right) => new Date(right.job.updatedAt).getTime() - new Date(left.job.updatedAt).getTime())
    .slice(0, 6);

  return (
    <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-sage-100 text-sage-700">
              <Activity className="size-4" aria-hidden="true" />
            </span>
            <h2 className="font-heading text-base font-extrabold text-bark-900">
              {tr("Visualisasi job ingest", "Ingest job visualisation")}
            </h2>
          </div>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-bark-500">
            {tr(
              "Status job embedding terakhir per sumber. Hanya sumber berstatus ter-ingest yang dipakai pipeline verifikasi.",
              "Latest embedding job per source. Only sources marked ingested are used by the verification pipeline.",
            )}
          </p>
        </div>
        <Badge variant="outline">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {tr("Worker embedding", "Embedding worker")}
        </Badge>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-bark-700">
          <span>{tr(`${ingested} dari ${total} sumber ter-ingest`, `${ingested} of ${total} sources ingested`)}</span>
          <span>{percent}%</span>
        </div>
        <Progress
          className="mt-2"
          value={ingested}
          max={Math.max(total, 1)}
          label={tr("Progres ingest sumber", "Source ingest progress")}
          barClassName={total === 0 ? "bg-cream-200" : undefined}
        />
      </div>

      {recentJobs.length > 0 ? (
        <ul className="mt-4 divide-y divide-[#e8e2d5] border-t border-cream-200">
          {recentJobs.map(({ source, job }) => (
            <li key={job.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/${locale}/admin/knowledge-base/${source.id}/chunks`}
                    className="line-clamp-1 text-xs font-extrabold text-bark-900 hover:text-sage-700 hover:underline"
                  >
                    {source.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-bark-500">
                    {tr("Percobaan", "Attempts")} {job.attempts}/{job.maxAttempts}
                    <span aria-hidden="true"> · </span>
                    {formatDate(job.updatedAt, locale, true)}
                  </p>
                </div>
                <IngestJobBadge job={job} />
              </div>
              <JobSteps job={job} />
              {job.lastError ? (
                <p className="mt-2 line-clamp-2 rounded-md bg-rose-100 px-2.5 py-1.5 text-[11px] leading-relaxed text-rose-700">
                  {job.lastError}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-md border border-cream-200 bg-cream-100 px-3 py-2 text-xs leading-relaxed text-bark-500">
          {tr("Belum ada job ingest.", "No ingest jobs yet.")}
        </p>
      )}
    </section>
  );
}

export function IngestJobCard({ source }: { source: KBSource }) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const job = source.latestIngestJob;
  const ingested = source.status === "ingested";

  return (
    <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-sage-700" aria-hidden="true" />
          <h2 className="font-heading text-sm font-extrabold text-bark-900">
            {tr("Status job ingest", "Ingest job status")}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.refresh()}
          aria-label={tr("Perbarui status", "Refresh status")}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {ingested ? (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-sage-300 bg-sage-100 p-3 text-xs leading-relaxed text-sage-700">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{tr("Sumber sudah ter-ingest dan siap dipakai pipeline.", "Source is ingested and ready for the pipeline.")}</span>
        </div>
      ) : null}

      {job ? (
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-bark-500">Status</span>
            <IngestJobBadge job={job} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-bark-500">{tr("Percobaan", "Attempts")}</span>
            <span className="font-bold text-bark-700">{job.attempts}/{job.maxAttempts}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-bark-500">{tr("Diperbarui", "Updated")}</span>
            <span className="text-right font-bold text-bark-700">{formatDate(job.updatedAt, locale, true)}</span>
          </div>
          {job.status === "queued" ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-bark-500">{tr("Jadwal berikutnya", "Next run")}</span>
              <span className="text-right font-bold text-bark-700">{formatDate(job.runAfter, locale, true)}</span>
            </div>
          ) : null}
          <JobSteps job={job} />
          {job.lastError ? (
            <div className="rounded-md bg-rose-100 p-2.5 text-[11px] leading-relaxed text-rose-700">
              <p className="font-extrabold">{tr("Error terakhir", "Last error")}</p>
              <p className="mt-1 break-words">{job.lastError}</p>
            </div>
          ) : null}
        </div>
      ) : !ingested ? (
        <p className="mt-3 text-xs leading-relaxed text-bark-500">
          {tr("Belum ada job ingest untuk sumber ini.", "No ingest job for this source yet.")}
        </p>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-bark-500">
        {tr(
          "Status diperbarui saat halaman dimuat ulang. Job diproses worker di latar belakang.",
          "Status refreshes when the page reloads. Jobs run in the background worker.",
        )}
      </p>
    </div>
  );
}
