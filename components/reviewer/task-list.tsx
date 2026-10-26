"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CircleAlert,
  ClipboardCheck,
  FilterX,
  Search,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/panacea/status-badge";
import { VerdictBadge } from "@/components/panacea/verdict-badge";
import { categoryName } from "@/lib/data/categories";
import { formatDate } from "@/lib/i18n/format";
import type { Category, ReviewerTask } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReviewerTaskList({
  tasks,
  categories,
}: {
  tasks: ReviewerTask[];
  categories: Category[];
}) {
  const { locale, tr } = useI18n();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks
      .filter((task) => status === "all" || task.status === status)
      .filter((task) => category === "all" || task.categorySlug === category)
      .filter(
        (task) =>
          !normalized ||
          task.claimTitle.toLowerCase().includes(normalized) ||
          task.claimText.toLowerCase().includes(normalized),
      )
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }, [tasks, query, status, category]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || status !== "all" || category !== "all";
  const { page, setPage, pageCount, start, end } = usePagination(visible.length);
  const pageSlice = visible.slice(start, end);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Tugas review", "Review tasks")}
        title={tr("Kasus yang ditugaskan kepadamu", "Cases assigned to you")}
        description={tr(
          "Setiap kasus cocok dengan kategori keahlianmu. Identitas pelapor tidak ditampilkan; alasan laporan hanya untuk konteks penilaian.",
          "Each case matches your expertise. Reporter identity is hidden; the report reason is for assessment context only.",
        )}
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder={tr("Cari klaim atau kasus...", "Search claims or cases...")}
              className="pl-11"
              aria-label={tr("Cari tugas", "Search tasks")}
            />
          </div>
          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label={tr("Filter status", "Filter status")} className="md:w-52">
            <option value="all">{tr("Semua status", "All statuses")}</option>
            <option value="assigned">{tr("Ditugaskan", "Assigned")}</option>
            <option value="opened">{tr("Dibuka", "Opened")}</option>
            <option value="submitted_primary">{tr("Sudah diputuskan", "Submitted")}</option>
            <option value="submitted_supplemental">{tr("Opini tambahan", "Supplemental")}</option>
          </Select>
          <Select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} aria-label={tr("Filter kategori", "Filter category")} className="md:w-56">
            <option value="all">{tr("Semua kategori", "All categories")}</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>{item.name[locale]}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-bark-700">
          {visible.length} {tr("tugas", "tasks")}
        </p>
        <Badge variant="sky">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {tr("Review independen", "Independent review")}
        </Badge>
      </div>

      {visible.length > 0 ? (
        <>
        <div className="space-y-3">
          {pageSlice.map((task) => (
            <article key={task.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={task.priority === "high" ? "rose" : "default"}>
                  {task.priority === "high" ? tr("Prioritas tinggi", "High priority") : tr("Normal", "Normal")}
                </Badge>
                <Badge variant="outline">{categoryName(task.categorySlug, locale)}</Badge>
                <StatusBadge status={task.status} />
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-bark-500">
                  <CalendarDays className="size-3" aria-hidden="true" />
                  {formatDate(task.assignedAt, locale)}
                </span>
              </div>
              <h2 className="mt-2 font-heading text-lg font-extrabold leading-snug text-bark-900">{task.claimTitle}</h2>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-bark-700">{task.claimText}</p>
              <div className="mt-3 rounded-md border border-[#eae5d9] bg-[#fffdf8] p-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-bark-500">{tr("Alasan laporan", "Report reason")}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-bark-700">{task.reporterReason}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-cream-200 pt-3">
                <span className="text-xs font-extrabold uppercase tracking-wide text-bark-500">{tr("Analisis AI", "AI analysis")}</span>
                <VerdictBadge verdict={task.aiVerdict} size="sm" />
                <span className="inline-flex items-center gap-1 text-xs text-bark-500">
                  <BookOpenCheck className="size-3.5" aria-hidden="true" />
                  {task.evidence.length} {tr("bukti", "evidence")}
                </span>
                {task.alreadyReviewed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-sage-700">
                    <CircleAlert className="size-3.5" aria-hidden="true" />
                    {tr("Putusan sudah dikirim", "Verdict already submitted")}
                  </span>
                ) : null}
                <Link
                  href={`/${locale}/reviewer/tugas/${task.id}`}
                  className={cn(buttonVariants({ size: "sm", variant: task.alreadyReviewed ? "secondary" : "primary" }), "ml-auto")}
                >
                  {task.alreadyReviewed ? tr("Lihat putusan", "View verdict") : tr("Tinjau kasus", "Review case")}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      ) : isFiltered ? (
        <EmptyState
          icon={hasQuery ? SearchX : FilterX}
          state="filtered"
          title={tr("Tidak ada tugas yang cocok", "No matching tasks")}
          description={tr("Ubah filter atau kembali nanti saat ada kasus baru.", "Adjust the filters or return later when new cases arrive.")}
          action={
            <button
              type="button"
              className={buttonVariants({ variant: "secondary" })}
              onClick={() => { setQuery(""); setStatus("all"); setCategory("all");; setPage(1) }}
            >
              {tr("Hapus filter", "Clear filters")}
            </button>
          }
        />
      ) : (
        <EmptyState
          icon={ClipboardCheck}
          state="none"
          title={tr("Belum ada tugas review", "No review tasks yet")}
          description={tr("Klaim yang perlu ditinjau akan masuk ke daftar ini.", "Claims that need review will appear in this list.")}
        />
      )}
    </div>
  );
}
