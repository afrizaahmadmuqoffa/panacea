"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  FileUp,
  FilterX,
  Pencil,
  Search,
  SearchX,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StatusBadge } from "@/components/panacea/status-badge";
import { IngestJobPanel, IngestStatusMark } from "@/components/admin/ingest-jobs";
import { NewArticleDialog } from "@/components/admin/new-article-dialog";
import { UploadDocumentDialog } from "@/components/admin/upload-document-dialog";
import { categoryName } from "@/lib/data/categories";
import { formatDate } from "@/lib/i18n/format";
import type { KBSource, Category } from "@/lib/types";

export function AdminKnowledgeBase({ sources, categories }: { sources: KBSource[]; categories: Category[] }) {
  const { locale, tr } = useI18n();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sources
      .filter((source) => status === "all" || source.status === status)
      .filter((source) => type === "all" || source.type === type)
      .filter((source) => !normalized || source.title.toLowerCase().includes(normalized) || source.author.toLowerCase().includes(normalized));
  }, [sources, query, status, type]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || status !== "all" || type !== "all";
  const { page, setPage, pageCount, start, end } = usePagination(visible.length);
  const pageSlice = visible.slice(start, end);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Knowledge Base", "Knowledge Base")}
        title={tr("Sumber bukti yang dikurasi admin", "Admin-curated evidence sources")}
        description={tr(
          "Artikel dan dokumen dipecah menjadi chunk, ditinjau, lalu di-ingest. Hanya chunk ter-ingest yang dipakai pipeline verifikasi.",
          "Articles and documents are split into chunks, reviewed, then ingested. Only ingested chunks are used by the verification pipeline.",
        )}
        actions={
          <>
            <NewArticleDialog source={null} categories={categories} />
            <UploadDocumentDialog categories={categories} />
          </>
        }
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={tr("Cari judul atau penulis...", "Search title or author...")} className="pl-11" aria-label={tr("Cari sumber KB", "Search KB sources")} />
          </div>
          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label={tr("Filter status", "Filter status")} className="md:w-44">
            <option value="all">{tr("Semua status", "All statuses")}</option>
            <option value="draft">{tr("Draft", "Draft")}</option>
            <option value="chunked">{tr("Sudah dipecah", "Chunked")}</option>
            <option value="ingested">{tr("Ter-ingest", "Ingested")}</option>
            <option value="failed">{tr("Gagal", "Failed")}</option>
          </Select>
          <Select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} aria-label={tr("Filter jenis", "Filter type")} className="md:w-40">
            <option value="all">{tr("Semua jenis", "All types")}</option>
            <option value="article">{tr("Artikel", "Article")}</option>
            <option value="document">{tr("Dokumen", "Document")}</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-bark-700">{visible.length} {tr("sumber", "sources")}</p>
        <Badge variant="sage">
          <BookOpen className="size-3.5" aria-hidden="true" />
          {sources.filter((source) => source.status === "ingested").length} {tr("ter-ingest", "ingested")}
        </Badge>
      </div>

      {visible.length > 0 ? (
        <>
          <div className="hidden lg:block">
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>{tr("Sumber", "Source")}</TH>
                    <TH>{tr("Kategori", "Category")}</TH>
                    <TH>{tr("Status", "Status")}</TH>
                    <TH>{tr("Ingest", "Ingest")}</TH>
                    <TH>{tr("Chunk", "Chunks")}</TH>
                    <TH>{tr("Diperbarui", "Updated")}</TH>
                    <TH>{tr("Aksi", "Actions")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {pageSlice.map((source) => (
                    <TR key={source.id}>
                      <TD>
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-cream-100 text-bark-700">
                            {source.type === "article" ? <FileText className="size-3.5" aria-hidden="true" /> : <FileUp className="size-3.5" aria-hidden="true" />}
                          </span>
                          <div>
                            <p className="max-w-md text-xs font-extrabold leading-snug text-bark-900">{source.title}</p>
                            <p className="mt-0.5 text-xs text-bark-500">{source.author} · {source.year}{source.fileType ? ` · ${source.fileType}` : ""}</p>
                          </div>
                        </div>
                      </TD>
                      <TD><Badge variant="outline">{categoryName(source.categorySlug, locale)}</Badge></TD>
                      <TD><StatusBadge status={source.status} /></TD>
                      <TD><IngestStatusMark source={source} /></TD>
                      <TD className="text-xs">{source.chunks.length}</TD>
                      <TD className="whitespace-nowrap text-xs">{formatDate(source.updatedAt, locale)}</TD>
                      <TD>
                        <div className="flex items-center gap-1">
                          {source.type === "article" ? (
                            <Link href={`/${locale}/admin/knowledge-base/artikel/${source.id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon", className: "size-11" })} aria-label={tr("Edit artikel", "Edit article")}>
                              <Pencil className="size-3.5" aria-hidden="true" />
                            </Link>
                          ) : null}
                          <Link href={`/${locale}/admin/knowledge-base/${source.id}/chunks`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                            {tr("Chunk", "Chunks")}
                            <ArrowRight className="size-3" aria-hidden="true" />
                          </Link>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </div>

          <div className="grid gap-3 lg:hidden">
            {pageSlice.map((source) => (
              <article key={source.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold leading-snug text-bark-900">{source.title}</p>
                    <p className="mt-0.5 text-xs text-bark-500">{source.author} · {source.year}</p>
                  </div>
                  <StatusBadge status={source.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{categoryName(source.categorySlug, locale)}</Badge>
                  <Badge variant="default">{source.chunks.length} {tr("chunk", "chunks")}</Badge>
                  <IngestStatusMark source={source} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3">
                  <span className="text-xs text-bark-500">{formatDate(source.updatedAt, locale)}</span>
                  <div className="flex gap-1">
                    {source.type === "article" ? (
                      <Link href={`/${locale}/admin/knowledge-base/artikel/${source.id}/edit`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </Link>
                    ) : null}
                    <Link href={`/${locale}/admin/knowledge-base/${source.id}/chunks`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                      {tr("Kelola chunk", "Manage chunks")}
                    </Link>
                  </div>
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
          title={tr("Sumber tidak ditemukan", "No sources found")}
          description={tr("Ubah filter untuk melihat sumber lain.", "Adjust the filters to see other sources.")}
          action={<Button variant="secondary" onClick={() => { setQuery(""); setStatus("all"); setType("all");; setPage(1) }}>{tr("Hapus filter", "Clear filters")}</Button>}
        />
      ) : (
        <EmptyState
          icon={BookOpen}
          state="none"
          title={tr("Belum ada sumber", "No sources yet")}
          description={tr("Tambahkan sumber bukti agar review bisa merujuknya.", "Add evidence sources so reviews can cite them.")}
          action={<NewArticleDialog source={null} categories={categories} />}
        />
      )}

      <IngestJobPanel sources={sources} />

      <div className="rounded-lg border border-cream-200 bg-cream-100 p-4 text-xs leading-relaxed text-bark-700">
        {tr(
          "Tidak ada data seed KB. Seluruh isi berasal dari input admin atau saran reviewer yang disetujui. Perubahan chunk ter-ingest memerlukan embedding ulang dan dicatat di riwayat.",
          "There is no seed KB data. All content comes from admin input or approved reviewer suggestions. Changes to ingested chunks require re-embedding and are recorded in history.",
        )}
      </div>
    </div>
  );
}
