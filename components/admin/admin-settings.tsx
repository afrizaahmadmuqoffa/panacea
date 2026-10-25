"use client";

import Link from "next/link";
import { ExternalLink, LoaderCircle, Save, Settings2, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";
import { saveSettingsAction } from "@/lib/actions/admin";
import { SETTING_KEYS } from "@/lib/settings/keys";

function value(settings: Record<string, unknown>, key: string, fallback: string) {
  const raw = settings[key];
  return typeof raw === "string" || typeof raw === "number" ? String(raw) : fallback;
}

export function AdminSettings({ settings }: { settings: Record<string, unknown> }) {
  const { locale, tr } = useI18n();
  const [form, setForm] = useState({
    siteName: value(settings, SETTING_KEYS.siteName, "PANACEA"),
    defaultDescription: value(
      settings,
      SETTING_KEYS.defaultDescription,
      "Pemeriksaan klaim kesehatan dengan bukti dan tinjauan pakar.",
    ),
    defaultLocale: value(settings, SETTING_KEYS.defaultLocale, "id"),
    ragMinScore: value(settings, SETTING_KEYS.ragMinScore, "0.70"),
    ragChunkCount: value(settings, SETTING_KEYS.ragChunkCount, "8"),
    kbMinEvidenceCount: value(settings, SETTING_KEYS.kbMinEvidenceCount, "3"),
    claimAnalysisEnabled: value(settings, SETTING_KEYS.claimAnalysisEnabled, "true") !== "false",
    forumModerationFailClosed:
      value(settings, SETTING_KEYS.forumModerationFailClosed, "true") !== "false",
    maxClaimTextLength: value(settings, SETTING_KEYS.maxClaimTextLength, "4000"),
  });
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.siteName.trim().length < 2) {
      toast.error(tr("Nama situs minimal 2 karakter.", "Site name must be at least 2 characters."));
      return;
    }
    const score = Number(form.ragMinScore);
    if (Number.isNaN(score) || score < 0 || score > 1) {
      toast.error(tr("Ambang skor RAG harus antara 0 dan 1.", "RAG score threshold must be between 0 and 1."));
      return;
    }
    if (Number(form.ragChunkCount) < 1 || Number(form.kbMinEvidenceCount) < 1) {
      toast.error(tr("Jumlah chunk dan bukti minimal harus lebih dari 0.", "Chunk count and minimum evidence must be greater than 0."));
      return;
    }
    const maxClaimText = Number(form.maxClaimTextLength);
    if (!Number.isInteger(maxClaimText) || maxClaimText < 100 || maxClaimText > 10000) {
      toast.error(tr("Batas teks klaim harus antara 100 dan 10000 karakter.", "The claim text limit must be between 100 and 10000 characters."));
      return;
    }
    setSaving(true);
    const payload = new FormData();
    payload.set("siteName", form.siteName.trim());
    payload.set("defaultDescription", form.defaultDescription.trim());
    payload.set("defaultLocale", form.defaultLocale);
    payload.set("ragMinScore", form.ragMinScore);
    payload.set("ragChunkCount", form.ragChunkCount);
    payload.set("kbMinEvidenceCount", form.kbMinEvidenceCount);
    payload.set("claimAnalysisEnabled", form.claimAnalysisEnabled ? "on" : "off");
    payload.set("forumModerationFailClosed", form.forumModerationFailClosed ? "on" : "off");
    payload.set("maxClaimTextLength", form.maxClaimTextLength);
    const result = await saveSettingsAction(locale, payload);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(tr("Pengaturan disimpan dan perubahan konfigurasi dicatat di audit.", "Settings saved and configuration changes recorded in the audit log."));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Pengaturan", "Settings")}
        title={tr("Konfigurasi situs dan RAG", "Site and RAG configuration")}
        description={tr(
          "Nama situs, metadata SEO default, dan parameter retrieval. Perubahan penting dicatat di audit dan tidak boleh memuat secret.",
          "Site name, default SEO metadata, and retrieval parameters. Important changes are audited and must not contain secrets.",
        )}
        actions={<Badge variant="sage"><Settings2 className="size-3.5" aria-hidden="true" />{tr("Admin", "Admin")}</Badge>}
      />

      <form onSubmit={submit} className="space-y-5" noValidate>
        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300 sm:p-6">
          <h2 className="font-heading text-base font-extrabold text-bark-900">{tr("Umum & SEO", "General & SEO")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={tr("Nama situs", "Site name")} htmlFor="settings-site-name" required>
              <Input id="settings-site-name" value={form.siteName} onChange={(event) => setForm((current) => ({ ...current, siteName: event.target.value }))} />
            </Field>
            <Field label={tr("Bahasa default", "Default language")} htmlFor="settings-locale">
              <Select id="settings-locale" value={form.defaultLocale} onChange={(event) => setForm((current) => ({ ...current, defaultLocale: event.target.value }))}>
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label={tr("Deskripsi SEO default", "Default SEO description")} htmlFor="settings-description">
              <Textarea id="settings-description" value={form.defaultDescription} onChange={(event) => setForm((current) => ({ ...current, defaultDescription: event.target.value }))} className="min-h-24" />
            </Field>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300 sm:p-6">
          <h2 className="font-heading text-base font-extrabold text-bark-900">{tr("Parameter RAG", "RAG parameters")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-bark-500">
            {tr(
              "Parameter ini mempengaruhi pencarian bukti. Perubahan harus diuji dan dicatat; jangan menurunkan kualitas tanpa evaluasi retrieval.",
              "These parameters affect evidence retrieval. Changes should be tested and recorded; do not lower quality without retrieval evaluation.",
            )}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label={tr("Ambang skor minimum", "Minimum score threshold")} htmlFor="settings-score" hint="0–1">
              <Input id="settings-score" type="number" step="0.01" min="0" max="1" value={form.ragMinScore} onChange={(event) => setForm((current) => ({ ...current, ragMinScore: event.target.value }))} />
            </Field>
            <Field label={tr("Jumlah chunk kandidat", "Candidate chunk count")} htmlFor="settings-chunks" hint="1–20">
              <Input id="settings-chunks" type="number" min="1" max="20" value={form.ragChunkCount} onChange={(event) => setForm((current) => ({ ...current, ragChunkCount: event.target.value }))} />
            </Field>
            <Field label={tr("Minimum bukti KB", "Minimum KB evidence")} htmlFor="settings-evidence" hint={tr("sebelum Europe PMC", "before Europe PMC")}>
              <Input id="settings-evidence" type="number" min="1" max="10" value={form.kbMinEvidenceCount} onChange={(event) => setForm((current) => ({ ...current, kbMinEvidenceCount: event.target.value }))} />
            </Field>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300 sm:p-6">
          <h2 className="font-heading text-base font-extrabold text-bark-900">{tr("Operasional", "Operations")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-bark-500">
            {tr(
              "Beralih ini berlaku langsung ke pipeline analisis dan moderasi forum.",
              "These switches apply immediately to the analysis pipeline and forum moderation.",
            )}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-md border border-cream-200 bg-cream-50 p-4 text-xs leading-relaxed text-bark-700">
              <Checkbox
                checked={form.claimAnalysisEnabled}
                onChange={(event) => setForm((current) => ({ ...current, claimAnalysisEnabled: event.target.checked }))}
                className="mt-0.5"
              />
              <span>
                {tr(
                  "Analisis klaim aktif. Saat dimatikan, anggota tidak bisa mengirim klaim baru.",
                  "Claim analysis is on. When off, members cannot submit new claims.",
                )}
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-md border border-cream-200 bg-cream-50 p-4 text-xs leading-relaxed text-bark-700">
              <Checkbox
                checked={form.forumModerationFailClosed}
                onChange={(event) => setForm((current) => ({ ...current, forumModerationFailClosed: event.target.checked }))}
                className="mt-0.5"
              />
              <span>
                {tr(
                  "Moderasi gagal menutup: komentar ditahan otomatis. Saat dimatikan, komentar menunggu di antrean admin.",
                  "Failed moderation fails closed: comments are held automatically. When off, comments wait in the admin queue.",
                )}
              </span>
            </label>
          </div>
          <div className="mt-4">
            <Field
              label={tr("Batas panjang teks klaim", "Maximum claim text length")}
              htmlFor="settings-claim-length"
              hint="100–10000"
            >
              <Input
                id="settings-claim-length"
                type="number"
                min="100"
                max="10000"
                value={form.maxClaimTextLength}
                onChange={(event) => setForm((current) => ({ ...current, maxClaimTextLength: event.target.value }))}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-extrabold text-bark-900">{tr("Dokumen kebijakan", "Policy documents")}</h2>
              <p className="mt-1 text-xs text-bark-500">{tr("Kebijakan privasi dan syarat ketentuan dikelola sebagai konten legal.", "Privacy policy and terms are managed as legal content.")}</p>
            </div>
            <Link href={`/${locale}/kebijakan-privasi`} className="inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline">
              {tr("Lihat halaman publik", "View public page")}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cream-200 bg-cream-100 p-4">
          <div className="flex items-start gap-2.5 text-xs leading-relaxed text-bark-700">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage-700" aria-hidden="true" />
            <p>
              {tr(
                "Secret API, service-role key, dan cron secret tidak boleh dimasukkan ke formulir ini. Gunakan environment server.",
                "API secrets, service-role keys, and cron secrets must not be entered in this form. Use server environment variables.",
              )}
            </p>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {saving ? tr("Menyimpan...", "Saving...") : tr("Simpan pengaturan", "Save settings")}
          </Button>
        </div>
      </form>
    </div>
  );
}
