"use client";

import {
  ArrowRight,
  CalendarDays,
  FileImage,
  Globe2,
  ImagePlus,
  Link2,
  LoaderCircle,
  LockKeyhole,
  SearchCheck,
  Sparkles,
  Type,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { analyzeClaimAction } from "@/lib/actions/member";
import { MAX_CLAIM_TEXT_LENGTH, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/limits";
import { AnalysisLoader } from "@/components/member/analysis-loader";
import { waitForClaimOutcome } from "@/components/member/wait-for-claim";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/panacea/status-badge";
import { formatDate } from "@/lib/i18n/format";
import { MemberPageHeader } from "./member-page-header";

export function ClaimComposer() {
  const { locale, tr } = useI18n();
  const { categories, claims, refresh } = usePanacea();
  const router = useRouter();
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("auto");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [failedClaimId, setFailedClaimId] = useState("");
  const [loading, setLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const inputRef = useRef<HTMLInputElement>(null);
  const recentClaims = [...claims]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function chooseFile(next: File | null) {
    setError("");
    if (!next) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) {
      setError(tr("Gunakan gambar JPG, PNG, atau WEBP.", "Use a JPG, PNG, or WEBP image."));
      return;
    }
    if (next.size > MAX_IMAGE_UPLOAD_BYTES) {
      setError(tr("Ukuran gambar maksimal 5 MB.", "Image size must be 5 MB or less."));
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(next));
    setFile(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (tab === "text" && text.trim().length < 20) {
      setError(tr("Teks klaim minimal 20 karakter.", "Claim text must be at least 20 characters."));
      return;
    }
    if (tab === "text" && text.length > MAX_CLAIM_TEXT_LENGTH) {
      setError(
        tr(
          `Teks klaim maksimal ${MAX_CLAIM_TEXT_LENGTH.toLocaleString("id-ID")} karakter.`,
          `Claim text must be ${MAX_CLAIM_TEXT_LENGTH.toLocaleString("en-US")} characters or less.`,
        ),
      );
      return;
    }
    if (tab === "url" && !/^https?:\/\/\S+$/i.test(url.trim())) {
      setError(tr("Masukkan URL HTTP/HTTPS yang valid.", "Enter a valid HTTP/HTTPS URL."));
      return;
    }
    if (tab === "url" && url.length > 2048) {
      setError(tr("URL maksimal 2.048 karakter.", "URL must be 2,048 characters or less."));
      return;
    }
    if (tab === "image" && !file) {
      setError(tr("Pilih gambar klaim terlebih dahulu.", "Choose a claim image first."));
      return;
    }

    setLoading(true);
    setFailedClaimId("");
    const payload = new FormData();
    payload.set("inputType", tab);
    payload.set("text", text);
    payload.set("url", url);
    payload.set("language", language);
    payload.set("categorySlug", category);
    payload.set("idempotencyKey", idempotencyKey);
    if (file) payload.set("image", file);

    let navigating = false;
    try {
      const result = await analyzeClaimAction(locale, payload);
      if (result.error) {
        toast.error(result.error);
        setError(result.error);
        return;
      }
      if (!result.claimId) {
        const message = tr("Klaim tidak dapat dikirim.", "The claim could not be sent.");
        toast.error(message);
        setError(message);
        return;
      }

      const outcome = await waitForClaimOutcome(refresh, result.claimId);
      if (outcome === "succeeded") {
        toast.success(
          tr("Analisis selesai. Membuka hasil.", "Analysis complete. Opening the result."),
        );
        navigating = true;
        router.push(`/${locale}/cek-klaim/${result.claimId}`);
        return;
      }

      setFailedClaimId(result.claimId);
      setIdempotencyKey(crypto.randomUUID());
      if (outcome === "failed") {
        const message = tr(
          "Analisis gagal. Klaim tetap tersimpan dan bisa dianalisis ulang.",
          "The analysis failed. Your claim is saved and can be analysed again.",
        );
        toast.error(message);
        setError(message);
        return;
      }

      const message = tr(
        "Analisis masih berjalan di server. Cek lagi sebentar lagi.",
        "The analysis is still running on the server. Check again shortly.",
      );
      toast.info(message);
      setError(message);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : tr("Analisis gagal.", "The analysis failed.");
      toast.error(message);
      setError(message);
    } finally {
      if (!navigating) setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <MemberPageHeader
        icon={SearchCheck}
        title={tr("Apa klaim kesehatan yang ingin kamu periksa?", "Which health claim would you like to check?")}
        description={tr(
          "Mulai dari teks, tautan, atau gambar. Analisis awal AI akan menelusuri Knowledge Base internal dan Europe PMC.",
          "Start with text, a link, or an image. Initial AI analysis will search the internal Knowledge Base and Europe PMC.",
        )}
      />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <form
          onSubmit={submit}
          className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow sm:p-6"
          noValidate
          aria-busy={loading}
        >
          <Tabs value={tab} onValueChange={(value) => { setTab(value); setError(""); }} variant="cozy">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="text">
                <Type className="size-3.5" aria-hidden="true" />
                {tr("Teks", "Text")}
              </TabsTrigger>
              <TabsTrigger value="url">
                <Link2 className="size-3.5" aria-hidden="true" />
                URL
              </TabsTrigger>
              <TabsTrigger value="image">
                <ImagePlus className="size-3.5" aria-hidden="true" />
                {tr("Gambar", "Image")}
              </TabsTrigger>
            </TabsList>

            <div className="mt-5">
              {error ? <Alert id="claim-error" variant="danger" className="mb-4">{error}</Alert> : null}

              {failedClaimId ? (
                <Link
                  href={`/${locale}/cek-klaim/${failedClaimId}`}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-sage-700 hover:underline"
                >
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                  {tr("Buka detail klaim", "Open the claim detail")}
                </Link>
              ) : null}

              <TabsContent value="text">
                <Field
                  label={tr("Teks klaim", "Claim text")}
                  htmlFor="claim-text"
                  hint={`${text.length}/${MAX_CLAIM_TEXT_LENGTH}`}
                  required
                >
                  <Textarea
                    id="claim-text"
                    value={text}
                    onChange={(event) => setText(event.target.value.slice(0, MAX_CLAIM_TEXT_LENGTH))}
                    placeholder={tr(
                      "Contoh: Minum air garam hangat bisa menyembuhkan flu dalam sehari.",
                      "Example: Drinking warm salt water can cure flu in one day.",
                    )}
                    className="min-h-44 text-base"
                    aria-invalid={tab === "text" && error ? true : undefined}
                    aria-describedby={tab === "text" && error ? "claim-text-hint claim-error" : "claim-text-hint"}
                  />
                </Field>
                <p id="claim-text-hint" className="mt-2 text-xs leading-relaxed text-bark-500">
                  {tr("Minimal 20 karakter. Sertakan konteks bila klaim berasal dari pesan atau video.", "At least 20 characters. Include context when the claim comes from a message or video.")}
                </p>
              </TabsContent>

              <TabsContent value="url">
                <Field
                  label={tr("Tautan artikel", "Article link")}
                  htmlFor="claim-url"
                  hint={tr("Hanya HTTP/HTTPS", "HTTP/HTTPS only")}
                  required
                >
                  <div className="relative">
                    <Globe2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
                    <Input
                      id="claim-url"
                      type="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://contoh.com/artikel-kesehatan"
                      className="pl-11"
                      aria-invalid={tab === "url" && error ? true : undefined}
                      aria-describedby={tab === "url" && error ? "claim-error" : undefined}
                    />
                  </div>
                </Field>
                <div className="mt-3 rounded-md border border-[#eae5d9] bg-cream-100 p-3.5 text-xs leading-relaxed text-bark-700">
                  {tr(
                    "Sistem akan mengambil judul dan isi utama artikel, lalu merangkum klaim kesehatan yang terkandung. URL privat, IP lokal, dan redirect berbahaya diblokir di server.",
                    "The system will fetch the article title and main content, then summarise the health claim it contains. Private URLs, local IPs, and unsafe redirects are blocked server-side.",
                  )}
                </div>
              </TabsContent>

              <TabsContent value="image">
                <span className="text-[13px] font-bold text-bark-700">{tr("Gambar klaim", "Claim image")} <span className="text-rose-700">*</span></span>
                {file && preview ? (
                  <div className="mt-2 overflow-hidden rounded-lg border border-border-soft bg-cream-50 p-3">
                    <div className="relative mx-auto max-h-72 w-fit overflow-hidden rounded-md">
                      <Image
                        src={preview}
                        alt={tr("Pratinjau gambar klaim", "Claim image preview")}
                        width={640}
                        height={420}
                        unoptimized
                        className="max-h-72 w-auto object-contain"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-semibold text-bark-700">{file.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (preview) URL.revokeObjectURL(preview);
                          setPreview("");
                          setFile(null);
                          if (inputRef.current) inputRef.current.value = "";
                        }}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                        {tr("Hapus", "Remove")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="claim-image"
                    className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-strong bg-cream-50 px-6 py-10 text-center transition hover:border-sage-600 hover:bg-sage-100/40"
                  >
                    <span className="grid size-12 place-items-center rounded-full bg-white text-sage-700 shadow-soft">
                      <FileImage className="size-5" aria-hidden="true" />
                    </span>
                    <span className="mt-3 text-sm font-extrabold text-bark-900">
                      {tr("Klik untuk memilih gambar", "Click to choose an image")}
                    </span>
                    <span className="mt-1 text-xs text-bark-500">JPG, PNG, WEBP · {tr("maksimal 5 MB", "max 5 MB")}</span>
                    <input
                      ref={inputRef}
                      id="claim-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                      aria-invalid={tab === "image" && error ? true : undefined}
                      aria-describedby={tab === "image" && error ? "claim-error" : undefined}
                    />
                  </label>
                )}
                <p className="mt-2 text-xs leading-relaxed text-bark-500">
                  {tr(
                    "EXIF dan nama file asli dihapus dari salinan pemrosesan. Gambar disimpan di bucket privat.",
                    "EXIF and the original filename are removed from the processing copy. Images are stored in a private bucket.",
                  )}
                </p>
              </TabsContent>
            </div>
          </Tabs>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label={tr("Bahasa asal", "Source language")} htmlFor="claim-language">
              <Select id="claim-language" value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option value="auto">{tr("Deteksi otomatis", "Detect automatically")}</option>
                <option value="id">Indonesia</option>
                <option value="en">English</option>
              </Select>
            </Field>
            <Field label={tr("Kategori (opsional)", "Category (optional)")} htmlFor="claim-category">
              <Select id="claim-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">{tr("Biarkan sistem menilai", "Let the system decide")}</option>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name[locale]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-5 flex gap-2.5 rounded-[14px] border border-[#e8e2d5] bg-cream-100/70 p-3.5 text-xs leading-relaxed text-bark-700">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-sage-700" aria-hidden="true" />
            <p>
              {tr(
                "Klaim dan file asli bersifat privat. Analisis awal AI bukan diagnosis atau putusan pakar.",
                "Claims and original files are private. Initial AI analysis is not a diagnosis or expert verdict.",
              )}
            </p>
          </div>

          <Button type="submit" variant="cozy" size="lg" fullWidth className="mt-4" disabled={loading}>
            {loading ? tr("Sedang menganalisis...", "Analysing...") : tr("Analisis Klaim", "Analyse Claim")}
            {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-sm font-extrabold text-bark-900">
                {tr("Riwayat klaim terbaru", "Recent claim history")}
              </h2>
              <Link href={`/${locale}/riwayat-klaim`} className="text-xs font-bold text-sage-700 hover:underline">
                {tr("Lihat semua", "View all")}
              </Link>
            </div>
            {recentClaims.length > 0 ? (
              <ul className="mt-3 divide-y divide-cream-200">
                {recentClaims.map((claim) => (
                  <li key={claim.id} className="py-2.5 first:pt-0 last:pb-0">
                    <Link
                      href={`/${locale}/cek-klaim/${claim.id}`}
                      className="line-clamp-2 text-xs font-bold leading-snug text-bark-900 hover:text-sage-700"
                    >
                      {claim.originalText}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-bark-500">
                      <StatusBadge status={claim.status} palette="warm" />
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" aria-hidden="true" />
                        {formatDate(claim.createdAt, locale)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-bark-500">
                {tr(
                  "Belum ada klaim yang pernah kamu periksa.",
                  "You have not checked any claims yet.",
                )}
              </p>
            )}
          </div>
        </aside>
      </div>

      {loading ? <AnalysisLoader /> : null}
    </div>
  );
}
