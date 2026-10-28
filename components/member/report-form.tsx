"use client";

import Link from "next/link";
import {
  CircleAlert,
  FilePlus2,
  FileQuestion,
  LoaderCircle,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { reportClaimAction } from "@/lib/actions/member";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/limits";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/panacea/status-badge";
import { VerdictBadge } from "@/components/panacea/verdict-badge";

export function ReportForm({ claimId, onDone }: { claimId: string; onDone?: () => void }) {
  const { locale, tr } = useI18n();
  const { hydrated, findClaim, refresh } = usePanacea();
  const claim = findClaim(claimId);
  const [reason, setReason] = useState("");
  const [refs, setRefs] = useState<string[]>([""]);
  const [file, setFile] = useState<File | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!hydrated) return null;

  if (!claim) {
    return (
      <EmptyState
        icon={FileQuestion}
        state="none"
        title={tr("Klaim tidak ditemukan", "Claim not found")}
        description={tr(
          "Laporan hanya bisa dibuat untuk klaim milik akunmu.",
          "A report can only be created for a claim owned by your account.",
        )}
        action={
          <Link href={`/${locale}/riwayat-klaim`} className={buttonVariants({ variant: "cozy" })}>
            {tr("Kembali ke riwayat", "Back to history")}
          </Link>
        }
      />
    );
  }

  if (claim.reportStatus) {
    return (
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-6 cozy-shadow">
          <Badge variant="butter">
            <CircleAlert className="size-3.5" aria-hidden="true" />
            {tr("Laporan sudah ada", "A report already exists")}
          </Badge>
          <h2 className="mt-3 font-heading text-[21px] font-black tracking-[-0.45px] text-bark-900">
            {tr("Klaim ini sudah dilaporkan.", "This claim has already been reported.")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-bark-700">
            {tr(
              "Satu klaim hanya dapat memiliki satu laporan aktif per pengguna. Kamu dapat memantau status dari riwayat klaim.",
              "A claim can have only one active report per user. You can monitor its status from claim history.",
            )}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-bark-500">{tr("Status", "Status")}:</span>
            <StatusBadge status={claim.reportStatus} palette="warm" />
          </div>
          <Link href={`/${locale}/riwayat-klaim`} className={buttonVariants({ variant: "cozy", className: "mt-5" })}>
            {tr("Buka riwayat klaim", "Open claim history")}
          </Link>
        </div>
      </div>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!claim) return;
    setError("");
    if (reason.trim().length < 30) {
      setError(tr("Alasan laporan minimal 30 karakter.", "Report reason must be at least 30 characters."));
      return;
    }
    if (!accepted) {
      setError(tr("Konfirmasi pemberitahuan publikasi anonim terlebih dahulu.", "Confirm the anonymous publication notice first."));
      return;
    }
    setLoading(true);
    const payload = new FormData();
    payload.set("claimId", claim.id);
    payload.set("reason", reason.trim());
    payload.set("referenceUrls", JSON.stringify(refs.map((item) => item.trim()).filter(Boolean)));
    payload.set("publicationAck", accepted ? "on" : "");
    if (file) payload.set("attachment", file);

    const result = await reportClaimAction(locale, payload);
    setLoading(false);
    if (result.error || !result.reportId) {
      setError(result.error ?? tr("Laporan gagal dikirim.", "The report could not be sent."));
      return;
    }
    await refresh();
    toast.success(tr("Laporan dikirim ke reviewer yang sesuai.", "Report sent to matching reviewers."));
    onDone?.();
  }

  return (
    <form onSubmit={submit} noValidate>
      {error ? <Alert id="report-error" variant="danger" className="mb-4">{error}</Alert> : null}

          <div className="rounded-[16px] border border-[#e8e2d5] bg-cream-100/70 p-4">
            <p className="text-xs font-extrabold text-bark-500">{tr("Klaim yang dilaporkan", "Claim being reported")}</p>
            <p className="mt-1.5 line-clamp-3 text-sm font-bold leading-snug text-bark-900">{claim.originalText}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {claim.analysis?.verdict ? <VerdictBadge verdict={claim.analysis.verdict} size="sm" palette="warm" /> : null}
              <StatusBadge status={claim.reportStatus ?? claim.status} palette="warm" />
            </div>
          </div>

          <div className="mt-5">
            <Field
              label={tr("Alasan laporan", "Report reason")}
              htmlFor="report-reason"
              hint={`${reason.length}/3000`}
              required
            >
              <Textarea
                id="report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value.slice(0, 3000))}
                placeholder={tr(
                  "Contoh: Analisis AI tidak membahas keamanan untuk anak. Saya ingin pakar menilai bukti dan konteks penggunaannya.",
                  "Example: The AI analysis does not address safety for children. I would like an expert to assess the evidence and context of use.",
                )}
                className="min-h-36"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "report-error" : undefined}
              />
            </Field>
            <p className="mt-1.5 text-xs leading-relaxed text-bark-500">
              {tr(
                "Sertakan konteks yang relevan. Jangan menulis data pribadi orang lain.",
                "Include relevant context. Do not write another person's personal data.",
              )}
            </p>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-bold text-bark-700">{tr("Referensi tambahan (opsional)", "Additional references (optional)")}</span>
              <Button variant="ghost" size="sm" onClick={() => setRefs((current) => [...current, ""])}>
                <Plus className="size-3.5" aria-hidden="true" />
                {tr("Tambah", "Add")}
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {refs.map((ref, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    value={ref}
                    onChange={(event) =>
                      setRefs((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
                    }
                    placeholder="https://..."
                    aria-label={`${tr("Referensi", "Reference")} ${index + 1}`}
                  />
                  {refs.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRefs((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      aria-label={tr("Hapus referensi", "Remove reference")}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <span className="text-[13px] font-bold text-bark-700">{tr("Lampiran (opsional)", "Attachment (optional)")}</span>
            <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-[16px] border border-dashed border-border-strong bg-cream-50 p-4 transition hover:border-sage-600 hover:bg-sage-100/30">
              <span className="grid size-10 place-items-center rounded-full bg-white text-sage-700 shadow-soft">
                <FilePlus2 className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-bark-900">
                  {file ? file.name : tr("Pilih lampiran", "Choose an attachment")}
                </span>
                <span className="mt-0.5 block text-xs text-bark-500">PDF, JPG, PNG, WEBP · {tr("maksimal 5 MB", "max 5 MB")}</span>
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "report-error" : undefined}
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null;
                  if (next && !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(next.type)) {
                    setError(tr("Lampiran harus PDF, JPG, PNG, atau WEBP.", "The attachment must be a PDF, JPG, PNG, or WEBP."));
                    return;
                  }
                  if (next && next.size > MAX_IMAGE_UPLOAD_BYTES) {
                    setError(tr("Lampiran maksimal 5 MB.", "Attachment must be 5 MB or less."));
                    return;
                  }
                  setFile(next);
                  setError("");
                }}
              />
            </label>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-[16px] border border-sage-300 bg-sage-100 p-4 text-xs leading-relaxed text-bark-700">
            <Checkbox checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5" />
            <span>
              {tr(
                "Saya memahami bahwa putusan pakar akan dikirim ke akun saya dan ringkasan hasil dapat dipublikasikan otomatis di feed publik secara anonim. Identitas saya tidak akan ditampilkan.",
                "I understand that the expert verdict will be sent to my account and the result summary may be published automatically in the public feed anonymously. My identity will not be shown.",
              )}
            </span>
          </label>

          <Button type="submit" variant="cozy" size="lg" fullWidth className="mt-5" disabled={loading || !accepted}>
            {loading ? tr("Mengirim laporan...", "Sending report...") : tr("Kirim ke Reviewer", "Send to Reviewers")}
            {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          </Button>
          <p className="mt-2 text-center text-xs leading-relaxed text-bark-500">
            {tr(
              "Satu laporan aktif per klaim. Submit bersifat idempotent; klik ganda tidak membuat duplikat.",
              "One active report per claim. Submissions are idempotent; double clicks do not create duplicates.",
            )}
          </p>
    </form>
  );
}
