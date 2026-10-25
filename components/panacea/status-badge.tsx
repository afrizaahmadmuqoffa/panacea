"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/providers/i18n-provider";

type Status =
  | "queued"
  | "analyzing"
  | "analyzed"
  | "analysis_failed"
  | "reported"
  | "finalized"
  | "archived"
  | "waiting_assignment"
  | "assigned"
  | "opened"
  | "submitted_primary"
  | "submitted_supplemental"
  | "conflict"
  | "needs_admin_review"
  | "closed"
  | "pending_moderation"
  | "visible"
  | "held"
  | "hidden"
  | "removed"
  | "draft"
  | "chunked"
  | "ingested"
  | "failed"
  | "approved"
  | "rejected"
  | "pending"
  | "needs_changes"
  | "active"
  | "inactive";

const labels: Record<Status, { id: string; en: string; variant: "default" | "sage" | "sky" | "butter" | "peach" | "rose" | "outline" }> = {
  queued: { id: "Dalam antrean", en: "Queued", variant: "default" },
  analyzing: { id: "Sedang dianalisis", en: "Analyzing", variant: "sky" },
  analyzed: { id: "Analisis selesai", en: "Analyzed", variant: "sage" },
  analysis_failed: { id: "Analisis gagal", en: "Analysis failed", variant: "rose" },
  reported: { id: "Dilaporkan", en: "Reported", variant: "butter" },
  finalized: { id: "Final", en: "Finalized", variant: "sage" },
  archived: { id: "Diarsipkan", en: "Archived", variant: "outline" },
  waiting_assignment: { id: "Menunggu penugasan", en: "Waiting for assignment", variant: "butter" },
  assigned: { id: "Ditugaskan", en: "Assigned", variant: "sky" },
  opened: { id: "Sedang ditinjau", en: "Under review", variant: "sky" },
  submitted_primary: { id: "Putusan terkirim", en: "Verdict submitted", variant: "sage" },
  submitted_supplemental: { id: "Opini tambahan", en: "Supplemental opinion", variant: "butter" },
  conflict: { id: "Perbedaan putusan", en: "Verdict conflict", variant: "rose" },
  needs_admin_review: { id: "Perlu tinjauan admin", en: "Needs admin review", variant: "peach" },
  closed: { id: "Ditutup", en: "Closed", variant: "outline" },
  pending_moderation: { id: "Menunggu moderasi", en: "Pending moderation", variant: "sky" },
  visible: { id: "Tampil", en: "Visible", variant: "sage" },
  held: { id: "Ditahan", en: "Held", variant: "rose" },
  hidden: { id: "Disembunyikan", en: "Hidden", variant: "default" },
  removed: { id: "Dihapus", en: "Removed", variant: "rose" },
  draft: { id: "Draft", en: "Draft", variant: "default" },
  chunked: { id: "Sudah dipecah", en: "Chunked", variant: "butter" },
  ingested: { id: "Ter-ingest", en: "Ingested", variant: "sage" },
  failed: { id: "Gagal", en: "Failed", variant: "rose" },
  approved: { id: "Disetujui", en: "Approved", variant: "sage" },
  rejected: { id: "Ditolak", en: "Rejected", variant: "rose" },
  pending: { id: "Menunggu", en: "Pending", variant: "butter" },
  needs_changes: { id: "Perlu perubahan", en: "Needs changes", variant: "peach" },
  active: { id: "Aktif", en: "Active", variant: "sage" },
  inactive: { id: "Nonaktif", en: "Inactive", variant: "default" },
};

const warmLabels: Record<Status, { id: string; en: string; variant: "default" | "sage" | "butter" | "rose" | "outline" }> = {
  queued: { id: "Dalam antrean", en: "Queued", variant: "default" },
  analyzing: { id: "Sedang dianalisis", en: "Analyzing", variant: "butter" },
  analyzed: { id: "Analisis selesai", en: "Analyzed", variant: "sage" },
  analysis_failed: { id: "Analisis gagal", en: "Analysis failed", variant: "rose" },
  reported: { id: "Dilaporkan", en: "Reported", variant: "butter" },
  finalized: { id: "Final", en: "Finalized", variant: "sage" },
  archived: { id: "Diarsipkan", en: "Archived", variant: "outline" },
  waiting_assignment: { id: "Menunggu penugasan", en: "Waiting for assignment", variant: "butter" },
  assigned: { id: "Ditugaskan", en: "Assigned", variant: "butter" },
  opened: { id: "Sedang ditinjau", en: "Under review", variant: "butter" },
  submitted_primary: { id: "Putusan terkirim", en: "Verdict submitted", variant: "sage" },
  submitted_supplemental: { id: "Opini tambahan", en: "Supplemental opinion", variant: "butter" },
  conflict: { id: "Perbedaan putusan", en: "Verdict conflict", variant: "rose" },
  needs_admin_review: { id: "Perlu tinjauan admin", en: "Needs admin review", variant: "butter" },
  closed: { id: "Ditutup", en: "Closed", variant: "outline" },
  pending_moderation: { id: "Menunggu moderasi", en: "Pending moderation", variant: "butter" },
  visible: { id: "Tampil", en: "Visible", variant: "sage" },
  held: { id: "Ditahan", en: "Held", variant: "rose" },
  hidden: { id: "Disembunyikan", en: "Hidden", variant: "default" },
  removed: { id: "Dihapus", en: "Removed", variant: "rose" },
  draft: { id: "Draft", en: "Draft", variant: "default" },
  chunked: { id: "Sudah dipecah", en: "Chunked", variant: "butter" },
  ingested: { id: "Ter-ingest", en: "Ingested", variant: "sage" },
  failed: { id: "Gagal", en: "Failed", variant: "rose" },
  approved: { id: "Disetujui", en: "Approved", variant: "sage" },
  rejected: { id: "Ditolak", en: "Rejected", variant: "rose" },
  pending: { id: "Menunggu", en: "Pending", variant: "butter" },
  needs_changes: { id: "Perlu perubahan", en: "Needs changes", variant: "butter" },
  active: { id: "Aktif", en: "Active", variant: "sage" },
  inactive: { id: "Nonaktif", en: "Inactive", variant: "default" },
};

export function StatusBadge({ status, palette = "warm" }: { status: Status; palette?: "default" | "warm" }) {
  const { locale } = useI18n();
  const item = palette === "warm" ? warmLabels[status] ?? warmLabels.draft : labels[status] ?? labels.draft;
  return <Badge variant={item.variant}>{item[locale]}</Badge>;
}
