"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  FileText,
  FilterX,
  Lightbulb,
  LoaderCircle,
  MessageSquareText,
  Search,
  SearchX,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { reviewSuggestionAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/panacea/status-badge";
import { formatDate } from "@/lib/i18n/format";
import { categoryName } from "@/lib/data/categories";
import type { KBSuggestion } from "@/lib/types";

export function AdminSuggestions({
  suggestions,
  sources,
}: {
  suggestions: KBSuggestion[];
  sources: Array<{ id: string; title: string }>;
}) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState<KBSuggestion | null>(null);
  const [note, setNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return suggestions
      .filter((suggestion) => status === "all" || suggestion.status === status)
      .filter(
        (suggestion) =>
          !normalized ||
          suggestion.title.toLowerCase().includes(normalized) ||
          suggestion.note.toLowerCase().includes(normalized),
      );
  }, [suggestions, query, status]);

  const hasQuery = query.trim().length > 0;
  const noSuggestions = suggestions.length === 0;

  const { page, setPage, pageCount, start, end } = usePagination(visible.length);
  const pageSlice = visible.slice(start, end);

  const pendingCount = suggestions.filter((suggestion) => suggestion.status === "pending").length;

  async function review(action: "approved" | "rejected" | "needs_changes") {
    if (!selected) return;
    setReviewing(true);
    try {
      const result = await reviewSuggestionAction(locale, selected.id, action, note.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSelected(null);
      setNote("");
      toast.success(
        action === "approved"
          ? tr("Saran disetujui. Lanjutkan ingest melalui halaman chunk sumber.", "Suggestion approved. Continue with ingest from the source chunk page.")
          : action === "rejected"
            ? tr("Saran ditolak dan reviewer akan menerima alasan.", "Suggestion rejected; the reviewer will receive the reason.")
            : tr("Saran dikembalikan untuk revisi.", "Suggestion returned for revision."),
      );
      router.refresh();
    } finally {
      setReviewing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Saran KB", "KB suggestions")}
        title={tr("Tinjau usulan reviewer", "Review reviewer suggestions")}
        description={tr(
          "Periksa chunk, kualitas sumber, dan catatan reviewer. Persetujuan tidak otomatis melakukan ingest; admin tetap mengendalikan langkah tersebut.",
          "Check chunks, source quality, and reviewer notes. Approval does not automatically ingest; admins still control that step.",
        )}
        actions={<Badge variant="butter"><MessageSquareText className="size-3.5" aria-hidden="true" />{pendingCount} {tr("menunggu", "pending")}</Badge>}
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={tr("Cari saran reviewer...", "Search reviewer suggestions...")} className="pl-11" aria-label={tr("Cari saran", "Search suggestions")} />
          </div>
          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label={tr("Filter status", "Filter status")} className="md:w-48">
            <option value="all">{tr("Semua status", "All statuses")}</option>
            <option value="pending">{tr("Menunggu", "Pending")}</option>
            <option value="approved">{tr("Disetujui", "Approved")}</option>
            <option value="rejected">{tr("Ditolak", "Rejected")}</option>
            <option value="needs_changes">{tr("Perlu perubahan", "Needs changes")}</option>
          </Select>
        </div>
      </div>

      <p className="text-sm font-semibold text-bark-700">{visible.length} {tr("saran", "suggestions")}</p>

      {visible.length > 0 ? (
        <div className="space-y-3">
          {pageSlice.map((suggestion) => {
            const target = suggestion.targetSourceId ? sources.find((source) => source.id === suggestion.targetSourceId) : undefined;
            const ageDays = suggestion.ageDays ?? 0;
            const needsReminder = suggestion.status === "pending" && ageDays > 14;
            return (
              <article key={suggestion.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={suggestion.status} />
                  <Badge variant="outline"><BookMarked className="size-3" aria-hidden="true" />{target ? tr("Tambahan chunk", "Chunk addition") : tr("Sumber baru", "New source")}</Badge>
                  {suggestion.categorySlug ? <Badge variant="outline">{categoryName(suggestion.categorySlug, locale)}</Badge> : null}
                  {needsReminder ? <Badge variant="rose">{tr("Lewat 14 hari", "Over 14 days")}</Badge> : null}
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-bark-500"><CalendarDays className="size-3" aria-hidden="true" />{formatDate(suggestion.createdAt, locale)}</span>
                </div>
                <h2 className="mt-2 font-heading text-base font-extrabold leading-snug text-bark-900">{suggestion.title}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-bark-500">
                  <span>{suggestion.reviewerAlias}{target ? ` · ${target.title}` : ""}</span>
                  {suggestion.author ? <span>{suggestion.author}{suggestion.year ? ` (${suggestion.year})` : ""}</span> : null}
                  {suggestion.sourceUrl ? (
                    <a href={suggestion.sourceUrl} target="_blank" rel="noreferrer noopener" className="font-bold text-sage-700 hover:underline">{tr("Buka sumber", "Open source")}</a>
                  ) : null}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-bark-700">{suggestion.note}</p>
                <div className="mt-3 rounded-md bg-[#fff7de] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-bark-500"><FileText className="size-3" aria-hidden="true" />{tr("Pratinjau chunk", "Chunk preview")} ({suggestion.chunks.length})</p>
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-bark-700">{suggestion.chunks[0]?.content}</p>
                </div>
                {suggestion.adminNote ? (
                  <p className="mt-2 rounded-md bg-sage-100 p-2.5 text-xs leading-relaxed text-sage-700"><span className="font-bold">{tr("Catatan admin", "Admin note")}:</span> {suggestion.adminNote}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-cream-200 pt-3">
                  <Link href={`/${locale}/reviewer/knowledge-base/saran/${suggestion.id}/chunks`} className="inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline">
                    {tr("Lihat chunk lengkap", "View full chunks")}
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                  <Button variant="secondary" size="sm" onClick={() => { setSelected(suggestion); setNote(suggestion.adminNote ?? ""); }}>
                    {suggestion.status === "pending" ? tr("Tinjau saran", "Review suggestion") : tr("Tinjau ulang", "Review again")}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : noSuggestions ? (
        <EmptyState
          icon={Lightbulb}
          state="none"
          title={tr("Belum ada saran", "No suggestions yet")}
          description={tr("Saran dari reviewer akan muncul di sini untuk ditinjau.", "Suggestions from reviewers will appear here for review.")}
        />
      ) : (
        <EmptyState
          icon={hasQuery ? SearchX : FilterX}
          state="filtered"
          title={tr("Tidak ada saran yang cocok", "No matching suggestions")}
          description={tr("Ubah filter atau kembali nanti saat reviewer mengirim saran baru.", "Adjust the filters or return when reviewers submit new suggestions.")}
          action={<Button variant="secondary" onClick={() => { setStatus("all"); setQuery(""); setPage(1); }}>{tr("Tampilkan semua", "Show all")}</Button>}
        />
      )}

      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected?.title ?? ""}
        description={tr(
          "Tambahkan catatan keputusan. Reviewer menerima notifikasi berisi alasan saat ditolak atau diminta revisi.",
          "Add a decision note. Reviewers receive the reason when rejected or returned for revision.",
        )}
        className="sm:max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)} disabled={reviewing}>{tr("Batal", "Cancel")}</Button>
            <Button variant="destructive" onClick={() => review("rejected")} disabled={reviewing}>
              {reviewing ? <LoaderCircle className="size-4 spin" aria-hidden="true" /> : <XCircle className="size-4" aria-hidden="true" />}
              {tr("Tolak", "Reject")}
            </Button>
            <Button variant="secondary" onClick={() => review("needs_changes")} disabled={reviewing}>
              {reviewing ? <LoaderCircle className="size-4 spin" aria-hidden="true" /> : null}
              {tr("Minta revisi", "Request changes")}
            </Button>
            <Button onClick={() => review("approved")} disabled={reviewing}>
              {reviewing ? <LoaderCircle className="size-4 spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
              {tr("Setujui", "Approve")}
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-3">
            {selected.categorySlug || selected.author || selected.sourceUrl ? (
              <div className="rounded-md bg-[#fff7de] p-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-bark-500">{tr("Metadata sumber", "Source metadata")}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs leading-relaxed text-bark-700">
                  {selected.categorySlug ? <span>{categoryName(selected.categorySlug, locale)}</span> : null}
                  {selected.author ? <span>{selected.author}{selected.year ? ` (${selected.year})` : ""}</span> : null}
                  {selected.sourceUrl ? (
                    <a href={selected.sourceUrl} target="_blank" rel="noreferrer noopener" className="font-bold text-sage-700 hover:underline">{selected.sourceUrl}</a>
                  ) : null}
                </p>
              </div>
            ) : null}
            <div className="rounded-md bg-[#fff7de] p-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-bark-500">{tr("Catatan reviewer", "Reviewer note")}</p>
              <p className="mt-1 text-xs leading-relaxed text-bark-700">{selected.note}</p>
            </div>
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {selected.chunks.map((chunk) => (
                <div key={chunk.id} className="rounded-md border border-cream-200 bg-cream-50 p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{chunk.index + 1}</Badge>
                    <Badge variant="default">{chunk.tokenCount} token</Badge>
                  </div>
                  <p className="mt-1.5 line-clamp-4 text-xs leading-relaxed text-bark-700">{chunk.content}</p>
                </div>
              ))}
            </div>
            <label htmlFor="admin-note" className="text-[13px] font-bold text-bark-700">{tr("Catatan admin", "Admin note")}</label>
            <Textarea id="admin-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder={tr("Alasan keputusan atau instruksi revisi...", "Decision reason or revision instructions...")} className="min-h-24" />
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
