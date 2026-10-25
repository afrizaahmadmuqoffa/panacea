"use client";

import {
  ArrowRight,
  CheckCircle2,
  FileText,
  FileUp,
  LoaderCircle,
  Scissors,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input, Select, Textarea } from "@/components/ui/input";
import { createSuggestionAction } from "@/lib/actions/reviewer";
import type { Category } from "@/lib/types";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

export function NewSuggestionForm({
  sources,
  categories,
  onDone,
}: {
  sources: Array<{ id: string; title: string }>;
  categories: Category[];
  onDone?: () => void;
}) {
  const { locale, tr } = useI18n();
  const [type, setType] = useState("article");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState(sources[0]?.id ?? "");
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<{ suggestionId: string; chunkCount: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function choose(next: File | null) {
    setError("");
    if (!next) return;
    if (!ALLOWED_EXTENSIONS.includes(`.${next.name.split(".").pop()?.toLowerCase()}`)) {
      setError(tr("Format harus PDF, DOCX, TXT, atau MD.", "Format must be PDF, DOCX, TXT, or MD."));
      return;
    }
    setFile(next);
    if (!title) setTitle(next.name.replace(/\.[^.]+$/, ""));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (title.trim().length < 5) {
      setError(tr("Judul saran minimal 5 karakter.", "Suggestion title must be at least 5 characters."));
      return;
    }
    if (!category) {
      setError(tr("Pilih kategori sumber.", "Choose a source category."));
      return;
    }
    if (author.trim().length < 2) {
      setError(tr("Nama penulis atau penerbit minimal 2 karakter.", "Author or publisher must be at least 2 characters."));
      return;
    }
    const yearNumber = Number(year);
    if (!Number.isInteger(yearNumber) || yearNumber < 1800 || yearNumber > 2200) {
      setError(tr("Tahun publikasi harus antara 1800 dan 2200.", "Publication year must be between 1800 and 2200."));
      return;
    }
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) {
      setError(tr("URL kanonis harus dimulai dengan http:// atau https://.", "Canonical URL must start with http:// or https://."));
      return;
    }
    if (note.trim().length < 20) {
      setError(tr("Catatan untuk admin minimal 20 karakter.", "Note to admins must be at least 20 characters."));
      return;
    }
    if (type === "document" && !file) {
      setError(tr("Pilih dokumen yang ingin diajukan.", "Choose the document you want to submit."));
      return;
    }
    if (type !== "document" && content.trim().length < 100) {
      setError(
        tr(
          "Isi bukti minimal 100 karakter agar dapat dipecah menjadi chunk.",
          "Evidence content must be at least 100 characters to be split into chunks.",
        ),
      );
      return;
    }
    if (type === "chunk" && !target) {
      setError(tr("Pilih sumber KB yang ingin ditambah chunk-nya.", "Choose the KB source to add chunks to."));
      return;
    }

    setLoading(true);
    const payload = new FormData();
    payload.set("title", title.trim());
    payload.set("note", note.trim());
    payload.set("categorySlug", category);
    payload.set("author", author.trim());
    payload.set("year", String(yearNumber));
    if (url.trim()) payload.set("sourceUrl", url.trim());
    if (type === "chunk") payload.set("targetSourceId", target);
    if (type === "document" && file) payload.set("file", file);
    else payload.set("content", content.trim());
    const result = await createSuggestionAction(locale, payload);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSubmitted({ suggestionId: result.suggestionId ?? "", chunkCount: result.chunkCount ?? 0 });
    toast.success(
      tr(
        `Saran dikirim. ${result.chunkCount ?? 0} chunk dibuat otomatis.`,
        `Suggestion sent. ${result.chunkCount ?? 0} chunks were created automatically.`,
      ),
    );
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-sage-300 bg-sage-100/60 p-5 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-white text-sage-700 shadow-soft">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-3 font-heading text-lg font-extrabold text-bark-900">{tr("Saran terkirim", "Suggestion sent")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-bark-700">
            {tr(
              `Isi bukti dipecah otomatis menjadi ${submitted.chunkCount} chunk. Tinjau dan rapikan chunk sebelum admin menerimanya.`,
              `The evidence was split into ${submitted.chunkCount} chunks automatically. Review and tidy the chunks before admins receive them.`,
            )}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/${locale}/reviewer/knowledge-base/saran/${submitted.suggestionId}/chunks`} className={buttonVariants()}>
            {tr("Kelola chunk", "Manage chunks")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Button variant="secondary" onClick={() => onDone?.()}>
            {tr("Tutup", "Close")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {error ? <Alert variant="danger">{error}</Alert> : null}

        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
          <h2 className="font-heading text-base font-extrabold text-bark-900">{tr("Detail saran", "Suggestion details")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={tr("Jenis saran", "Suggestion type")} htmlFor="suggestion-type">
              <Select id="suggestion-type" value={type} onChange={(event) => { setType(event.target.value); setError(""); }}>
                <option value="article">{tr("Artikel baru", "New article")}</option>
                <option value="document">{tr("Dokumen baru", "New document")}</option>
                <option value="chunk">{tr("Tambahan chunk sumber yang ada", "Chunk addition to an existing source")}</option>
              </Select>
            </Field>
            {type === "chunk" ? (
              <Field label={tr("Sumber KB target", "Target KB source")} htmlFor="suggestion-target" required>
                <Select id="suggestion-target" value={target} onChange={(event) => setTarget(event.target.value)}>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>{source.title}</option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field label={tr("Kategori", "Category")} htmlFor="suggestion-category" required>
              <Select id="suggestion-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>{item.name[locale]}</option>
                ))}
              </Select>
            </Field>
            <Field label={tr("Penulis / penerbit", "Author / publisher")} htmlFor="suggestion-author" required>
              <Input id="suggestion-author" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder={tr("Contoh: WHO, Kemenkes, atau nama jurnal", "Example: WHO, Ministry of Health, or a journal name")} />
            </Field>
            <Field label={tr("Tahun publikasi", "Publication year")} htmlFor="suggestion-year">
              <Input id="suggestion-year" type="number" min={1800} max={2100} value={year} onChange={(event) => setYear(event.target.value)} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label={tr("Judul saran", "Suggestion title")} htmlFor="suggestion-title" hint={`${title.length}/250`} required>
              <Input id="suggestion-title" value={title} onChange={(event) => setTitle(event.target.value.slice(0, 250))} placeholder={tr("Contoh: Bukti tambahan tentang interaksi herbal dan kemoterapi", "Example: Additional evidence on herbal and chemotherapy interactions")} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label={tr("URL kanonis (opsional)", "Canonical URL (optional)")} htmlFor="suggestion-url">
              <Input id="suggestion-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." />
            </Field>
          </div>
          <div className="mt-4">
            <Field label={tr("Catatan untuk admin", "Note to admins")} htmlFor="suggestion-note" hint={`${note.length} karakter`} required>
              <Textarea id="suggestion-note" value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24" placeholder={tr("Jelaskan mengapa bukti ini penting dan bagaimana kaitannya dengan klaim yang sering muncul.", "Explain why this evidence matters and how it relates to recurring claims.")} />
            </Field>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-md bg-sage-100 text-sage-700">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-base font-extrabold text-bark-900">{tr("Isi bukti", "Evidence content")}</h2>
              <p className="text-xs text-bark-500">{tr("Dipecah otomatis menjadi chunk setelah dikirim.", "Split into chunks automatically after submitting.")}</p>
            </div>
          </div>

          {type === "document" ? (
            <div className="mt-4">
              {file ? (
                <div className="rounded-lg border border-sage-300 bg-sage-100/60 p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 place-items-center rounded-md bg-white text-sage-700 shadow-soft">
                      <FileUp className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-bark-900">{file.name}</p>
                      <p className="mt-0.5 text-xs text-bark-500">{(file.size / 1024 / 1024).toFixed(2)} MB · {file.name.split(".").pop()?.toUpperCase()}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }} aria-label={tr("Hapus file", "Remove file")}>
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label htmlFor="suggestion-document" className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-strong bg-cream-50 px-6 py-10 text-center transition hover:border-sage-600 hover:bg-sage-100/30">
                  <span className="grid size-12 place-items-center rounded-full bg-white text-sage-700 shadow-soft">
                    <FileUp className="size-5" aria-hidden="true" />
                  </span>
                  <span className="mt-3 text-sm font-extrabold text-bark-900">{tr("Pilih dokumen sumber", "Choose a source document")}</span>
                  <span className="mt-1 text-xs text-bark-500">PDF, DOCX, TXT, MD · {tr("maksimal 15 MB", "max 15 MB")}</span>
                  <input ref={inputRef} id="suggestion-document" type="file" accept=".pdf,.docx,.txt,.md" className="sr-only" onChange={(event) => choose(event.target.files?.[0] ?? null)} />
                </label>
              )}
              <p className="mt-3 text-xs leading-relaxed text-bark-500">
                {tr(
                  "Teks dokumen diekstrak di server lalu dipecah menjadi chunk. File asli tidak disimpan pada saran.",
                  "The document text is extracted on the server and split into chunks. The original file is not stored with the suggestion.",
                )}
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <Field label={tr("Isi artikel atau bukti", "Article or evidence content")} htmlFor="suggestion-content" hint={`${content.length} karakter`} required>
                <Textarea id="suggestion-content" value={content} onChange={(event) => setContent(event.target.value)} className="min-h-72" placeholder={tr("Tulis isi bukti yang akan dipotong menjadi chunk otomatis...", "Write the evidence content that will be split into chunks automatically...")} />
              </Field>
              <p className="mt-3 text-xs leading-relaxed text-bark-500">
                {tr(
                  "Pecahan dibuat pada batas kalimat dengan target 400–800 token dan tumpang tindih 80 token.",
                  "Splits happen at sentence boundaries targeting 400–800 tokens with 80 tokens of overlap.",
                )}
              </p>
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cream-200 bg-cream-100 p-4">
          <p className="max-w-md text-xs leading-relaxed text-bark-700">
            {tr(
              "Saran tidak masuk KB sebelum admin menyetujui dan melakukan ingest.",
              "A suggestion does not enter the KB until an admin approves and ingests it.",
            )}
          </p>
          <Button type="submit" disabled={loading}>
            {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Scissors className="size-4" aria-hidden="true" />}
            {loading ? tr("Mengirim...", "Sending...") : tr("Kirim & Pecah", "Send & Split")}
          </Button>
        </div>
      </form>
  );
}