"use client";

import Link from "next/link";
import { ArrowRight, BookMarked, BookOpen, FileText, FileUp, FilterX, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { NewSuggestionDialog } from "@/components/reviewer/new-suggestion-dialog";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { categoryName } from "@/lib/data/categories";
import { formatDate } from "@/lib/i18n/format";
import type { Category, KBSource } from "@/lib/types";

export function ReviewerKnowledgeBase({
  sources,
  categories = [],
}: {
  sources: KBSource[];
  categories?: Category[];
}) {
  const { locale, tr } = useI18n();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sources
      .filter((source) => type === "all" || source.type === type)
      .filter(
        (source) =>
          !normalized ||
          source.title.toLowerCase().includes(normalized) ||
          source.author.toLowerCase().includes(normalized),
      );
  }, [sources, query, type]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || type !== "all";

  const suggestionSources = useMemo(
    () => sources.map((source) => ({ id: source.id, title: source.title })),
    [sources],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Knowledge Base", "Knowledge Base")}
        title={tr("Sumber bukti yang dipakai pipeline", "Evidence sources used by the pipeline")}
        description={tr(
          "Hanya sumber yang sudah ter-ingest yang ditampilkan. Chunk ter-ingest inilah yang dipakai saat verifikasi klaim, jadi ini rujukan yang valid untuk tinjauan.",
          "Only ingested sources are listed. Ingested chunks are what claim verification uses, so these are the valid references for review.",
        )}
        actions={
          <Link
            href={`/${locale}/reviewer/knowledge-base/saran`}
            className={buttonVariants({ variant: "secondary" })}
          >
            <BookMarked className="size-4" aria-hidden="true" />
            {tr("Saran KB", "KB suggestions")}
          </Link>
        }
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tr("Cari judul atau penulis...", "Search title or author...")}
              className="pl-11"
              aria-label={tr("Cari sumber KB", "Search KB sources")}
            />
          </div>
          <Select
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-label={tr("Filter jenis", "Filter type")}
            className="md:w-40"
          >
            <option value="all">{tr("Semua jenis", "All types")}</option>
            <option value="article">{tr("Artikel", "Article")}</option>
            <option value="document">{tr("Dokumen", "Document")}</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-bark-700">
          {visible.length} {tr("sumber ter-ingest", "ingested sources")}
        </p>
        <Badge variant="sage">
          <BookOpen className="size-3.5" aria-hidden="true" />
          {sources.length} {tr("aktif", "active")}
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
                    <TH>{tr("Jenis", "Type")}</TH>
                    <TH>{tr("Chunk", "Chunks")}</TH>
                    <TH>{tr("Diperbarui", "Updated")}</TH>
                    <TH>{tr("Aksi", "Actions")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {visible.map((source) => (
                    <TR key={source.id}>
                      <TD>
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-cream-100 text-bark-700">
                            {source.type === "article" ? (
                              <FileText className="size-3.5" aria-hidden="true" />
                            ) : (
                              <FileUp className="size-3.5" aria-hidden="true" />
                            )}
                          </span>
                          <div>
                            <p className="max-w-md text-xs font-extrabold leading-snug text-bark-900">
                              {source.title}
                            </p>
                            <p className="mt-0.5 text-xs text-bark-500">
                              {source.author} · {source.year}
                              {source.fileType ? ` · ${source.fileType}` : ""}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <Badge variant="outline">{categoryName(source.categorySlug, locale)}</Badge>
                      </TD>
                      <TD className="text-xs">
                        {source.type === "article" ? tr("Artikel", "Article") : tr("Dokumen", "Document")}
                      </TD>
                      <TD className="text-xs">{source.chunks.length}</TD>
                      <TD className="whitespace-nowrap text-xs">{formatDate(source.updatedAt, locale)}</TD>
                      <TD>
                        <Link
                          href={`/${locale}/reviewer/knowledge-base/${source.id}`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          {tr("Lihat detail", "View detail")}
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </Link>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </div>

          <div className="grid gap-3 lg:hidden">
            {visible.map((source) => (
              <article
                key={source.id}
                className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300"
              >
                <p className="text-sm font-extrabold leading-snug text-bark-900">{source.title}</p>
                <p className="mt-0.5 text-xs text-bark-500">
                  {source.author} · {source.year}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{categoryName(source.categorySlug, locale)}</Badge>
                  <Badge variant="default">
                    {source.chunks.length} {tr("chunk", "chunks")}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3">
                  <span className="text-xs text-bark-500">{formatDate(source.updatedAt, locale)}</span>
                  <Link
                    href={`/${locale}/reviewer/knowledge-base/${source.id}`}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    {tr("Lihat detail", "View detail")}
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
          title={tr("Sumber tidak ditemukan", "No sources found")}
          description={tr("Ubah filter untuk melihat sumber lain.", "Adjust the filters to see other sources.")}
          action={<Button variant="secondary" onClick={() => { setQuery(""); setType("all"); }}>{tr("Hapus filter", "Clear filters")}</Button>}
        />
      ) : (
        <EmptyState
          icon={BookOpen}
          state="none"
          title={tr("Belum ada sumber ter-ingest", "No ingested sources yet")}
          description={tr("Tunggu admin menyelesaikan ingest sumber baru.", "Wait for an admin to finish ingesting new sources.")}
          action={
            <NewSuggestionDialog sources={suggestionSources} categories={categories} label={tr("Ajukan saran sumber", "Suggest a source")} />
          }
        />
      )}

      <div className="rounded-lg border border-cream-200 bg-cream-100 p-4 text-xs leading-relaxed text-bark-700">
        {tr(
          "Reviewer hanya membaca. Untuk menambah sumber, ajukan saran; admin yang meninjau, meng-potong chunk, dan menjalankan ingest.",
          "Reviewers have read access. To add a source, submit a suggestion; an admin reviews it, chunks it, and runs the ingest.",
        )}
      </div>
    </div>
  );
}