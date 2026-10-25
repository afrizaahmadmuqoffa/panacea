"use client";

import {
  ClipboardList,
  Eye,
  FilterX,
  LoaderCircle,
  Search,
  SearchX,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { reassignClaimAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StatusBadge } from "@/components/panacea/status-badge";
import { VerdictBadge } from "@/components/panacea/verdict-badge";
import { categoryName } from "@/lib/data/categories";
import { formatDate } from "@/lib/i18n/format";
import type { Category, Claim, ReviewerProfile } from "@/lib/types";

export function AdminClaims({
  claims,
  reviewers,
  categories,
}: {
  claims: Claim[];
  reviewers: ReviewerProfile[];
  categories: Category[];
}) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [detail, setDetail] = useState<Claim | null>(null);
  const [reassign, setReassign] = useState<Claim | null>(null);
  const [reviewer, setReviewer] = useState(reviewers[0]?.id ?? "");
  const [reassigning, setReassigning] = useState(false);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return claims
      .filter((claim) => status === "all" || claim.status === status)
      .filter((claim) => category === "all" || claim.categorySlug === category)
      .filter((claim) => !normalized || claim.originalText.toLowerCase().includes(normalized) || claim.id.includes(normalized));
  }, [claims, query, status, category]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || status !== "all" || category !== "all";

  async function confirmReassign() {
    if (!reassign || !reviewer) return;
    setReassigning(true);
    try {
      const target = reviewers.find((item) => item.id === reviewer);
      const result = await reassignClaimAction(locale, reassign.id, reviewer);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setReassign(null);
      toast.success(tr(`Kasus ditugaskan ke ${target?.fullName ?? "reviewer"}.`, `Case assigned to ${target?.fullName ?? "reviewer"}.`));
      router.refresh();
    } finally {
      setReassigning(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Monitoring klaim", "Claim monitoring")}
        title={tr("Semua klaim dan status penugasannya", "All claims and assignment status")}
        description={tr(
          "Pantau status analisis, verdict AI, laporan, dan assignment. Reassign manual hanya untuk kasus yang membutuhkan koreksi operasional.",
          "Monitor analysis status, AI verdicts, reports, and assignments. Manual reassignment is only for cases needing operational correction.",
        )}
        actions={<Badge variant="sky"><ShieldCheck className="size-3.5" aria-hidden="true" />{tr("Operasional", "Operational")}</Badge>}
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr("Cari klaim atau ID...", "Search claim or ID...")} className="pl-11" aria-label={tr("Cari klaim", "Search claims")} />
          </div>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={tr("Filter status", "Filter status")} className="md:w-48">
            <option value="all">{tr("Semua status", "All statuses")}</option>
            <option value="analyzing">{tr("Sedang dianalisis", "Analyzing")}</option>
            <option value="analyzed">{tr("Analisis selesai", "Analyzed")}</option>
            <option value="reported">{tr("Dilaporkan", "Reported")}</option>
            <option value="finalized">{tr("Final", "Finalized")}</option>
            <option value="analysis_failed">{tr("Analisis gagal", "Failed")}</option>
          </Select>
          <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label={tr("Filter kategori", "Filter category")} className="md:w-56">
            <option value="all">{tr("Semua kategori", "All categories")}</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>{item.name[locale]}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-bark-700">{visible.length} {tr("klaim", "claims")}</p>
        <span className="text-xs text-bark-500">{tr("Identitas pelapor tidak ditampilkan di monitoring", "Reporter identity is not shown in monitoring")}</span>
      </div>

      {visible.length > 0 ? (
        <>
          <div className="hidden xl:block">
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>ID</TH>
                    <TH>{tr("Klaim", "Claim")}</TH>
                    <TH>{tr("Kategori", "Category")}</TH>
                    <TH>{tr("Status", "Status")}</TH>
                    <TH>{tr("Verdict AI", "AI verdict")}</TH>
                    <TH>{tr("Laporan", "Report")}</TH>
                    <TH>{tr("Tanggal", "Date")}</TH>
                    <TH>{tr("Aksi", "Actions")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {visible.map((claim) => (
                    <TR key={claim.id}>
                      <TD><span className="font-mono text-xs text-bark-500">{claim.id}</span></TD>
                      <TD className="max-w-xs"><p className="line-clamp-2 text-xs font-bold text-bark-900">{claim.originalText}</p></TD>
                      <TD><Badge variant="outline">{categoryName(claim.categorySlug, locale)}</Badge></TD>
                      <TD><StatusBadge status={claim.status} /></TD>
                      <TD>{claim.analysis?.verdict ? <VerdictBadge verdict={claim.analysis.verdict} size="sm" /> : <span className="text-xs text-bark-500">-</span>}</TD>
                      <TD>{claim.reportStatus ? <StatusBadge status={claim.reportStatus} /> : <span className="text-xs text-bark-500">-</span>}</TD>
                      <TD className="whitespace-nowrap text-xs">{formatDate(claim.createdAt, locale)}</TD>
                      <TD>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="size-11" onClick={() => setDetail(claim)} aria-label={tr("Lihat detail", "View details")}><Eye className="size-3.5" aria-hidden="true" /></Button>
                          <Button variant="ghost" size="icon" className="size-11" onClick={() => setReassign(claim)} aria-label={tr("Reassign", "Reassign")}><UserCog className="size-3.5" aria-hidden="true" /></Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </div>

          <div className="grid gap-3 xl:hidden">
            {visible.map((claim) => (
              <article key={claim.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={claim.status} />
                  {claim.analysis?.verdict ? <VerdictBadge verdict={claim.analysis.verdict} size="sm" /> : null}
                  <span className="ml-auto font-mono text-xs text-bark-500">{claim.id}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-bold text-bark-900">{claim.originalText}</p>
                <p className="mt-1 text-xs text-bark-500">{categoryName(claim.categorySlug, locale)} · {formatDate(claim.createdAt, locale)}</p>
                <div className="mt-3 flex justify-end gap-1 border-t border-cream-200 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setDetail(claim)}><Eye className="size-3.5" aria-hidden="true" />{tr("Detail", "Details")}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setReassign(claim)}><UserCog className="size-3.5" aria-hidden="true" />Reassign</Button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : isFiltered ? (
        <EmptyState
          icon={hasQuery ? SearchX : FilterX}
          state="filtered"
          title={tr("Tidak ada klaim yang cocok", "No matching claims")}
          description={tr("Ubah kata kunci atau filter untuk melihat klaim lain.", "Change the keyword or filters to see other claims.")}
          action={<Button variant="secondary" onClick={() => { setQuery(""); setStatus("all"); setCategory("all"); }}>{tr("Hapus filter", "Clear filters")}</Button>}
        />
      ) : (
        <EmptyState
          icon={ClipboardList}
          state="none"
          title={tr("Belum ada klaim", "No claims yet")}
          description={tr("Klaim yang dikirim anggota akan tampil di sini.", "Claims submitted by members will appear here.")}
        />
      )}

      <Dialog
        open={detail !== null}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title={tr("Detail klaim", "Claim details")}
        description={detail?.id}
        className="sm:max-w-2xl"
        footer={<Button variant="secondary" onClick={() => setDetail(null)}>{tr("Tutup", "Close")}</Button>}
      >
        {detail ? (
          <div className="space-y-3">
            <div className="rounded-md bg-[#fff7de] p-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-bark-500">{tr("Teks klaim", "Claim text")}</p>
              <p className="mt-1 text-sm leading-relaxed text-bark-900">{detail.originalText}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={detail.status} />
              {detail.analysis?.verdict ? <VerdictBadge verdict={detail.analysis.verdict} /> : null}
              {detail.reportStatus ? <StatusBadge status={detail.reportStatus} /> : null}
            </div>
            {detail.analysis?.summary ? (
              <div className="rounded-md border border-cream-200 p-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-bark-500">{tr("Ringkasan analisis AI", "AI analysis summary")}</p>
                <p className="mt-1 text-xs leading-relaxed text-bark-700">{detail.analysis.summary[locale]}</p>
              </div>
            ) : null}
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-md bg-cream-50 p-2.5"><span className="text-bark-500">{tr("Model", "Model")}: </span><span className="font-bold text-bark-700">{detail.analysis?.modelName ?? "-"}</span></div>
              <div className="rounded-md bg-cream-50 p-2.5"><span className="text-bark-500">{tr("Prompt", "Prompt")}: </span><span className="font-bold text-bark-700">{detail.analysis?.promptVersion ?? "-"}</span></div>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={reassign !== null}
        onOpenChange={(open) => { if (!open) setReassign(null); }}
        title={tr("Reassign kasus", "Reassign case")}
        description={tr("Assignment baru akan dikirim ke reviewer terpilih dan dicatat di audit.", "A new assignment will be sent to the selected reviewer and recorded in the audit log.")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReassign(null)} disabled={reassigning}>{tr("Batal", "Cancel")}</Button>
            <Button onClick={() => void confirmReassign()} disabled={reassigning}>
              {reassigning ? <LoaderCircle className="size-4 spin" aria-hidden="true" /> : null}
              {reassigning ? tr("Menyimpan...", "Saving...") : tr("Reassign", "Reassign")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label htmlFor="reassign-reviewer" className="text-[13px] font-bold text-bark-700">{tr("Reviewer", "Reviewer")}</label>
          <Select id="reassign-reviewer" value={reviewer} onChange={(event) => setReviewer(event.target.value)}>
            {reviewers.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.fullName} · {profile.categorySlugs.map((slug) => categoryName(slug, locale)).join(", ")}</option>
            ))}
          </Select>
          {reassign ? <p className="rounded-md bg-[#fff7de] p-3 text-xs leading-relaxed text-bark-700">{reassign.originalText}</p> : null}
        </div>
      </Dialog>
    </div>
  );
}
