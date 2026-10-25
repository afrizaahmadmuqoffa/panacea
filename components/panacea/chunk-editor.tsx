"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Merge,
  Pencil,
  Plus,
  Save,
  Scissors,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import type { KBChunk } from "@/lib/types";
import { cn } from "@/lib/utils";

const estimateTokens = (content: string) => Math.ceil(content.trim().length / 4);

function reindex(chunks: KBChunk[]): KBChunk[] {
  return chunks.map((chunk, index) => ({ ...chunk, index }));
}

export function ChunkEditor({
  chunks,
  onChange,
  readOnly,
  heading = "Chunk",
}: {
  chunks: KBChunk[];
  onChange: (chunks: KBChunk[]) => void;
  readOnly?: boolean;
  heading?: string;
}) {
  const { tr } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const commit = (next: KBChunk[]) => onChange(reindex(next));

  function startEdit(chunk: KBChunk) {
    setEditingId(chunk.id);
    setDraft(chunk.content);
  }

  function saveEdit(chunk: KBChunk) {
    if (draft.trim().length < 20) {
      toast.error(tr("Isi chunk minimal 20 karakter.", "Chunk content must be at least 20 characters."));
      return;
    }
    commit(
      chunks.map((item) =>
        item.id === chunk.id
          ? {
              ...item,
              content: draft.trim(),
              tokenCount: estimateTokens(draft),
              status: item.status === "ingested" ? "approved" : item.status,
            }
          : item,
      ),
    );
    setEditingId(null);
    toast.success(
      chunk.status === "ingested"
        ? tr("Chunk diperbarui. Embedding ulang diperlukan.", "Chunk updated. Re-embedding is required.")
        : tr("Chunk diperbarui.", "Chunk updated."),
    );
  }

  function addChunk() {
    const id = `chunk-${Date.now()}`;
    commit([
      ...chunks,
      {
        id,
        sourceId: chunks[0]?.sourceId ?? "draft",
        index: chunks.length,
        content: "",
        tokenCount: 0,
        status: "draft",
      },
    ]);
    setEditingId(id);
    setDraft("");
  }

  function remove(chunk: KBChunk) {
    commit(chunks.filter((item) => item.id !== chunk.id));
    toast.success(tr("Chunk dihapus dari draft.", "Chunk removed from the draft."));
  }

  function split(chunk: KBChunk) {
    const content = chunk.content.trim();
    if (content.length < 40) {
      toast.error(tr("Chunk terlalu pendek untuk dipecah.", "Chunk is too short to split."));
      return;
    }
    const midpoint = Math.floor(content.length / 2);
    const sentenceBreak = content.indexOf(". ", midpoint);
    const cut = sentenceBreak === -1 ? midpoint : sentenceBreak + 1;
    const first = content.slice(0, cut).trim();
    const second = content.slice(cut).trim();
    if (first.length < 20 || second.length < 20) {
      toast.error(tr("Hasil pecahan terlalu pendek.", "Split result is too short."));
      return;
    }
    const firstChunk: KBChunk = {
      ...chunk,
      id: `${chunk.id}-a-${Date.now()}`,
      content: first,
      tokenCount: estimateTokens(first),
      status: "draft",
    };
    const secondChunk: KBChunk = {
      ...chunk,
      id: `${chunk.id}-b-${Date.now()}`,
      content: second,
      tokenCount: estimateTokens(second),
      status: "draft",
    };
    const index = chunks.findIndex((item) => item.id === chunk.id);
    const next = [...chunks];
    next.splice(index, 1, firstChunk, secondChunk);
    commit(next);
    toast.success(tr("Chunk dipecah menjadi dua.", "Chunk split into two."));
  }

  function merge(chunk: KBChunk) {
    const index = chunks.findIndex((item) => item.id === chunk.id);
    if (index <= 0) {
      toast.error(tr("Tidak ada chunk sebelumnya untuk digabung.", "There is no previous chunk to merge."));
      return;
    }
    const previous = chunks[index - 1];
    const merged: KBChunk = {
      ...previous,
      content: `${previous.content.trim()}\n\n${chunk.content.trim()}`,
      tokenCount: estimateTokens(`${previous.content} ${chunk.content}`),
      status: "draft",
    };
    const next = [...chunks];
    next.splice(index - 1, 2, merged);
    commit(next);
    toast.success(tr("Chunk digabung dengan chunk sebelumnya.", "Chunk merged with the previous chunk."));
  }

  function move(chunk: KBChunk, direction: -1 | 1) {
    const index = chunks.findIndex((item) => item.id === chunk.id);
    const target = index + direction;
    if (target < 0 || target >= chunks.length) return;
    const next = [...chunks];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  function setStatus(chunk: KBChunk, status: KBChunk["status"]) {
    commit(chunks.map((item) => (item.id === chunk.id ? { ...item, status } : item)));
  }

  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
  const approved = chunks.filter((chunk) => chunk.status === "approved" || chunk.status === "ingested").length;
  const drafts = chunks.filter((chunk) => chunk.status === "draft").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-md bg-sage-100 text-sage-700">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-base font-extrabold text-bark-900">{heading}</h2>
            <p className="text-xs text-bark-500">
              {chunks.length} chunk · {totalTokens.toLocaleString("id-ID")} token · {approved} {tr("disetujui", "approved")}
            </p>
          </div>
        </div>
        {!readOnly ? (
          <Button size="sm" variant="secondary" onClick={addChunk}>
            <Plus className="size-3.5" aria-hidden="true" />
            {tr("Tambah chunk", "Add chunk")}
          </Button>
        ) : null}
      </div>

      {drafts > 0 ? (
        <div className="mt-3 rounded-md border border-butter-300 bg-[#fff7de] px-3 py-2 text-xs font-semibold text-[#7c5c17]">
          {drafts} chunk {tr("masih draft dan perlu keputusan sebelum ingest.", "still draft and need a decision before ingest.")}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {chunks.map((chunk) => {
          const editing = editingId === chunk.id;
          const ideal = chunk.tokenCount >= 400 && chunk.tokenCount <= 800;
          return (
            <article key={chunk.id} className="rounded-lg border border-border-soft bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-cream-100 text-xs font-extrabold text-bark-700">
                  {chunk.index + 1}
                </span>
                <StatusBadge status={chunk.status} />
                <Badge variant={ideal ? "sage" : "outline"}>
                  {chunk.tokenCount} token
                </Badge>
                {!ideal && chunk.tokenCount > 0 ? (
                  <span className="text-xs font-semibold text-bark-500">
                    {chunk.tokenCount < 400 ? tr("pendek", "short") : tr("panjang", "long")} · {tr("target 400–800", "target 400–800")}
                  </span>
                ) : null}
                <div className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="size-11" onClick={() => move(chunk, -1)} aria-label={tr("Naikkan chunk", "Move chunk up")} disabled={chunk.index === 0}>
                    <ArrowUp className="size-3.5" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-11" onClick={() => move(chunk, 1)} aria-label={tr("Turunkan chunk", "Move chunk down")} disabled={chunk.index === chunks.length - 1}>
                    <ArrowDown className="size-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    onClick={() => setExpanded((current) => ({ ...current, [chunk.id]: !current[chunk.id] }))}
                    aria-label={expanded[chunk.id] ? tr("Ringkas chunk", "Collapse chunk") : tr("Perluas chunk", "Expand chunk")}
                  >
                    {expanded[chunk.id] ? <ChevronUp className="size-3.5" aria-hidden="true" /> : <ChevronDown className="size-3.5" aria-hidden="true" />}
                  </Button>
                </div>
              </div>

              {editing ? (
                <div className="mt-3">
                  <label htmlFor={`edit-${chunk.id}`} className="sr-only">{tr("Isi chunk", "Chunk content")}</label>
                  <textarea
                    id={`edit-${chunk.id}`}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={8}
                    className="w-full resize-y rounded-md border border-input bg-cream-50 px-3 py-2.5 text-xs leading-relaxed text-bark-900 outline-none focus:border-sage-600 focus:ring-3 focus:ring-sage-300/50"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-bark-500">{draft.length} {tr("karakter", "characters")} · {estimateTokens(draft)} token</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="size-3.5" aria-hidden="true" />
                        {tr("Batal", "Cancel")}
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(chunk)}>
                        <Save className="size-3.5" aria-hidden="true" />
                        {tr("Simpan", "Save")}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={cn("mt-3 whitespace-pre-line text-xs leading-relaxed text-bark-700", !expanded[chunk.id] && "line-clamp-4")}>
                  {chunk.content || tr("Chunk kosong. Klik edit untuk menulis isi.", "Empty chunk. Click edit to write content.")}
                </p>
              )}

              {!readOnly ? (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-cream-200 pt-3">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(chunk)}>
                    <Pencil className="size-3.5" aria-hidden="true" />
                    {tr("Edit", "Edit")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => split(chunk)}>
                    <Scissors className="size-3.5" aria-hidden="true" />
                    {tr("Pecah", "Split")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => merge(chunk)} disabled={chunk.index === 0}>
                    <Merge className="size-3.5" aria-hidden="true" />
                    {tr("Gabung atas", "Merge up")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus(chunk, chunk.status === "approved" || chunk.status === "ingested" ? "draft" : "approved")}
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    {chunk.status === "approved" || chunk.status === "ingested" ? tr("Batalkan setuju", "Unapprove") : tr("Setujui", "Approve")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(chunk, "rejected")}>
                    {tr("Tolak", "Reject")}
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto text-rose-700" onClick={() => remove(chunk)}>
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    {tr("Hapus", "Delete")}
                  </Button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {chunks.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border-strong bg-cream-50 p-6 text-center">
          <p className="text-sm font-bold text-bark-900">{tr("Belum ada chunk", "No chunks yet")}</p>
          <p className="mt-1 text-xs text-bark-500">{tr("Tambah chunk manual atau pecah dari artikel.", "Add a chunk manually or split from the article.")}</p>
        </div>
      ) : null}
    </div>
  );
}
