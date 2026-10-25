"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  FilterX,
  LoaderCircle,
  Pencil,
  Rss,
  Search,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { setFeedVisibilityAction, updateFeedContentAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StatusBadge } from "@/components/panacea/status-badge";
import { VerdictBadge } from "@/components/panacea/verdict-badge";
import { categoryName } from "@/lib/data/categories";
import { formatDate } from "@/lib/i18n/format";
import type { FeedItem } from "@/lib/types";

export function AdminFeed({ items }: { items: FeedItem[] }) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [verdict, setVerdict] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<FeedItem | null>(null);
  const [confirm, setConfirm] = useState<FeedItem | null>(null);
  const [form, setForm] = useState({ titleId: "", titleEn: "", summaryId: "", summaryEn: "", limitationsId: "" });
  const [revisionNote, setRevisionNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((item) => verdict === "all" || item.verdict === verdict)
      .filter((item) => status === "all" || item.status === status)
      .filter((item) => !normalized || item.title[locale].toLowerCase().includes(normalized) || item.publicClaimText[locale].toLowerCase().includes(normalized));
  }, [items, query, verdict, status, locale]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || verdict !== "all" || status !== "all";

  function openEdit(item: FeedItem) {
    setEditing(item);
    setRevisionNote("");
    setForm({
      titleId: item.title.id,
      titleEn: item.title.en,
      summaryId: item.summary.id,
      summaryEn: item.summary.en,
      limitationsId: item.limitations.id,
    });
  }

  async function saveEdit() {
    if (!editing) return;
    if (form.summaryId.trim().length < 20 || form.summaryEn.trim().length < 20) {
      toast.error(tr("Ringkasan minimal 20 karakter di kedua bahasa.", "Summary must be at least 20 characters in both languages."));
      return;
    }
    if (revisionNote.trim().length < 5) {
      toast.error(tr("Tulis catatan revisi minimal 5 karakter.", "Write a revision note of at least 5 characters."));
      return;
    }
    setSaving(true);
    try {
      const result = await updateFeedContentAction(locale, {
        feedId: editing.id,
        titleId: form.titleId,
        titleEn: form.titleEn,
        summaryId: form.summaryId,
        summaryEn: form.summaryEn,
        limitationsId: form.limitationsId,
        revisionNote,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(tr("Ringkasan feed diperbarui dan revisi dicatat.", "Feed summary updated and revision recorded."));
      setEditing(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(item: FeedItem) {
    if (revisionNote.trim().length < 5) {
      toast.error(tr("Tulis alasan perubahan minimal 5 karakter.", "Write a reason of at least 5 characters."));
      return;
    }
    setToggling(true);
    try {
      const result = await setFeedVisibilityAction(locale, {
        feedId: item.id,
        status: item.status === "visible" ? "hidden" : "visible",
        revisionNote,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(item.status === "visible" ? tr("Feed disembunyikan tanpa menghapus histori.", "Feed hidden without deleting history.") : tr("Feed ditampilkan kembali.", "Feed is visible again."));
      setConfirm(null);
      setRevisionNote("");
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Feed publik", "Public feed")}
        title={tr("Kelola konten terverifikasi", "Manage verified content")}
        description={tr(
          "Edit ringkasan publik, sembunyikan atau tampilkan kembali. Setiap revisi menyimpan snapshot sebelumnya, alasan, aktor, dan waktu.",
          "Edit public summaries, hide or show them again. Every revision keeps the previous snapshot, reason, actor, and timestamp.",
        )}
        actions={<Badge variant="sage"><ShieldCheck className="size-3.5" aria-hidden="true" />{items.filter((item) => item.status === "visible").length} {tr("tampil", "visible")}</Badge>}
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr("Cari konten feed...", "Search feed content...")} className="pl-11" aria-label={tr("Cari feed", "Search feed")} />
          </div>
          <Select value={verdict} onChange={(event) => setVerdict(event.target.value)} aria-label={tr("Filter verdict", "Filter verdict")} className="md:w-48">
            <option value="all">{tr("Semua verdict", "All verdicts")}</option>
            <option value="supported">{tr("Didukung", "Supported")}</option>
            <option value="partly_supported">{tr("Sebagian", "Partly")}</option>
            <option value="contradicted">{tr("Bertentangan", "Contradicted")}</option>
            <option value="insufficient_evidence">{tr("Bukti belum cukup", "Insufficient")}</option>
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={tr("Filter status", "Filter status")} className="md:w-40">
            <option value="all">{tr("Semua status", "All statuses")}</option>
            <option value="visible">{tr("Tampil", "Visible")}</option>
            <option value="hidden">{tr("Disembunyikan", "Hidden")}</option>
          </Select>
        </div>
      </div>

      <p className="text-sm font-semibold text-bark-700">{visible.length} {tr("konten", "items")}</p>

      {visible.length > 0 ? (
        <>
          <div className="hidden lg:block">
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>{tr("Konten", "Content")}</TH>
                    <TH>{tr("Verdict", "Verdict")}</TH>
                    <TH>{tr("Kategori", "Category")}</TH>
                    <TH>{tr("Status", "Status")}</TH>
                    <TH>{tr("Terbit", "Published")}</TH>
                    <TH>{tr("Aksi", "Actions")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {visible.map((item) => (
                    <TR key={item.id}>
                      <TD className="max-w-sm"><p className="line-clamp-2 text-xs font-bold text-bark-900">{item.title[locale]}</p><p className="mt-0.5 text-xs text-bark-500">{item.slug}</p></TD>
                      <TD><VerdictBadge verdict={item.verdict} size="sm" /></TD>
                      <TD><Badge variant="outline">{categoryName(item.categorySlug, locale)}</Badge></TD>
                      <TD><StatusBadge status={item.status} /></TD>
                      <TD className="whitespace-nowrap text-xs">{formatDate(item.publishedAt, locale)}</TD>
                      <TD>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="size-11" onClick={() => openEdit(item)} aria-label={tr("Edit ringkasan", "Edit summary")}><Pencil className="size-3.5" aria-hidden="true" /></Button>
                          <Button variant="ghost" size="icon" className="size-11" onClick={() => setConfirm(item)} aria-label={item.status === "visible" ? tr("Sembunyikan", "Hide") : tr("Tampilkan", "Show")}>
                            {item.status === "visible" ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
                          </Button>
                          <Link href={`/${locale}/feed-terverifikasi/${item.slug}`} className="grid size-11 place-items-center rounded-sm text-bark-700 transition hover:bg-cream-100" aria-label={tr("Buka publik", "Open public")}><ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </div>
          <div className="grid gap-3 lg:hidden">
            {visible.map((item) => (
              <article key={item.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
                <div className="flex flex-wrap items-center gap-2">
                  <VerdictBadge verdict={item.verdict} size="sm" />
                  <StatusBadge status={item.status} />
                  <span className="ml-auto text-xs text-bark-500">{formatDate(item.publishedAt, locale)}</span>
                </div>
                <p className="mt-2 text-sm font-bold leading-snug text-bark-900">{item.title[locale]}</p>
                <div className="mt-3 flex justify-end gap-1 border-t border-cream-200 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="size-3.5" aria-hidden="true" />{tr("Edit", "Edit")}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirm(item)}>{item.status === "visible" ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}{item.status === "visible" ? tr("Sembunyikan", "Hide") : tr("Tampilkan", "Show")}</Button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : isFiltered ? (
        <EmptyState
          icon={hasQuery ? SearchX : FilterX}
          state="filtered"
          title={tr("Tidak ada konten feed", "No feed content")}
          description={tr("Ubah filter pencarian.", "Adjust the search filters.")}
          action={<Button variant="secondary" onClick={() => { setQuery(""); setVerdict("all"); setStatus("all"); }}>{tr("Hapus filter", "Clear filters")}</Button>}
        />
      ) : (
        <EmptyState
          icon={Rss}
          state="none"
          title={tr("Belum ada konten feed", "No feed content yet")}
          description={tr("Konten terbit setelah klaim selesai ditinjau pakar.", "Content is published after a claim is reviewed by an expert.")}
        />
      )}

      <div className="rounded-lg border border-cream-200 bg-cream-100 p-4 text-xs leading-relaxed text-bark-700">
        {tr(
          "Feed publik tidak menyimpan reporter_id, claim_id privat, user_id, path file, atau alasan laporan. Relasi ke klaim asal hanya ada di tabel privat.",
          "The public feed does not store reporter_id, private claim_id, user_id, file paths, or report reasons. Links to the original claim exist only in private tables.",
        )}
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        title={tr("Edit ringkasan feed", "Edit feed summary")}
        description={tr("Perubahan disimpan sebagai revisi baru dengan snapshot sebelumnya dan catatan audit.", "Changes are saved as a new revision with the previous snapshot and an audit record.")}
        className="sm:max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>{tr("Batal", "Cancel")}</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? <LoaderCircle className="size-4 spin" aria-hidden="true" /> : null}
              {saving ? tr("Menyimpan...", "Saving...") : tr("Simpan revisi", "Save revision")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {editing ? <VerdictBadge verdict={editing.verdict} /> : null}
          <Field label={tr("Judul Indonesia", "Indonesian title")} htmlFor="feed-title-id">
            <Input id="feed-title-id" value={form.titleId} onChange={(event) => setForm((current) => ({ ...current, titleId: event.target.value }))} />
          </Field>
          <Field label={tr("Judul Inggris", "English title")} htmlFor="feed-title-en">
            <Input id="feed-title-en" value={form.titleEn} onChange={(event) => setForm((current) => ({ ...current, titleEn: event.target.value }))} />
          </Field>
          <Field label={tr("Ringkasan Indonesia", "Indonesian summary")} htmlFor="feed-summary-id" required>
            <Textarea id="feed-summary-id" value={form.summaryId} onChange={(event) => setForm((current) => ({ ...current, summaryId: event.target.value }))} className="min-h-24" />
          </Field>
          <Field label={tr("Ringkasan Inggris", "English summary")} htmlFor="feed-summary-en" required>
            <Textarea id="feed-summary-en" value={form.summaryEn} onChange={(event) => setForm((current) => ({ ...current, summaryEn: event.target.value }))} className="min-h-24" />
          </Field>
          <Field label={tr("Batasan bukti Indonesia", "Indonesian limitations")} htmlFor="feed-limitations">
            <Textarea id="feed-limitations" value={form.limitationsId} onChange={(event) => setForm((current) => ({ ...current, limitationsId: event.target.value }))} className="min-h-20" />
          </Field>
          <Field label={tr("Catatan revisi", "Revision note")} htmlFor="feed-revision-note" required>
            <Textarea id="feed-revision-note" value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} placeholder={tr("Alasan perubahan ini...", "Why this change was made...")} className="min-h-20" />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => { if (!open) setConfirm(null); }}
        title={confirm?.status === "visible" ? tr("Sembunyikan dari feed publik?", "Hide from the public feed?") : tr("Tampilkan kembali di feed publik?", "Show in the public feed again?")}
        description={tr(
          "Histori dan snapshot tetap disimpan. Tindakan ini dicatat di audit dan langsung memengaruhi tampilan publik setelah cache diperbarui.",
          "History and snapshots are preserved. This action is audited and affects the public view immediately after cache revalidation.",
        )}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)} disabled={toggling}>{tr("Batal", "Cancel")}</Button>
            <Button variant={confirm?.status === "visible" ? "destructive" : "primary"} onClick={() => confirm && toggleVisibility(confirm)} disabled={toggling}>
              {toggling ? <LoaderCircle className="size-4 spin" aria-hidden="true" /> : null}
              {toggling ? tr("Memproses...", "Processing...") : (confirm?.status === "visible" ? tr("Sembunyikan", "Hide") : tr("Tampilkan", "Show"))}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {confirm ? <p className="rounded-md bg-[#fff7de] p-3 text-xs font-semibold text-bark-700">{confirm.title[locale]}</p> : null}
          <Field label={tr("Alasan perubahan", "Reason for change")} htmlFor="feed-visibility-note" required>
            <Textarea id="feed-visibility-note" value={revisionNote} onChange={(event) => setRevisionNote(event.target.value)} className="min-h-20" />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
