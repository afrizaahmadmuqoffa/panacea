"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, ExternalLink, FileQuestion } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { StatusBadge } from "@/components/panacea/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { categoryName } from "@/lib/data/categories";
import { formatDate } from "@/lib/i18n/format";
import type { KBSource } from "@/lib/types";

export function ReviewerKnowledgeBaseDetail({ source }: { source?: KBSource }) {
  const { locale, tr } = useI18n();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!source) {
    return (
      <EmptyState
        icon={FileQuestion}
        state="none"
        title={tr("Sumber tidak ditemukan", "Source not found")}
        description={tr(
          "Sumber ini tidak ada atau belum ter-ingest, jadi tidak bisa dipakai sebagai rujukan.",
          "This source does not exist or is not ingested yet, so it cannot be used as a reference.",
        )}
        action={
          <Link href={`/${locale}/reviewer/knowledge-base`} className={buttonVariants()}>
            {tr("Kembali ke daftar KB", "Back to KB list")}
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/reviewer/knowledge-base`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 hover:text-sage-700"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {tr("Kembali ke daftar knowledge base", "Back to knowledge base")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={source.status} />
            <Badge variant="outline">{categoryName(source.categorySlug, locale)}</Badge>
            <Badge variant="default">
              {source.type === "article" ? tr("Artikel", "Article") : tr("Dokumen", "Document")}
            </Badge>
          </div>
          <h1 className="mt-2 max-w-3xl font-heading text-2xl font-extrabold leading-tight text-bark-900 sm:text-3xl">
            {source.title}
          </h1>
          <p className="mt-1.5 text-xs text-bark-500">
            {source.author} · {source.year} · {tr("Diperbarui", "Updated")} {formatDate(source.updatedAt, locale, true)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-md bg-sage-100 text-sage-700">
                <BookOpen className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-base font-extrabold text-bark-900">
                  {tr("Chunk sumber", "Source chunks")}
                </h2>
                <p className="text-xs text-bark-500">
                  {source.chunks.length} {tr("chunk", "chunks")} ·{" "}
                  {source.chunks.reduce((total, chunk) => total + chunk.tokenCount, 0).toLocaleString("id-ID")} token
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {source.chunks.length === 0 ? (
              <p className="rounded-md bg-[#fff7de] p-3.5 text-xs text-bark-600">
                {tr("Sumber ini belum memiliki chunk.", "This source has no chunks yet.")}
              </p>
            ) : null}
            {source.chunks.map((chunk) => (
              <article key={chunk.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-cream-100 text-xs font-extrabold text-bark-700">
                    {chunk.index + 1}
                  </span>
                  <StatusBadge status={chunk.status} />
                  <span className="text-xs font-bold text-bark-500">{chunk.tokenCount} token</span>
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((current) => ({ ...current, [chunk.id]: !current[chunk.id] }))
                    }
                    className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline"
                    aria-expanded={Boolean(expanded[chunk.id])}
                  >
                    {expanded[chunk.id] ? (
                      <>
                        {tr("Ringkas", "Collapse")}
                        <ChevronUp className="size-3.5" aria-hidden="true" />
                      </>
                    ) : (
                      <>
                        {tr("Perluas", "Expand")}
                        <ChevronDown className="size-3.5" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
                <p
                  className={
                    expanded[chunk.id]
                      ? "mt-3 whitespace-pre-line text-xs leading-relaxed text-bark-700"
                      : "mt-3 line-clamp-4 whitespace-pre-line text-xs leading-relaxed text-bark-700"
                  }
                >
                  {chunk.content}
                </p>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
            <h2 className="font-heading text-sm font-extrabold text-bark-900">
              {tr("Metadata sumber", "Source metadata")}
            </h2>
            <dl className="mt-3 space-y-2 text-xs">
              {[
                { label: tr("Kategori", "Category"), value: categoryName(source.categorySlug, locale) },
                { label: tr("Tipe", "Type"), value: source.type === "article" ? tr("Artikel", "Article") : tr("Dokumen", "Document") },
                { label: tr("Penulis", "Author"), value: source.author },
                { label: tr("Tahun", "Year"), value: String(source.year) },
                { label: tr("Status", "Status"), value: source.status },
                { label: tr("Jumlah chunk", "Chunks"), value: String(source.chunks.length) },
                { label: tr("Terakhir diperbarui", "Last updated"), value: formatDate(source.updatedAt, locale) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between gap-3">
                  <dt className="text-bark-500">{item.label}</dt>
                  <dd className="text-right font-bold text-bark-700">{item.value}</dd>
                </div>
              ))}
            </dl>
            {source.sourceUrl ? (
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center gap-1.5 border-t border-cream-200 pt-3 text-xs font-bold text-sage-700 hover:underline"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                {tr("Buka sumber asli", "Open original source")}
              </a>
            ) : null}
          </div>

          <div className="rounded-lg border border-sage-300 bg-sage-100 p-4 text-xs leading-relaxed text-sage-700">
            {tr(
              "Chunk di bawah ini adalah potongan yang benar-benar dibaca pipeline saat memverifikasi klaim. Gunakan sebagai rujukan saat menilai kasus.",
              "These chunks are exactly what the pipeline reads when verifying a claim. Use them as references while assessing a case.",
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}