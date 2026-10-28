"use client";

import {
  ArrowRight,
  BookOpenCheck,
  BotMessageSquare,
  LoaderCircle,
  LockKeyhole,
  PenLine,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { createThreadAction } from "@/lib/actions/member";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerdictBadge } from "@/components/panacea/verdict-badge";
import { formatDate } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export function NewThreadForm({ initialClaimId, onDone }: { initialClaimId?: string; onDone?: () => void }) {
  const { locale, tr } = useI18n();
  const { claims, categories, role } = usePanacea();
  const router = useRouter();
  const canUseAnalysis = role === "user";
  const analysable = canUseAnalysis ? claims.filter((claim) => claim.analysis?.status === "succeeded") : [];
  const initialClaim = canUseAnalysis ? analysable.find((claim) => claim.id === initialClaimId) : undefined;
  const [mode, setMode] = useState(initialClaim ? "analysis" : "manual");
  const [selectedId, setSelectedId] = useState(initialClaim?.id ?? "");
  const [title, setTitle] = useState(initialClaim?.originalText.slice(0, 140) ?? "");
  const [body, setBody] = useState(initialClaim?.analysis?.summary[locale] ?? "");
  const [category, setCategory] = useState(initialClaim?.categorySlug ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function chooseClaim(id: string) {
    if (!canUseAnalysis) return;
    setSelectedId(id);
    const claim = analysable.find((item) => item.id === id);
    if (!claim) return;
    setTitle(claim.originalText.slice(0, 140));
    setBody(claim.analysis?.summary[locale] ?? "");
    setCategory(claim.categorySlug);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (title.trim().length < 10) {
      setError(tr("Judul thread minimal 10 karakter.", "Thread title must be at least 10 characters."));
      return;
    }
    if (title.length > 150) {
      setError(tr("Judul thread maksimal 150 karakter.", "Thread title must be 150 characters or less."));
      return;
    }
    if (body.trim().length < 20) {
      setError(tr("Isi thread minimal 20 karakter.", "Thread body must be at least 20 characters."));
      return;
    }
    if (body.length > 3000) {
      setError(tr("Isi thread maksimal 3.000 karakter.", "Thread body must be 3,000 characters or less."));
      return;
    }
    setLoading(true);
    const payload = new FormData();
    payload.set("title", title.trim());
    payload.set("body", body.trim());
    payload.set("categorySlug", category || "gaya-hidup");
    const result = await createThreadAction(locale, payload);
    setLoading(false);
    if (result.error || !result.threadId) {
      setError(result.error ?? tr("Thread gagal dibuat.", "The thread could not be created."));
      return;
    }
    toast.success(tr("Thread dibuat. Komentar pertama akan melewati moderasi.", "Thread created. Your first comment will pass moderation."));
    onDone?.();
    router.push(`/${locale}/forum/${result.threadId}`);
  }

  return (
    <form onSubmit={submit} noValidate>
          {canUseAnalysis ? (
          <Tabs value={mode} onValueChange={setMode} variant="cozy">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="manual">
                <PenLine className="size-3.5" aria-hidden="true" />
                {tr("Diskusi manual", "Manual discussion")}
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <BotMessageSquare className="size-3.5" aria-hidden="true" />
                {tr("Dari hasil analisis AI", "From AI analysis")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-5">
              {analysable.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[13px] font-bold text-bark-700">
                    {tr("Pilih klaim milikmu", "Choose one of your claims")}
                  </p>
                  {analysable.map((claim) => (
                    <button
                      key={claim.id}
                      type="button"
                      onClick={() => chooseClaim(claim.id)}
                      aria-pressed={selectedId === claim.id}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-md border p-3.5 text-left transition",
                        selectedId === claim.id
                          ? "border-sage-600 bg-sage-100/60"
                          : "border-border-soft bg-cream-50 hover:bg-cream-100",
                      )}
                    >
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-white text-sage-700 shadow-soft">
                        <BookOpenCheck className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-xs font-bold leading-snug text-bark-900">{claim.originalText}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-2">
                          {claim.analysis?.verdict ? <VerdictBadge verdict={claim.analysis.verdict} size="sm" palette="warm" /> : null}
                          <span className="text-xs text-bark-500">{formatDate(claim.createdAt, locale)}</span>
                        </span>
                      </span>
                    </button>
                  ))}
                  <p className="mt-2 text-xs leading-relaxed text-bark-500">
                    {tr(
                      "Isi thread akan diisi dari ringkasan analisis. Kamu tetap dapat menyuntingnya sebelum mengirim.",
                      "The thread body will be filled from the analysis summary. You can still edit it before posting.",
                    )}
                  </p>
                </div>
              ) : (
                <Alert variant="info">
                  {tr("Belum ada hasil analisis yang bisa dipakai. Buat diskusi manual dulu.", "No analysis results are available yet. Start a manual discussion first.")}
                </Alert>
              )}
            </TabsContent>
          </Tabs>
          ) : null}

          {error ? <Alert variant="danger" className="mt-4">{error}</Alert> : null}

          <div className="mt-5 space-y-4">
            <Field
              label={tr("Judul thread", "Thread title")}
              htmlFor="thread-title"
              hint={`${title.length}/150`}
              required
            >
              <Input
                id="thread-title"
                value={title}
                onChange={(event) => setTitle(event.target.value.slice(0, 150))}
                placeholder={tr("Contoh: Bagaimana memahami batasan bukti pada hasil verifikasi?", "Example: How should I understand evidence limitations in a verdict?")}
              />
            </Field>
            <Field
              label={tr("Isi thread", "Thread body")}
              htmlFor="thread-body"
              hint={`${body.length}/3000`}
              required
            >
              <Textarea
                id="thread-body"
                value={body}
                onChange={(event) => setBody(event.target.value.slice(0, 3000))}
                placeholder={tr("Tulis konteks, pertanyaan, atau pengalamanmu...", "Write your context, question, or experience...")}
                className="min-h-44"
              />
            </Field>
            <Field label={tr("Kategori", "Category")} htmlFor="thread-category">
              <Select id="thread-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">{tr("Pilih kategori", "Choose a category")}</option>
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
                "Jangan menulis nama, nomor telepon, alamat, atau data kesehatan orang lain. Thread yang melanggar dapat disembunyikan.",
                "Do not write names, phone numbers, addresses, or another person's health data. Threads that violate this may be hidden.",
              )}
            </p>
          </div>

          <Button type="submit" variant="cozy" size="lg" fullWidth className="mt-4" disabled={loading}>
            {loading ? tr("Membuat thread...", "Creating thread...") : tr("Buat Thread", "Create Thread")}
            {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
          </Button>
    </form>
  );
}
