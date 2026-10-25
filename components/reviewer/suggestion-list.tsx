"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Clock3,
  FileText,
  FilterX,
  Lightbulb,
  Search,
  SearchX,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusBadge } from "@/components/panacea/status-badge";
import { NewSuggestionDialog } from "@/components/reviewer/new-suggestion-dialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/i18n/format";
import { categoryName } from "@/lib/data/categories";
import type { Category, KBSuggestion } from "@/lib/types";

type SuggestionKind = "new_source" | "chunk_addition";

export function SuggestionList({
  suggestions,
  sources,
  categories = [],
}: {
  suggestions: KBSuggestion[];
  sources: Array<{ id: string; title: string }>;
  categories?: Category[];
}) {
  const { locale, tr } = useI18n();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const titleById = useMemo(
    () => new Map(sources.map((source) => [source.id, source.title])),
    [sources],
  );

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return suggestions
      .filter((suggestion) => status === "all" || suggestion.status === status)
      .filter((suggestion) => {
        if (kind === "all") return true;
        return kind === "chunk_addition"
          ? Boolean(suggestion.targetSourceId)
          : !suggestion.targetSourceId;
      })
      .filter(
        (suggestion) =>
          !normalized ||
          suggestion.title.toLowerCase().includes(normalized) ||
          suggestion.note.toLowerCase().includes(normalized),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [suggestions, query, status, kind]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || status !== "all" || kind !== "all";

  const pendingCount = suggestions.filter((suggestion) => suggestion.status === "pending").length;

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/reviewer/knowledge-base`} className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 hover:text-sage-700">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {tr("Kembali ke Knowledge Base", "Back to knowledge base")}
      </Link>
      <PageHeader
        eyebrow={tr("Saran Knowledge Base", "Knowledge Base suggestions")}
        title={tr("Usulkan bukti baru untuk taman pengetahuan", "Suggest new evidence for the knowledge garden")}
        description={tr(
          "Saranmu disimpan sebagai draft. Admin meninjau, menyetujui, lalu melakukan ingest. Reviewer tidak dapat memublikasikan chunk langsung.",
          "Your suggestion is stored as a draft. Admins review and approve it before ingest. Reviewers cannot publish chunks directly.",
        )}
        actions={
          <NewSuggestionDialog sources={sources} categories={categories} />
        }
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tr("Cari judul atau catatan...", "Search title or note...")}
              className="pl-11"
              aria-label={tr("Cari saran", "Search suggestions")}
            />
          </div>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={tr("Filter status", "Filter status")} className="md:w-44">
            <option value="all">{tr("Semua status", "All statuses")}</option>
            <option value="pending">{tr("Menunggu", "Pending")}</option>
            <option value="approved">{tr("Disetujui", "Approved")}</option>
            <option value="rejected">{tr("Ditolak", "Rejected")}</option>
            <option value="needs_changes">{tr("Perlu perubahan", "Needs changes")}</option>
          </Select>
          <Select value={kind} onChange={(event) => setKind(event.target.value)} aria-label={tr("Filter jenis", "Filter type")} className="md:w-48">
            <option value="all">{tr("Semua jenis", "All types")}</option>
            <option value="new_source">{tr("Sumber baru", "New source")}</option>
            <option value="chunk_addition">{tr("Tambahan chunk", "Chunk addition")}</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-bark-700">{visible.length} {tr("saran", "suggestions")}</p>
        <Badge variant="sky">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {pendingCount} {tr("menunggu", "pending")}
        </Badge>
      </div>

      {visible.length > 0 ? (
        <>
          <div className="hidden lg:block">
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>{tr("Saran", "Suggestion")}</TH>
                    <TH>{tr("Jenis", "Type")}</TH>
                    <TH>{tr("Target", "Target")}</TH>
                    <TH>{tr("Status", "Status")}</TH>
                    <TH>{tr("Chunk", "Chunks")}</TH>
                    <TH>{tr("Diajukan", "Submitted")}</TH>
                    <TH>{tr("Aksi", "Actions")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {visible.map((suggestion) => {
                    const kindLabel: SuggestionKind = suggestion.targetSourceId
                      ? "chunk_addition"
                      : "new_source";
                    return (
                      <TR key={suggestion.id}>
                        <TD>
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-cream-100 text-bark-700">
                              <BookMarked className="size-3.5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="max-w-md text-xs font-extrabold leading-snug text-bark-900">{suggestion.title}</p>
                              {suggestion.note ? (
                                <p className="mt-0.5 max-w-md text-xs leading-relaxed text-bark-500">{suggestion.note}</p>
                              ) : null}
                              {suggestion.categorySlug || suggestion.author || suggestion.sourceUrl ? (
                                <p className="mt-0.5 flex max-w-md flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-bark-500">
                                  {suggestion.categorySlug ? <span>{categoryName(suggestion.categorySlug, locale)}</span> : null}
                                  {suggestion.author ? <span>{suggestion.author}{suggestion.year ? ` (${suggestion.year})` : ""}</span> : null}
                                  {suggestion.sourceUrl ? (
                                    <a href={suggestion.sourceUrl} target="_blank" rel="noreferrer noopener" className="font-bold text-sage-700 hover:underline">{tr("Sumber", "Source")}</a>
                                  ) : null}
                                </p>
                              ) : null}
                              {suggestion.adminNote ? (
                                <p className="mt-1 max-w-md text-xs leading-relaxed text-bark-700">
                                  <span className="font-bold text-bark-900">{tr("Catatan admin", "Admin note")}:</span> {suggestion.adminNote}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </TD>
                        <TD>
                          <Badge variant="outline">
                            {kindLabel === "chunk_addition"
                              ? tr("Tambahan chunk", "Chunk addition")
                              : tr("Sumber baru", "New source")}
                          </Badge>
                        </TD>
                        <TD className="max-w-xs text-xs text-bark-700">
                          {suggestion.targetSourceId
                            ? (titleById.get(suggestion.targetSourceId) ?? "-")
                            : "-"}
                        </TD>
                        <TD><StatusBadge status={suggestion.status} /></TD>
                        <TD className="text-xs">{suggestion.chunks.length}</TD>
                        <TD className="whitespace-nowrap text-xs">{formatDate(suggestion.createdAt, locale)}</TD>
                        <TD>
                          <Link
                            href={`/${locale}/reviewer/knowledge-base/saran/${suggestion.id}/chunks`}
                            className={buttonVariants({ variant: "ghost", size: "sm" })}
                          >
                            {tr("Kelola chunk", "Manage chunks")}
                            <ArrowRight className="size-3" aria-hidden="true" />
                          </Link>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </TableWrap>
          </div>

          <div className="grid gap-3 lg:hidden">
            {visible.map((suggestion) => (
              <article key={suggestion.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold leading-snug text-bark-900">{suggestion.title}</p>
                    {suggestion.note ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-bark-500">{suggestion.note}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={suggestion.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {suggestion.targetSourceId
                      ? tr("Tambahan chunk", "Chunk addition")
                      : tr("Sumber baru", "New source")}
                  </Badge>
                  {suggestion.targetSourceId ? (
                    <Badge variant="default">
                      {tr("Target", "Target")}: {titleById.get(suggestion.targetSourceId) ?? "-"}
                    </Badge>
                  ) : null}
                  {suggestion.categorySlug ? (
                    <Badge variant="outline">{categoryName(suggestion.categorySlug, locale)}</Badge>
                  ) : null}
                  {suggestion.author ? (
                    <Badge variant="default">{suggestion.author}{suggestion.year ? ` (${suggestion.year})` : ""}</Badge>
                  ) : null}
                  <Badge variant="default">
                    <FileText className="size-3" aria-hidden="true" />
                    {suggestion.chunks.length} {tr("chunk", "chunks")}
                  </Badge>
                </div>
                {suggestion.sourceUrl ? (
                  <a href={suggestion.sourceUrl} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline">
                    {tr("Buka sumber", "Open source")}
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </a>
                ) : null}
                {suggestion.adminNote ? (
                  <p className="mt-2 rounded-md bg-cream-100 p-2.5 text-xs leading-relaxed text-bark-700">
                    <span className="font-bold">{tr("Catatan admin", "Admin note")}:</span> {suggestion.adminNote}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3">
                  <span className="text-xs text-bark-500">{formatDate(suggestion.createdAt, locale)}</span>
                  <Link
                    href={`/${locale}/reviewer/knowledge-base/saran/${suggestion.id}/chunks`}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    {tr("Kelola chunk", "Manage chunks")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : isFiltered ? (
        <EmptyState
          icon={hasQuery ? SearchX : FilterX}
          state="filtered"
          title={tr("Belum ada saran yang cocok", "No matching suggestions")}
          description={tr("Ubah kata kunci atau filter untuk melihat saran lain.", "Change the keyword or filters to see other suggestions.")}
          action={<Button variant="secondary" onClick={() => { setQuery(""); setStatus("all"); setKind("all"); }}>{tr("Hapus filter", "Clear filters")}</Button>}
        />
      ) : (
        <EmptyState
          icon={Lightbulb}
          state="none"
          title={tr("Belum ada saran", "No suggestions yet")}
          description={tr("Ajukan saran bukti baru agar pengetahuan publik bertambah.", "Suggest new evidence so the public knowledge base grows.")}
          action={
            <NewSuggestionDialog sources={sources} categories={categories} />
          }
        />
      )}

      <div className="rounded-lg border border-cream-200 bg-cream-100 p-4 text-xs leading-relaxed text-bark-700">
        {tr(
          "Saran yang belum ditinjau lebih dari 14 hari ditandai untuk pengingat admin. Setiap perubahan chunk dicatat dalam riwayat saran.",
          "Suggestions unreviewed for more than 14 days are flagged as an admin reminder. Every chunk change is recorded in the suggestion history.",
        )}
      </div>
    </div>
  );
}