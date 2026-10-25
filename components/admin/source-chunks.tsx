"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Database,
  FileQuestion,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { ingestKbSourceAction, saveKbChunksAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/panacea/status-badge";
import { ChunkEditor } from "@/components/panacea/chunk-editor";
import { IngestJobCard } from "@/components/admin/ingest-jobs";
import { categoryName } from "@/lib/data/categories";
import { formatDate } from "@/lib/i18n/format";
import type { KBChunk, KBSource } from "@/lib/types";

export function SourceChunks({ source }: { source?: KBSource }) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const [chunks, setChunks] = useState<KBChunk[]>(source?.chunks ?? []);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  if (!source) {
    return (
      <EmptyState
        icon={FileQuestion}
        state="none"
        title={tr("Sumber tidak ditemukan", "Source not found")}
        description={tr("Sumber KB ini tidak tersedia.", "This KB source is unavailable.")}
        action={
          <Link href={`/${locale}/admin/knowledge-base`} className={buttonVariants()}>
            {tr("Kembali ke KB", "Back to KB")}
          </Link>
        }
      />
    );
  }

  const status = source.status;
  const approved = chunks.filter((chunk) => chunk.status === "approved").length;
  const drafts = chunks.filter((chunk) => chunk.status === "draft").length;
  const canIngest = approved > 0 && drafts === 0;

  async function saveChunks() {
    if (!source) return false;
    setSaving(true);
    const result = await saveKbChunksAction(
      locale,
      source.id,
      chunks.map((chunk) => ({
        content: chunk.content,
        status: chunk.status === "ingested" ? "approved" : chunk.status,
      })),
    );
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    toast.success(tr("Chunk disimpan.", "Chunks saved."));
    router.refresh();
    return true;
  }

  async function ingest() {
    if (!source) return;
    setIngesting(true);
    const saved = await saveChunks();
    if (!saved) {
      setIngesting(false);
      return;
    }
    const result = await ingestKbSourceAction(locale, source.id);
    setIngesting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setConfirmOpen(false);
    if (result.queuedOnly) {
      toast.info(
        tr(
          "Ingest diantrekan. Worker akan memprosesnya sebentar lagi.",
          "Ingest queued. The worker will process it shortly.",
        ),
      );
    } else {
      toast.success(tr("Ingest selesai. Embedding sudah dibuat.", "Ingest complete. Embeddings are ready."));
    }
    router.refresh();
  }

  const meta = source as KBSource;

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/admin/knowledge-base`} className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 hover:text-sage-700">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {tr("Kembali ke Knowledge Base", "Back to Knowledge Base")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <Badge variant="outline">{categoryName(meta.categorySlug, locale)}</Badge>
            <Badge variant="default">{meta.type === "article" ? tr("Artikel", "Article") : tr("Dokumen", "Document")}</Badge>
          </div>
          <h1 className="mt-2 max-w-3xl font-heading text-2xl font-extrabold leading-tight text-bark-900">{meta.title}</h1>
          <p className="mt-1.5 text-xs text-bark-500">{meta.author} · {meta.year} · {tr("Diperbarui", "Updated")} {formatDate(meta.updatedAt, locale)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void saveChunks()} disabled={saving || chunks.length === 0}>
            {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
            {tr("Simpan chunk", "Save chunks")}
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={!canIngest || status === "ingested"}>
            <Sparkles className="size-4" aria-hidden="true" />
            {status === "ingested" ? tr("Sudah ter-ingest", "Already ingested") : tr("Setujui & Ingest", "Approve & Ingest")}
          </Button>
        </div>
      </div>

      {!canIngest ? (
        <div className="rounded-lg border border-butter-300 bg-[#fff7de] p-4 text-xs leading-relaxed text-[#7c5c17]">
          {drafts > 0
            ? tr(
                `${drafts} chunk masih draft. Setujui atau tolak setiap chunk sebelum ingest.`,
                `${drafts} chunks are still draft. Approve or reject every chunk before ingest.`,
              )
            : tr(
                "Minimal satu chunk harus disetujui sebelum ingest dapat dijalankan.",
                "At least one chunk must be approved before ingest can run.",
              )}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300 sm:p-6">
          <ChunkEditor chunks={chunks} onChange={setChunks} heading={tr("Chunk sumber", "Source chunks")} />
        </section>

        <aside className="space-y-4">
          <IngestJobCard source={meta} />

          <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-sage-700" aria-hidden="true" />
              <h2 className="font-heading text-sm font-extrabold text-bark-900">{tr("Metadata sumber", "Source metadata")}</h2>
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-bark-500">{tr("Kategori", "Category")}</dt>
                <dd className="text-right font-bold text-bark-700">{categoryName(meta.categorySlug, locale)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-bark-500">{tr("Tipe", "Type")}</dt>
                <dd className="font-bold text-bark-700">{meta.type}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-bark-500">{tr("Jumlah chunk", "Chunk count")}</dt>
                <dd className="font-bold text-bark-700">{chunks.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-bark-500">{tr("Disetujui", "Approved")}</dt>
                <dd className="font-bold text-bark-700">{approved}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-sage-300 bg-sage-100 p-4">
            <div className="flex items-center gap-2 text-sage-700">
              <Database className="size-4" aria-hidden="true" />
              <p className="text-xs font-extrabold">{tr("Ingest & embedding", "Ingest & embedding")}</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-bark-700">
              {tr(
                "Ingest membuat embedding Gemini untuk chunk yang disetujui dan menyimpannya ke kb_chunks. Proses ini idempotent dan dicatat di audit.",
                "Ingest creates Gemini embeddings for approved chunks and stores them in kb_chunks. The process is idempotent and audited.",
              )}
            </p>
          </div>

          <div className="rounded-lg border border-butter-300 bg-[#fff7de] p-4 text-xs leading-relaxed text-bark-700">
            <div className="flex items-center gap-2 font-extrabold">
              <LockKeyhole className="size-4" aria-hidden="true" />
              {tr("Perubahan pasca-ingest", "Post-ingest changes")}
            </div>
            <p className="mt-1.5">
              {tr(
                "Mengedit chunk yang sudah ter-ingest akan menandainya perlu embedding ulang. Versi dan riwayat perubahan tetap dicatat.",
                "Editing an ingested chunk marks it for re-embedding. Versions and change history remain recorded.",
              )}
            </p>
          </div>
        </aside>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={tr("Setujui dan ingest chunk?", "Approve and ingest chunks?")}
        description={tr(
          "Chunk yang disetujui akan di-embedding dan langsung dapat dipakai pipeline verifikasi. Pastikan kualitas dan kategorinya sudah benar.",
          "Approved chunks will be embedded and become available to the verification pipeline. Ensure their quality and category are correct.",
        )}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={ingesting}>{tr("Periksa lagi", "Review again")}</Button>
            <Button onClick={() => void ingest()} disabled={ingesting}>
              {ingesting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
              {ingesting ? tr("Meng-ingest...", "Ingesting...") : tr("Ya, setujui & ingest", "Yes, approve & ingest")}
            </Button>
          </>
        }
      >
        <div className="rounded-md bg-cream-100 p-4 text-xs leading-relaxed text-bark-700">
          <p className="font-bold text-bark-900">{approved} {tr("chunk disetujui", "chunks approved")}</p>
          <p className="mt-1">{tr("Proses dapat dijalankan ulang tanpa membuat duplikat.", "The process can be rerun without creating duplicates.")}</p>
        </div>
      </Dialog>
    </div>
  );
}
