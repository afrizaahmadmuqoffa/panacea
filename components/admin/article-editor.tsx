"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Save,
  Scissors,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { saveKbArticleAction } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/panacea/status-badge";
import type { Category, KBChunk, KBSource } from "@/lib/types";

const estimateTokens = (content: string) => Math.ceil(content.trim().length / 4);

function splitIntoChunks(body: string, sourceId: string): KBChunk[] {
  const sentences = body
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (estimateTokens(candidate) > 700 && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.map((content, index) => ({
    id: `chunk-${Date.now()}-${index}`,
    sourceId,
    index,
    content,
    tokenCount: estimateTokens(content),
    status: "draft",
  }));
}

export function ArticleEditor({
  source,
  categories,
  onDone,
}: {
  source?: KBSource;
  categories: Category[];
  onDone?: () => void;
}) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState(source?.title ?? "");
  const [category, setCategory] = useState(source?.categorySlug ?? "nutrisi");
  const [author, setAuthor] = useState(source?.author ?? "");
  const [year, setYear] = useState(String(source?.year ?? 2026));
  const [url, setUrl] = useState("");
  const [body, setBody] = useState(source?.chunks.map((chunk) => chunk.content).join("\n\n") ?? "");
  const [error, setError] = useState("");
  const [splitting, setSplitting] = useState(false);
  const [chunks, setChunks] = useState<KBChunk[]>([]);
  const [saving, setSaving] = useState(false);
  const targetId = source?.id ?? "new";

  async function split(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    if (title.trim().length < 5) {
      setError(tr("Judul minimal 5 karakter.", "Title must be at least 5 characters."));
      return;
    }
    if (author.trim().length < 2) {
      setError(tr("Nama penulis atau sumber minimal 2 karakter.", "Author or source name must be at least 2 characters."));
      return;
    }
    if (body.trim().length < 100) {
      setError(tr("Isi artikel minimal 100 karakter agar dapat dipecah.", "Article body must be at least 100 characters to be split."));
      return;
    }
    setSplitting(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    const next = splitIntoChunks(body, targetId);
    setChunks(next);
    setSplitting(false);
    toast.success(tr(`${next.length} chunk draft dibuat. Tinjau sebelum ingest.`, `${next.length} draft chunks created. Review before ingest.`));
  }

  async function saveDraft() {
    if (title.trim().length < 5) {
      toast.error(tr("Judul minimal 5 karakter.", "Title must be at least 5 characters."));
      return;
    }
    if (body.trim().length < 100) {
      toast.error(tr("Isi artikel minimal 100 karakter.", "Article content must be at least 100 characters."));
      return;
    }
    setSaving(true);
    try {
      const result = await saveKbArticleAction(locale, {
        sourceId: source?.id,
        title: title.trim(),
        author: author.trim(),
        year: Number(year) || new Date().getFullYear(),
        categorySlug: category,
        sourceUrl: url.trim() || undefined,
        content: body,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(tr("Artikel disimpan dan chunk dibuat.", "Article saved and chunks created."));
      if (onDone) {
        onDone();
      } else {
        router.push(`/${locale}/admin/knowledge-base/${result.sourceId}/chunks`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {!onDone ? (
        <Link href={`/${locale}/admin/knowledge-base`} className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 hover:text-sage-700">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {tr("Kembali ke Knowledge Base", "Back to Knowledge Base")}
        </Link>
      ) : null}
      {!onDone ? (
        <PageHeader
          eyebrow={source ? tr("Edit artikel", "Edit article") : tr("Artikel baru", "New article")}
          title={source ? tr("Perbarui sumber dan chunk", "Update source and chunks") : tr("Tulis sumber bukti baru", "Write a new evidence source")}
          description={tr(
            "Isi artikel akan dipecah berdasarkan paragraf dan ukuran target 400–800 token. Tidak ada ingest otomatis sebelum kamu meninjau chunk.",
            "Article content will be split by paragraph and the 400–800 token target. Nothing is ingested automatically before you review the chunks.",
          )}
          actions={source ? <StatusBadge status={source.status} /> : <Badge variant="default">{tr("Draft", "Draft")}</Badge>}
        />
      ) : null}

      <div className="grid gap-5">
        <form onSubmit={split} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 sm:p-6" noValidate>
          {error ? <Alert variant="danger" className="mb-4">{error}</Alert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Judul artikel", "Article title")} htmlFor="article-title" hint={`${title.length}/250`} required>
              <Input id="article-title" value={title} onChange={(event) => setTitle(event.target.value.slice(0, 250))} />
            </Field>
            <Field label={tr("Kategori", "Category")} htmlFor="article-category" required>
              <Select id="article-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name[locale]}</option>
                ))}
              </Select>
            </Field>
            <Field label={tr("Penulis / penerbit", "Author / publisher")} htmlFor="article-author" required>
              <Input id="article-author" value={author} onChange={(event) => setAuthor(event.target.value)} />
            </Field>
            <Field label={tr("Tahun publikasi", "Publication year")} htmlFor="article-year">
              <Input id="article-year" type="number" min={1900} max={2100} value={year} onChange={(event) => setYear(event.target.value)} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label={tr("URL kanonis (opsional)", "Canonical URL (optional)")} htmlFor="article-url">
              <Input id="article-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." />
            </Field>
          </div>
          <div className="mt-4">
            <Field label={tr("Isi artikel", "Article body")} htmlFor="article-body" hint={`${body.length} karakter`} required>
              <Textarea id="article-body" value={body} onChange={(event) => setBody(event.target.value)} className="min-h-72" placeholder={tr("Tulis isi artikel yang akan menjadi sumber bukti...", "Write the article content that will become the evidence source...")} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            {!onDone ? (
              <p className="mr-auto max-w-md text-xs leading-relaxed text-bark-500">
                {tr(
                  "Rich text disimpan sebagai teks aman. Jangan menempel HTML mentah. Target chunk dapat diubah melalui konfigurasi env.",
                  "Rich text is stored as safe text. Do not paste raw HTML. Chunk targets can be changed through environment configuration.",
                )}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => onDone?.()} disabled={saving}>
                {tr("Batal", "Cancel")}
              </Button>
              <Button type="button" onClick={saveDraft} disabled={saving}>
                {saving ? tr("Menyimpan...", "Saving...") : tr("Simpan artikel", "Save article")}
                {saving ? <LoaderCircle className="size-4 spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              </Button>
              {!onDone ? (
                <Button type="submit" variant="secondary" disabled={splitting}>
                  {splitting ? tr("Memecah...", "Splitting...") : tr("Pecah Menjadi Chunk", "Split into chunks")}
                  {splitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Scissors className="size-4" aria-hidden="true" />}
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      {!onDone && chunks.length > 0 ? (
        <section className="rounded-[22px] border border-sage-300 bg-[#fffdf8] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-extrabold text-bark-900">{tr("Preview chunk", "Chunk preview")}</h2>
              <p className="mt-0.5 text-xs text-bark-500">{chunks.length} chunk · {chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0)} token</p>
            </div>
            <Link href={`/${locale}/admin/knowledge-base/${targetId}/chunks`} className={buttonVariants()}>
              {tr("Tinjau & ingest", "Review & ingest")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {chunks.map((chunk) => (
              <article key={chunk.id} className="rounded-md border border-cream-200 bg-cream-50 p-3.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{chunk.index + 1}</Badge>
                  <Badge variant={chunk.tokenCount >= 400 && chunk.tokenCount <= 800 ? "sage" : "default"}>{chunk.tokenCount} token</Badge>
                  <StatusBadge status={chunk.status} />
                </div>
                <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-bark-700">{chunk.content}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
