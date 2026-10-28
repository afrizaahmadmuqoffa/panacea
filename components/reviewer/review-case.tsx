"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookMarked,
  CheckCircle2,
  ClipboardX,
  FileCheck2,
  Library,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { submitReviewAction } from "@/lib/actions/reviewer";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/label";
import { Input, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/panacea/status-badge";
import { VerdictBadge } from "@/components/panacea/verdict-badge";
import { categoryName } from "@/lib/data/categories";
import { formatDate } from "@/lib/i18n/format";
import type { KBSource, ReviewerTask, Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";

const verdictOptions: Array<{ value: Verdict; id: string; en: string }> = [
  { value: "supported", id: "Didukung bukti", en: "Supported" },
  { value: "partly_supported", id: "Sebagian didukung", en: "Partly supported" },
  { value: "contradicted", id: "Bertentangan dengan bukti", en: "Contradicted" },
  { value: "insufficient_evidence", id: "Bukti belum cukup", en: "Insufficient evidence" },
];

const MAX_EVIDENCE = 20;

type CustomEvidence = {
  id: string;
  title: string;
  source: string;
  year: number;
  identifier?: string;
  url?: string;
};

export function ReviewCase({
  task,
  kbSources = [],
}: {
  task?: ReviewerTask;
  kbSources?: KBSource[];
}) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const [verdict, setVerdict] = useState<Verdict>(task?.aiVerdict ?? "insufficient_evidence");
  const [summaryId, setSummaryId] = useState(task?.aiSummary.id ?? "");
  const [summaryEn, setSummaryEn] = useState(task?.aiSummary.en ?? "");
  const [limitationsId, setLimitationsId] = useState(task?.limitations.id ?? "");
  const [limitationsEn, setLimitationsEn] = useState(task?.limitations.en ?? "");
  const [expertNoteId, setExpertNoteId] = useState(task?.limitations.id ?? "");
  const [expertNoteEn, setExpertNoteEn] = useState(task?.limitations.en ?? "");
  const [publicClaim, setPublicClaim] = useState(task?.claimText ?? "");
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>(task ? [task.evidence[0]?.id].filter(Boolean) as string[] : []);
  const [customEvidence, setCustomEvidence] = useState<CustomEvidence[]>([]);
  const [refTitle, setRefTitle] = useState("");
  const [refSource, setRefSource] = useState("");
  const [refYear, setRefYear] = useState("");
  const [refIdentifier, setRefIdentifier] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [refError, setRefError] = useState("");
  const [kbOpen, setKbOpen] = useState(false);
  const [kbQuery, setKbQuery] = useState("");
  const [refOpen, setRefOpen] = useState(false);
  const [piiPassed, setPiiPassed] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const evidenceCount = selectedEvidence.length + customEvidence.length;
  const filteredKbSources = useMemo(() => {
    const normalized = kbQuery.trim().toLowerCase();
    if (!normalized) return kbSources;
    return kbSources.filter(
      (item) => item.title.toLowerCase().includes(normalized) || item.author.toLowerCase().includes(normalized),
    );
  }, [kbSources, kbQuery]);

  if (!task) {
    return (
      <EmptyState
        icon={ClipboardX}
        state="none"
        title={tr("Tugas tidak ditemukan", "Task not found")}
        description={tr("Kasus ini mungkin sudah ditutup atau tidak ditugaskan kepadamu.", "This case may be closed or not assigned to you.")}
        action={
          <Link href={`/${locale}/reviewer/tugas`} className={buttonVariants()}>
            {tr("Kembali ke tugas", "Back to tasks")}
          </Link>
        }
      />
    );
  }

  if (task.alreadyReviewed && !successOpen) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href={`/${locale}/reviewer/tugas`} className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 hover:text-sage-700">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {tr("Kembali ke daftar tugas", "Back to task list")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sage-300 bg-sage-100 p-4">
          <span className="inline-flex items-center gap-2 text-sm font-extrabold text-sage-700">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {tr("Putusan sudah terkirim", "Verdict already submitted")}
          </span>
          <span className="flex flex-wrap gap-2">
            <Link href={`/${locale}/reviewer/tugas`} className={buttonVariants({ variant: "secondary" })}>
              {tr("Kembali ke tugas", "Back to tasks")}
            </Link>
            <Link href={`/${locale}/feed-terverifikasi`} className={buttonVariants()}>
              {tr("Lihat feed publik", "View public feed")}
            </Link>
          </span>
        </div>
      </div>
    );
  }

  function addCustomEvidence(event: FormEvent) {
    event.preventDefault();
    setRefError("");
    const year = Number(refYear);
    if (evidenceCount >= MAX_EVIDENCE) {
      setRefError(tr("Batas 20 referensi tercapai.", "The limit of 20 references is reached."));
      return;
    }
    if (refTitle.trim().length < 3) return setRefError(tr("Judul referensi minimal 3 karakter.", "Reference title must be at least 3 characters."));
    if (refSource.trim().length < 2) return setRefError(tr("Penerbit atau sumber minimal 2 karakter.", "Publisher or source must be at least 2 characters."));
    if (!Number.isInteger(year) || year < 1800 || year > 2200) return setRefError(tr("Tahun harus antara 1800 dan 2200.", "Year must be between 1800 and 2200."));
    if (refUrl.trim() && !/^https?:\/\//i.test(refUrl.trim())) return setRefError(tr("URL harus diawali http:// atau https://.", "The URL must start with http:// or https://."));

    setCustomEvidence((current) => [
      ...current,
      {
        id: `custom:${crypto.randomUUID()}`,
        title: refTitle.trim(),
        source: refSource.trim(),
        year,
        identifier: refIdentifier.trim() || undefined,
        url: refUrl.trim() || undefined,
      },
    ]);
    setRefTitle("");
    setRefSource("");
    setRefYear("");
    setRefIdentifier("");
    setRefUrl("");
    setRefOpen(false);
  }

  function addKbEvidence(item: KBSource) {
    setRefError("");
    if (evidenceCount >= MAX_EVIDENCE) {
      setRefError(tr("Batas 20 referensi tercapai.", "The limit of 20 references is reached."));
      return;
    }
    const identifier = `KB:${item.id}`;
    if (customEvidence.some((entry) => entry.identifier === identifier)) return;
    setCustomEvidence((current) => [
      ...current,
      {
        id: `kb:${item.id}`,
        title: item.title,
        source: item.author,
        year: item.year,
        identifier,
        url: item.sourceUrl,
      },
    ]);
    setKbOpen(false);
  }

  function validate() {
    if (evidenceCount === 0) {
      return tr("Pilih setidaknya satu bukti yang mendukung putusan.", "Select at least one piece of evidence supporting the verdict.");
    }
    if (evidenceCount > MAX_EVIDENCE) {
      return tr("Maksimal 20 referensi per tinjauan.", "At most 20 references per review.");
    }
    if (summaryId.trim().length < 30) return tr("Ringkasan Indonesia minimal 30 karakter.", "Indonesian summary must be at least 30 characters.");
    if (summaryEn.trim().length < 30) return tr("Ringkasan Inggris minimal 30 karakter.", "English summary must be at least 30 characters.");
    if (limitationsId.trim().length < 10) return tr("Batasan bukti Indonesia minimal 10 karakter.", "Indonesian limitations must be at least 10 characters.");
    if (limitationsEn.trim().length < 10) return tr("Batasan bukti Inggris minimal 10 karakter.", "English limitations must be at least 10 characters.");
    if (expertNoteId.trim().length < 10 || expertNoteEn.trim().length < 10) return tr("Catatan pakar minimal 10 karakter di kedua bahasa.", "Expert note must be at least 10 characters in both languages.");
    if (publicClaim.trim().length < 10) return tr("Salinan klaim publik minimal 10 karakter.", "Public claim copy must be at least 10 characters.");
    if (!piiPassed) return tr("Konfirmasi pemeriksaan data pribadi pada salinan publik.", "Confirm the personal data check on the public copy.");
    return "";
  }

  function openConfirm(event: FormEvent) {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setConfirmOpen(true);
  }

  async function submit() {
    if (!task) return;
    setSubmitting(true);
    const evidence = [
      ...task.evidence
        .filter((item) => selectedEvidence.includes(item.id))
        .map((item) => ({
          title: item.title,
          source: item.publisher,
          year: item.year,
          identifier: item.identifier,
          url: item.url,
        })),
      ...customEvidence.map((item) => ({
        title: item.title,
        source: item.source,
        year: item.year,
        identifier: item.identifier,
        url: item.url,
      })),
    ];
    const result = await submitReviewAction(locale, {
      reportId: task.reportId,
      verdict,
      summaryId,
      summaryEn,
      limitationsId,
      limitationsEn,
      expertNoteId,
      expertNoteEn,
      publicTitleId: publicClaim.slice(0, 180) || task.claimTitle,
      publicTitleEn: publicClaim.slice(0, 180) || task.claimTitle,
      evidence,
      confirmPublish: piiPassed,
    });
    setSubmitting(false);
    if (result.error) {
      setConfirmOpen(false);
      setError(result.error);
      return;
    }
    setConfirmOpen(false);
    setSuccessOpen(true);
    toast.success(
      result.conflict
        ? tr("Putusan tersimpan, tetapi berbeda dari putusan kanonis. Admin akan meninjau.", "Verdict stored, but it differs from the canonical verdict. An admin will review it.")
        : tr("Putusan tersimpan dan publikasi diantrekan.", "Verdict stored and publication queued."),
    );
  }

  const previewClaim = publicClaim || task.claimText;

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/reviewer/tugas`} className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 hover:text-sage-700">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {tr("Kembali ke daftar tugas", "Back to task list")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={task.priority === "high" ? "rose" : "default"}>
              {task.priority === "high" ? tr("Prioritas tinggi", "High priority") : tr("Normal", "Normal")}
            </Badge>
            <Badge variant="outline">{categoryName(task.categorySlug, locale)}</Badge>
            <StatusBadge status={task.status} />
          </div>
          <h1 className="mt-2 font-heading text-2xl font-extrabold leading-tight text-bark-900 sm:text-3xl">{task.claimTitle}</h1>
          <p className="mt-1.5 text-xs text-bark-500">
            {tr("Ditugaskan", "Assigned")} {formatDate(task.assignedAt, locale, true)}
          </p>
        </div>
        <Badge variant="sky">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {tr("Review independen", "Independent review")}
        </Badge>
      </div>

      <div>
        <form onSubmit={openConfirm} className="space-y-5" noValidate>
          {error ? <Alert id="review-error" variant="danger">{error}</Alert> : null}

          <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
            <h2 className="font-heading text-base font-extrabold text-bark-900">{tr("Konteks kasus", "Case context")}</h2>
            <div className="mt-3 rounded-md border border-[#eae5d9] bg-[#fffdf8] p-3.5">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-bark-500">{tr("Klaim asli (privat)", "Original claim (private)")}</p>
              <p className="mt-1 text-sm leading-relaxed text-bark-700">{task.claimText}</p>
            </div>
            <div className="mt-3 rounded-md border border-[#eae5d9] bg-[#fffdf8] p-3.5">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-bark-500">{tr("Alasan laporan", "Report reason")}</p>
              <p className="mt-1 text-xs leading-relaxed text-bark-700">{task.reporterReason}</p>
            </div>
            <div className="mt-3 flex items-start gap-2.5 rounded-md border border-sage-300 bg-sage-100 p-3 text-xs leading-relaxed text-sage-700">
              <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold">{tr("Analisis awal AI (konteks, bukan putusan)", "Initial AI analysis (context, not a verdict)")}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <VerdictBadge verdict={task.aiVerdict} size="sm" />
                </div>
                <p className="mt-1.5">{task.aiSummary[locale]}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
            <h2 className="font-heading text-base font-extrabold text-bark-900">{tr("Putusan pakar", "Expert verdict")}</h2>
            <div className="mt-4 space-y-4">
              <Field label={tr("Verdict", "Verdict")} htmlFor="review-verdict" required>
                <Select id="review-verdict" value={verdict} onChange={(event) => setVerdict(event.target.value as Verdict)}>
                  {verdictOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option[locale]}</option>
                  ))}
                </Select>
              </Field>
              <Field label={tr("Ringkasan putusan (Indonesia)", "Verdict summary (Indonesian)")} htmlFor="summary-id" hint={`${summaryId.length} karakter`} required>
                <Textarea id="summary-id" value={summaryId} onChange={(event) => setSummaryId(event.target.value)} className="min-h-28" lang="id" aria-invalid={error ? true : undefined} aria-describedby={error ? "review-error" : undefined} />
              </Field>
              <Field label={tr("Ringkasan putusan (English)", "Verdict summary (English)")} htmlFor="summary-en" hint={`${summaryEn.length} characters`} required>
                <Textarea id="summary-en" value={summaryEn} onChange={(event) => setSummaryEn(event.target.value)} className="min-h-28" lang="en" aria-invalid={error ? true : undefined} aria-describedby={error ? "review-error" : undefined} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={tr("Batasan bukti (ID)", "Evidence limitations (ID)")} htmlFor="limitations-id" required>
                  <Textarea id="limitations-id" value={limitationsId} onChange={(event) => setLimitationsId(event.target.value)} className="min-h-24" lang="id" aria-invalid={error ? true : undefined} aria-describedby={error ? "review-error" : undefined} />
                </Field>
                <Field label={tr("Batasan bukti (EN)", "Evidence limitations (EN)")} htmlFor="limitations-en" required>
                  <Textarea id="limitations-en" value={limitationsEn} onChange={(event) => setLimitationsEn(event.target.value)} className="min-h-24" lang="en" aria-invalid={error ? true : undefined} aria-describedby={error ? "review-error" : undefined} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={tr("Catatan pakar (ID)", "Expert note (ID)")} htmlFor="expert-note-id" required>
                  <Textarea id="expert-note-id" value={expertNoteId} onChange={(event) => setExpertNoteId(event.target.value)} className="min-h-24" lang="id" aria-invalid={error ? true : undefined} aria-describedby={error ? "review-error" : undefined} />
                </Field>
                <Field label={tr("Catatan pakar (EN)", "Expert note (EN)")} htmlFor="expert-note-en" required>
                  <Textarea id="expert-note-en" value={expertNoteEn} onChange={(event) => setExpertNoteEn(event.target.value)} className="min-h-24" lang="en" aria-invalid={error ? true : undefined} aria-describedby={error ? "review-error" : undefined} />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-extrabold text-bark-900">{tr("Referensi tervalidasi", "Validated references")}</h2>
              <Badge variant={evidenceCount > 0 ? "sage" : "rose"}>
                {evidenceCount} {tr("dipilih", "selected")}
              </Badge>
            </div>
            <div className="mt-3 space-y-2">
              {task.evidence.length === 0 ? (
                <p className="rounded-md bg-[#fff7de] p-3.5 text-xs leading-relaxed text-bark-600">
                  {tr(
                    "Analisis awal tidak menemukan bukti. Tambahkan referensi sendiri di bawah agar putusan tetap punya dasar.",
                    "The initial analysis found no evidence. Add your own references below so the verdict still has a basis.",
                  )}
                </p>
              ) : null}
              {task.evidence.map((item) => {
                const checked = selectedEvidence.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition",
                      checked ? "border-sage-600 bg-sage-100/60" : "border-border-soft bg-cream-50 hover:bg-cream-100",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={(event) =>
                        setSelectedEvidence((current) =>
                          event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                        )
                      }
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-extrabold leading-snug text-bark-900">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-bark-500">{item.publisher} · {item.year}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {customEvidence.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-bark-500">
                  {tr("Referensi ditambahkan reviewer", "Reviewer-added references")}
                </p>
                {customEvidence.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-md border border-butter-300 bg-[#fff7de] p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-extrabold leading-snug text-bark-900">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-bark-500">
                        {item.source} · {item.year}
                        {item.identifier ? ` · ${item.identifier}` : ""}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomEvidence((current) => current.filter((entry) => entry.id !== item.id))}
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline"
                      aria-label={tr("Hapus referensi", "Remove reference")}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-border-soft bg-cream-50 p-4">
              <p className="text-xs font-extrabold text-bark-900">{tr("Tambah referensi sendiri", "Add your own reference")}</p>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setKbOpen(true)}>
                  {tr("Ambil dari Knowledge Base", "Pick from knowledge base")}
                  <Library className="size-3.5" aria-hidden="true" />
                </Button>
                <Button type="button" size="sm" onClick={() => { setRefError(""); setRefOpen(true); }}>
                  {tr("Tambah referensi", "Add reference")}
                  <Plus className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300">
            <h2 className="font-heading text-base font-extrabold text-bark-900">{tr("Salinan publik anonim", "Anonymous public copy")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-bark-500">
              {tr(
                "Hapus nama, nomor telepon, alamat, data pasien, dan identifier pribadi. Salinan ini akan tampil di feed publik.",
                "Remove names, phone numbers, addresses, patient data, and personal identifiers. This copy will appear in the public feed.",
              )}
            </p>
            <div className="mt-3">
              <Field label={tr("Teks klaim publik", "Public claim text")} htmlFor="public-claim" required>
                <Textarea id="public-claim" value={publicClaim} onChange={(event) => setPublicClaim(event.target.value)} className="min-h-28" />
              </Field>
            </div>
            <label className="mt-4 flex items-start gap-3 rounded-md border border-sage-300 bg-sage-100 p-3.5 text-xs leading-relaxed text-bark-700">
              <Checkbox checked={piiPassed} onChange={(event) => setPiiPassed(event.target.checked)} className="mt-0.5" />
              <span>
                {tr(
                  "Saya sudah memeriksa salinan publik dan memastikan tidak ada data pribadi atau tautan privat.",
                  "I have checked the public copy and confirm there is no personal data or private link.",
                )}
              </span>
            </label>
          </section>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href={`/${locale}/reviewer/tugas`} className={buttonVariants({ variant: "secondary" })}>
              {tr("Batal", "Cancel")}
            </Link>
            <Button type="submit" disabled={!piiPassed || submitting}>
              {submitting ? tr("Memproses...", "Processing...") : tr("Submit Putusan & Terbitkan", "Submit Verdict & Publish")}
              {submitting ? <LoaderCircle className="size-4 spin" aria-hidden="true" /> : <FileCheck2 className="size-4" aria-hidden="true" />}
            </Button>
          </div>
        </form>
      </div>

      <Dialog
        open={refOpen}
        onOpenChange={setRefOpen}
        title={tr("Tambah referensi sendiri", "Add your own reference")}
        description={tr(
          "Referensi tambahan dipakai sebagai dasar putusan bersama bukti lain.",
          "An additional reference is used as a basis for the verdict alongside other evidence.",
        )}
        className="sm:max-w-2xl"
      >
        <form onSubmit={addCustomEvidence} className="space-y-4" noValidate>
          {refError ? <Alert variant="danger">{refError}</Alert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Judul referensi", "Reference title")} htmlFor="ref-title" required>
              <Input id="ref-title" value={refTitle} onChange={(event) => setRefTitle(event.target.value)} />
            </Field>
            <Field label={tr("Penerbit atau sumber", "Publisher or source")} htmlFor="ref-source" required>
              <Input id="ref-source" value={refSource} onChange={(event) => setRefSource(event.target.value)} />
            </Field>
            <Field label={tr("Tahun", "Year")} htmlFor="ref-year" required>
              <Input id="ref-year" inputMode="numeric" value={refYear} onChange={(event) => setRefYear(event.target.value)} />
            </Field>
            <Field label={tr("Identifier (PMID, DOI, URL)", "Identifier (PMID, DOI, URL)")} htmlFor="ref-identifier">
              <Input id="ref-identifier" value={refIdentifier} onChange={(event) => setRefIdentifier(event.target.value)} />
            </Field>
          </div>
          <Field label={tr("URL sumber", "Source URL")} htmlFor="ref-url">
            <Input id="ref-url" inputMode="url" value={refUrl} onChange={(event) => setRefUrl(event.target.value)} placeholder="https://" />
          </Field>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setRefOpen(false)}>
              {tr("Batal", "Cancel")}
            </Button>
            <Button type="submit">
              {tr("Tambahkan referensi", "Add reference")}
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={kbOpen}
        onOpenChange={setKbOpen}
        title={tr("Ambil referensi dari Knowledge Base", "Pick a reference from the knowledge base")}
        description={tr(
          "Hanya sumber ter-ingest yang ditampilkan, karena hanya chunk ter-ingest yang dipakai pipeline verifikasi.",
          "Only ingested sources are listed, since only ingested chunks are used by the verification pipeline.",
        )}
        footer={
          <Button variant="secondary" onClick={() => setKbOpen(false)}>
            {tr("Tutup", "Close")}
          </Button>
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
          <Input
            value={kbQuery}
            onChange={(event) => setKbQuery(event.target.value)}
            placeholder={tr("Cari judul atau penulis...", "Search title or author...")}
            className="pl-11"
            aria-label={tr("Cari sumber KB", "Search KB sources")}
          />
        </div>
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
          {filteredKbSources.length === 0 ? (
            <p className="rounded-md bg-[#fff7de] p-3.5 text-xs text-bark-600">
              {tr("Tidak ada sumber ter-ingest yang cocok.", "No ingested source matches.")}
            </p>
          ) : null}
          {filteredKbSources.map((item) => {
            const added = customEvidence.some((entry) => entry.identifier === `KB:${item.id}`);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => addKbEvidence(item)}
                disabled={added}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md border p-3 text-left transition",
                  added
                    ? "cursor-not-allowed border-sage-300 bg-sage-100/60"
                    : "border-border-soft bg-cream-50 hover:bg-cream-100",
                )}
              >
                <BookMarked className="mt-0.5 size-4 shrink-0 text-sage-700" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold leading-snug text-bark-900">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-bark-500">
                    {item.author} · {item.year} · {item.chunks.length} {tr("chunk", "chunks")}
                  </span>
                </span>
                {added ? <Badge variant="sage">{tr("Dipakai", "Added")}</Badge> : null}
              </button>
            );
          })}
        </div>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={tr("Kirim putusan dan terbitkan?", "Submit verdict and publish?")}
        description={tr(
          "Putusan akan dikirim ke pelapor dan ringkasan publik anonim akan terbit otomatis. Tindakan ini memerlukan transaksi dan tidak dapat dibatalkan dari halaman ini.",
          "The verdict will be sent to the reporter and an anonymous public summary will be published automatically. This action runs in a transaction and cannot be undone from this page.",
        )}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              {tr("Periksa lagi", "Review again")}
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? tr("Menyimpan...", "Saving...") : tr("Ya, kirim & terbitkan", "Yes, submit & publish")}
              {submitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <FileCheck2 className="size-4" aria-hidden="true" />}
            </Button>
          </>
        }
      >
        <div className="rounded-md bg-cream-100 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={verdict} />
            <Badge variant="sage">{tr("Putusan kanonis", "Canonical verdict")}</Badge>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-bark-700">{previewClaim}</p>
        </div>
      </Dialog>

      <Dialog
        open={successOpen}
        onOpenChange={(open) => {
          if (open) return;
          setSuccessOpen(false);
          router.push(`/${locale}/reviewer/tugas`);
          router.refresh();
        }}
        title={tr("Putusan terkirim", "Verdict submitted")}
        className="sm:max-w-md"
      >
        <div className="flex items-start gap-3 rounded-md bg-sage-100 p-3.5 text-xs leading-relaxed text-sage-700">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            {tr(
              "Putusan tersimpan. Pelapor menerima notifikasi in-app dan ringkasan publik terbit anonim.",
              "The verdict is stored. The reporter receives an in-app notification and the anonymous public summary is published.",
            )}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Link href={`/${locale}/reviewer/tugas`} className={buttonVariants({ variant: "secondary" })}>
            {tr("Kembali ke tugas", "Back to tasks")}
          </Link>
          <Link href={`/${locale}/feed-terverifikasi`} className={buttonVariants()}>
            {tr("Lihat feed publik", "View public feed")}
          </Link>
        </div>
      </Dialog>
    </div>
  );
}
