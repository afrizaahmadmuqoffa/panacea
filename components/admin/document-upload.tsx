"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  FileUp,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  X,
} from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { uploadKbDocumentAction } from "@/lib/actions/admin";
import { MAX_KB_DOCUMENT_BYTES } from "@/lib/limits";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import type { Category } from "@/lib/types";

export function DocumentUpload({ categories, onDone }: { categories: Category[]; onDone?: () => void }) {
  const { locale, tr } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("2026");
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ sourceId: string; chunkCount: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function choose(next: File | null) {
    setError("");
    if (!next) return;
    const allowed = [".pdf", ".docx", ".txt", ".md"];
    const extension = `.${next.name.split(".").pop()?.toLowerCase()}`;
    if (!allowed.includes(extension)) {
      setError(tr("Format harus PDF, DOCX, TXT, atau MD.", "Format must be PDF, DOCX, TXT, or MD."));
      return;
    }
    if (next.size > MAX_KB_DOCUMENT_BYTES) {
      setError(tr("Ukuran dokumen maksimal 15 MB.", "Document size must be 15 MB or less."));
      return;
    }
    setFile(next);
    if (!title) setTitle(next.name.replace(/\.[^.]+$/, "").slice(0, 250));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!file) {
      setError(tr("Pilih dokumen terlebih dahulu.", "Choose a document first."));
      return;
    }
    if (title.trim().length < 5) {
      setError(tr("Judul minimal 5 karakter.", "Title must be at least 5 characters."));
      return;
    }
    if (author.trim().length < 2) {
      setError(tr("Sumber atau penerbit minimal 2 karakter.", "Source or publisher must be at least 2 characters."));
      return;
    }
    setSaving(true);
    const payload = new FormData();
    payload.set("file", file);
    payload.set("title", title.trim());
    payload.set("author", author.trim());
    payload.set("year", year);
    payload.set("categorySlug", category);
    const result = await uploadKbDocumentAction(locale, payload);
    setSaving(false);
    if (result.error || !result.sourceId) {
      setError(result.error ?? tr("Dokumen gagal diunggah.", "The document could not be uploaded."));
      return;
    }
    setDone({ sourceId: result.sourceId, chunkCount: result.chunkCount ?? 0 });
    toast.success(tr("Dokumen diekstrak dan dipecah menjadi draft chunk.", "Document extracted and split into draft chunks."));
    if (onDone) {
      onDone();
    }
  }

  if (done && !onDone) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href={`/${locale}/admin/knowledge-base`} className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 hover:text-sage-700">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {tr("Kembali ke Knowledge Base", "Back to Knowledge Base")}
        </Link>
        <div className="rounded-[22px] border border-sage-300 bg-[#fffdf8] p-6 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-sage-100 text-sage-700">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-extrabold text-bark-900">{tr("Dokumen siap ditinjau", "Document ready for review")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-bark-700">
            {tr(
              "Teks diekstrak, header/footer berulang dibersihkan, dan chunk draft dibuat. Belum ada yang masuk KB sebelum disetujui dan di-ingest.",
              "Text was extracted, repeated headers/footers cleaned, and draft chunks created. Nothing enters the KB before approval and ingest.",
            )}
          </p>
          <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2">
            <div className="rounded-md bg-[#fff7de] p-3">
              <p className="font-heading text-lg font-extrabold text-bark-900">{file?.name.split(".").pop()?.toUpperCase()}</p>
              <p className="text-xs text-bark-500">{tr("format", "format")}</p>
            </div>
            <div className="rounded-md bg-[#fff7de] p-3">
              <p className="font-heading text-lg font-extrabold text-bark-900">{done.chunkCount}</p>
              <p className="text-xs text-bark-500">{tr("draft chunk", "draft chunks")}</p>
            </div>
            <div className="rounded-md bg-[#fff7de] p-3">
              <p className="font-heading text-lg font-extrabold text-bark-900">{done.chunkCount > 0 ? "OK" : "-"}</p>
              <p className="text-xs text-bark-500">{tr("ekstraksi", "extraction")}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href={`/${locale}/admin/knowledge-base/${done.sourceId}/chunks`} className={buttonVariants()}>
              {tr("Tinjau chunk", "Review chunks")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Button type="button" variant="secondary" onClick={() => { setDone(null); setFile(null); }}>
              {tr("Unggah dokumen lain", "Upload another")}
              <RefreshCw className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!onDone ? (
        <Link href={`/${locale}/admin/knowledge-base`} className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 transition hover:text-sage-700">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {tr("Kembali ke Knowledge Base", "Back to Knowledge Base")}
        </Link>
      ) : null}
      {!onDone ? (
        <PageHeader
          eyebrow={tr("Unggah dokumen", "Upload document")}
          title={tr("Tambahkan dokumen sumber", "Add a source document")}
          description={tr(
            "PDF, DOCX, TXT, atau MD hingga 15 MB. Sistem mengekstrak teks dan membuat chunk untuk ditinjau.",
            "PDF, DOCX, TXT, or MD up to 15 MB. The system extracts text and creates chunks for review.",
          )}
          actions={<Badge variant="sky"><LockKeyhole className="size-3.5" aria-hidden="true" />{tr("Bucket privat", "Private bucket")}</Badge>}
        />
      ) : null}

      <div className="grid gap-5">
        <form
          onSubmit={submit}
          className={
            onDone
              ? "min-w-0"
              : "min-w-0 rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 sm:p-6"
          }
          noValidate
        >
          {error ? <Alert variant="danger" className="mb-4">{error}</Alert> : null}
          {file ? (
            <div className="rounded-lg border border-sage-300 bg-sage-100/60 p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-sage-700 shadow-soft">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-bark-900">{file.name}</p>
                  <p className="mt-0.5 text-xs text-bark-500">{(file.size / 1024 / 1024).toFixed(2)} MB · {file.name.split(".").pop()?.toUpperCase()}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }} aria-label={tr("Hapus file", "Remove file")}>
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="kb-document"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-strong bg-cream-50 px-6 text-center transition hover:border-sage-600 hover:bg-sage-100/30 ${onDone ? "py-6" : "py-12"}`}
            >
              <span className={`grid place-items-center rounded-full bg-white text-sage-700 shadow-soft ${onDone ? "size-10" : "size-14"}`}>
                <FileUp className={onDone ? "size-5" : "size-6"} aria-hidden="true" />
              </span>
              <span className="mt-3 text-sm font-extrabold text-bark-900">{tr("Pilih dokumen sumber", "Choose a source document")}</span>
              <span className="mt-1 text-xs text-bark-500">PDF, DOCX, TXT, MD · {tr("maksimal 15 MB", "max 15 MB")}</span>
              <input ref={inputRef} id="kb-document" type="file" accept=".pdf,.docx,.txt,.md" className="sr-only" onChange={(event) => choose(event.target.files?.[0] ?? null)} />
            </label>
          )}

          <div className={`mt-5 grid gap-4 ${onDone ? "" : "sm:grid-cols-2"}`}>
            <Field label={tr("Judul dokumen", "Document title")} htmlFor="doc-title" hint={tr("5–250 karakter", "5–250 characters")} required>
              <Input id="doc-title" value={title} onChange={(event) => setTitle(event.target.value.slice(0, 250))} />
            </Field>
            <Field label={tr("Kategori", "Category")} htmlFor="doc-category" required>
              <Select id="doc-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name[locale]}</option>
                ))}
              </Select>
            </Field>
            <Field label={tr("Sumber / penerbit", "Source / publisher")} htmlFor="doc-author" required>
              <Input id="doc-author" value={author} onChange={(event) => setAuthor(event.target.value)} />
            </Field>
            <Field label={tr("Tahun", "Year")} htmlFor="doc-year">
              <Input id="doc-year" type="number" min={1900} max={2100} value={year} onChange={(event) => setYear(event.target.value)} />
            </Field>
          </div>

          {saving ? (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-sage-300 bg-sage-100 p-4 text-xs font-semibold text-sage-700" aria-live="polite">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              {tr("Mengekstrak dan memecah dokumen...", "Extracting and splitting the document...")}
            </div>
          ) : null}

          <Button type="submit" size="lg" fullWidth className="mt-5" disabled={saving}>
            {saving ? tr("Memproses dokumen...", "Processing document...") : tr("Unggah & Pecah Menjadi Chunk", "Upload & Split into Chunks")}
            {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <FileUp className="size-4" aria-hidden="true" />}
          </Button>
          {onDone ? null : (
            <p className="mt-2 text-center text-xs leading-relaxed text-bark-500">
              {tr("Dokumen disimpan di bucket privat dengan nama acak. Metadata asli tidak dipakai sebagai path.", "Documents are stored in a private bucket with a random name. Original metadata is not used as the path.")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
