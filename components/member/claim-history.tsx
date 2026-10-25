"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileImage,
  FilterX,
  Globe2,
  Search,
  SearchCheck,
  SearchX,
  Type,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { ClaimHistorySkeleton } from "@/components/skeletons/member";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StatusBadge } from "@/components/panacea/status-badge";
import { formatDate } from "@/lib/i18n/format";
import type { ClaimStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MemberPageHeader } from "./member-page-header";

const inputIcon = {
  text: Type,
  url: Globe2,
  image: FileImage,
};

export function ClaimHistory() {
  const { locale, tr } = useI18n();
  const { claims, hydrated } = usePanacea();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return claims
      .filter((claim) => status === "all" || claim.status === status)
      .filter((claim) => type === "all" || claim.inputType === type)
      .filter((claim) => !normalized || claim.originalText.toLowerCase().includes(normalized))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [claims, query, status, type]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || status !== "all" || type !== "all";
  if (!hydrated) return <ClaimHistorySkeleton />;

  const statuses: Array<{ value: ClaimStatus | "all"; id: string; en: string }> = [
    { value: "all", id: "Semua status", en: "All statuses" },
    { value: "analyzing", id: "Sedang dianalisis", en: "Analyzing" },
    { value: "analyzed", id: "Analisis selesai", en: "Analyzed" },
    { value: "reported", id: "Dilaporkan ke pakar", en: "Reported" },
    { value: "finalized", id: "Final", en: "Finalized" },
    { value: "analysis_failed", id: "Analisis gagal", en: "Failed" },
  ];

  return (
    <div className="space-y-6">
      <MemberPageHeader
        icon={ClipboardList}
        title={tr("Klaim yang pernah kamu periksa", "Claims you have checked")}
        description={tr(
          "Semua klaim di sini hanya milik akunmu. Data klaim pengguna lain tidak pernah ditampilkan.",
          "Every claim here belongs to your account. Other users' claim data is never shown.",
        )}
        actions={
          <Link href={`/${locale}/cek-klaim`} className={buttonVariants({ variant: "cozy" })}>
            <SearchCheck className="size-4" aria-hidden="true" />
            {tr("Cek klaim baru", "Check a new claim")}
          </Link>
        }
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tr("Cari teks klaim...", "Search claim text...")}
              className="pl-11"
              aria-label={tr("Cari riwayat klaim", "Search claim history")}
            />
          </div>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label={tr("Filter status", "Filter status")}
            className="md:w-48"
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item[locale]}
              </option>
            ))}
          </Select>
          <Select
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-label={tr("Filter jenis input", "Filter input type")}
            className="md:w-40"
          >
            <option value="all">{tr("Semua jenis", "All types")}</option>
            <option value="text">{tr("Teks", "Text")}</option>
            <option value="url">URL</option>
            <option value="image">{tr("Gambar", "Image")}</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-bark-700">
          {filtered.length} {tr("klaim", "claims")}
        </p>
        {query || status !== "all" || type !== "all" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setStatus("all");
              setType("all");
            }}
          >
            {tr("Hapus filter", "Clear filters")}
          </Button>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="hidden md:block">
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>{tr("Klaim", "Claim")}</TH>
                    <TH>{tr("Jenis", "Type")}</TH>
                    <TH>{tr("Tanggal", "Date")}</TH>
                    <TH>{tr("Status", "Status")}</TH>
                    <TH>{tr("Laporan", "Report")}</TH>
                    <TH><span className="sr-only">{tr("Aksi", "Action")}</span></TH>
                  </TR>
                </THead>
                <TBody>
                  {filtered.map((claim) => {
                    const Icon = inputIcon[claim.inputType];
                    const reviewHref = claim.reviewerFeedSlug
                      ? `/${locale}/feed-terverifikasi/${claim.reviewerFeedSlug}`
                      : "";
                    return (
                      <TR key={claim.id}>
                        <TD className="max-w-md">
                          <Link
                            href={reviewHref || `/${locale}/cek-klaim/${claim.id}`}
                            className="line-clamp-2 font-bold text-bark-900 hover:text-sage-700"
                          >
                            {claim.originalText}
                          </Link>
                        </TD>
                        <TD>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                            <Icon className="size-3.5 text-bark-500" aria-hidden="true" />
                            {claim.inputType}
                          </span>
                        </TD>
                        <TD className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs">
                            <CalendarDays className="size-3.5 text-bark-500" aria-hidden="true" />
                            {formatDate(claim.createdAt, locale)}
                          </span>
                        </TD>
                        <TD><StatusBadge status={claim.status} palette="warm" /></TD>
                        <TD>{claim.reportStatus ? <StatusBadge status={claim.reportStatus} palette="warm" /> : <span className="text-xs text-bark-500">-</span>}</TD>
                        <TD className="text-right">
                          <Link
                            href={reviewHref || `/${locale}/cek-klaim/${claim.id}`}
                            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "whitespace-nowrap")}
                          >
                            {reviewHref ? tr("Lihat hasil pakar", "View expert result") : tr("Buka", "Open")}
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                          </Link>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </TableWrap>
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((claim) => (
              <Link
                key={claim.id}
                href={
                  claim.reviewerFeedSlug
                    ? `/${locale}/feed-terverifikasi/${claim.reviewerFeedSlug}`
                    : `/${locale}/cek-klaim/${claim.id}`
                }
                className="rounded-[18px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover"
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={claim.status} palette="warm" />
                  <span className="inline-flex items-center gap-1 text-xs text-bark-500">
                    <CalendarDays className="size-3" aria-hidden="true" />
                    {formatDate(claim.createdAt, locale)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm font-bold leading-snug text-bark-900">{claim.originalText}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-bark-500">
                    {(() => {
                      const Icon = inputIcon[claim.inputType];
                      return <Icon className="size-3" aria-hidden="true" />;
                    })()}
                    {claim.inputType}
                  </span>
                  {claim.reportStatus ? <StatusBadge status={claim.reportStatus} palette="warm" /> : null}
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : isFiltered ? (
        <EmptyState
          icon={hasQuery ? SearchX : FilterX}
          state="filtered"
          title={tr("Belum ada klaim yang cocok", "No matching claims yet")}
          description={tr("Ubah kata kunci atau filter pencarian.", "Adjust the keyword or search filters.")}
          action={
            <div className="flex gap-2">
              <Button variant="cozySoft" onClick={() => { setQuery(""); setStatus("all"); setType("all"); }}>
                {tr("Hapus filter", "Clear filters")}
              </Button>
              <Link href={`/${locale}/cek-klaim`} className={buttonVariants({ variant: "cozy" })}>
                {tr("Cek klaim", "Check a claim")}
              </Link>
            </div>
          }
        />
      ) : (
        <EmptyState
          icon={ClipboardList}
          state="none"
          title={tr("Belum ada klaim", "No claims yet")}
          description={tr("Mulai periksa klaim pertama kamu.", "Start by checking your first claim.")}
          action={
            <Link href={`/${locale}/cek-klaim`} className={buttonVariants({ variant: "cozy" })}>
              {tr("Cek klaim", "Check a claim")}
            </Link>
          }
        />
      )}
    </div>
  );
}
