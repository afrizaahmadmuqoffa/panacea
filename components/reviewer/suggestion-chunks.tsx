"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Lightbulb,
  LoaderCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { updateSuggestionChunksAction } from "@/lib/actions/reviewer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/panacea/status-badge";
import { ChunkEditor } from "@/components/panacea/chunk-editor";
import { formatDate } from "@/lib/i18n/format";
import type { KBChunk, KBSuggestion } from "@/lib/types";

export function SuggestionChunks({ suggestion }: { suggestion?: KBSuggestion }) {
  const { locale, tr } = useI18n();
  const [chunks, setChunks] = useState<KBChunk[]>(suggestion?.chunks ?? []);
  const [sending, setSending] = useState(false);

  if (!suggestion) {
    return (
      <EmptyState
        icon={Lightbulb}
        state="none"
        title={tr("Saran tidak ditemukan", "Suggestion not found")}
        description={tr("Saran ini mungkin sudah tidak tersedia.", "This suggestion may no longer be available.")}
        action={
          <Link href={`/${locale}/reviewer/knowledge-base/saran`} className={buttonVariants()}>
            {tr("Kembali ke saran KB", "Back to KB suggestions")}
          </Link>
        }
      />
    );
  }

  async function saveDraft() {
    if (!suggestion) return;
    setSending(true);
    const result = await updateSuggestionChunksAction(
      locale,
      suggestion.id,
      chunks.map((chunk) => ({
        content: chunk.content,
        tokenCount: chunk.tokenCount || Math.max(1, Math.ceil(chunk.content.split(/\s+/).length * 1.33)),
      })),
    );
    setSending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(tr("Draft chunk disimpan. Admin dapat meninjaunya.", "Chunk draft saved. Admins can review it."));
  }

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/reviewer/knowledge-base/saran`} className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 hover:text-sage-700">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {tr("Kembali ke saran KB", "Back to KB suggestions")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={suggestion.status} />
            <Badge variant="outline">{suggestion.reviewerAlias}</Badge>
            <span className="text-xs text-bark-500">{formatDate(suggestion.createdAt, locale)}</span>
          </div>
          <h1 className="mt-2 font-heading text-2xl font-extrabold leading-tight text-bark-900">{suggestion.title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-bark-700">{suggestion.note}</p>
        </div>
        <Button onClick={saveDraft} disabled={sending}>
          {sending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          {sending ? tr("Menyimpan...", "Saving...") : tr("Simpan draft", "Save draft")}
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300 sm:p-6">
          <ChunkEditor chunks={chunks} onChange={setChunks} heading={tr("Chunk saran", "Suggestion chunks")} />
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-sage-300 bg-sage-100 p-5">
            <div className="flex items-center gap-2 text-sage-700">
              <ShieldCheck className="size-4" aria-hidden="true" />
              <h2 className="font-heading text-sm font-extrabold">{tr("Kendali admin", "Admin control")}</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-bark-700">
              {tr(
                "Menyimpan draft tidak mengubah KB. Admin harus menyetujui dan menjalankan ingest sebelum chunk dipakai analisis.",
                "Saving a draft does not change the KB. An admin must approve and run ingest before chunks are used in analysis.",
              )}
            </p>
          </div>
          <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4">
            <div className="flex items-center gap-2 text-bark-700">
              <FileText className="size-4" aria-hidden="true" />
              <p className="text-xs font-extrabold">{tr("Ringkasan saran", "Suggestion summary")}</p>
            </div>
            <dl className="mt-2.5 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-bark-500">{tr("Jumlah chunk", "Chunk count")}</dt>
                <dd className="font-bold text-bark-700">{chunks.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-bark-500">{tr("Total token", "Total tokens")}</dt>
                <dd className="font-bold text-bark-700">{chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-bark-500">{tr("Disetujui", "Approved")}</dt>
                <dd className="font-bold text-bark-700">{chunks.filter((chunk) => chunk.status === "approved").length}</dd>
              </div>
            </dl>
          </div>
          {suggestion.adminNote ? (
            <div className="rounded-[22px] border-[#e8e2d5] bg-[#fffdf8] p-4 text-xs leading-relaxed text-bark-700">
              <p className="font-extrabold text-bark-900">{tr("Catatan admin", "Admin note")}</p>
              <p className="mt-1">{suggestion.adminNote}</p>
            </div>
          ) : null}
          <div className="flex items-start gap-2 rounded-md bg-[#fff7de] p-3 text-xs leading-relaxed text-bark-700">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {tr("Setiap perubahan chunk tercatat dalam riwayat saran.", "Every chunk change is recorded in suggestion history.")}
          </div>
        </aside>
      </div>
    </div>
  );
}
