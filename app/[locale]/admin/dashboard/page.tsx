import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  BookMarked,
  MessagesSquare,
  ScrollText,
  Stethoscope,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";
import { MemberHero } from "@/components/member/member-hero";
import { StatusBadge } from "@/components/panacea/status-badge";
import { VerdictBadge } from "@/components/panacea/verdict-badge";
import { ServiceStatus } from "@/components/admin/service-status";
import { getAdminOverview } from "@/lib/admin/repository";
import { requireRole } from "@/lib/auth/session";
import { categoryName } from "@/lib/data/categories";
import { createTr, type Locale } from "@/lib/i18n/config";
import { formatDate, formatRelative } from "@/lib/i18n/format";

export const metadata: Metadata = {
  title: "Dasbor Admin",
};

export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const tr = createTr(locale);
  await requireRole(locale as Locale, ["admin"]);
  const data = await getAdminOverview();

  return (
    <div className="space-y-5">
      <MemberHero
        kicker={tr("Ringkasan operasional", "Operational overview")}
        kickerIcon={Activity}
        title={tr("Kondisi sistem hari ini.", "System condition today.")}
        description={tr(
          "Status layanan diuji langsung ke database, provider AI, dan Europe PMC. Daftar di bawah menunjukkan aktivitas terbaru.",
          "Service status is tested live against the database, AI provider, and Europe PMC. The lists below show the latest activity.",
        )}
        mascot="summary"
        mascotClassName="translate-y-8 max-w-[364px] lg:max-w-[420px] lg:translate-y-10"
        actions={
          <Badge variant="sage">
            <Activity className="size-3.5" aria-hidden="true" />
            {tr("Admin", "Admin")}
          </Badge>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label={tr("Pengguna", "Users")}
          value={data.stats.users}
          hint={`${data.stats.activeUsers} ${tr("aktif", "active")}`}
          icon={Users}
          tone="sage"
        />
        <StatTile
          label={tr("Reviewer aktif", "Active reviewers")}
          value={data.stats.availableReviewers}
          hint={`${data.stats.reviewers} ${tr("terdaftar", "registered")}`}
          icon={Stethoscope}
          tone="sky"
        />
        <StatTile
          label={tr("Saran KB menunggu", "Pending KB suggestions")}
          value={data.stats.pendingSuggestions}
          hint={tr("Perlu ditinjau", "Awaiting review")}
          icon={BookMarked}
          tone="butter"
        />
        <StatTile
          label={tr("Komentar tertahan", "Held comments")}
          value={data.stats.heldComments}
          hint={tr("Perlu keputusan manusia", "Needs human decision")}
          icon={MessagesSquare}
          tone="peach"
        />
      </section>

      <ServiceStatus initial={data.services} />

      <div className="grid gap-5 lg:auto-rows-fr lg:grid-cols-2">
        <section className="min-w-0 rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow cozy-hover hover:border-sage-300">
          <div className="flex items-center justify-between gap-3 border-b border-[#e8e2d5] px-5 py-3.5">
            <h2 className="min-w-0 font-heading text-base font-extrabold text-bark-900">
              {tr("Klaim terbaru", "Latest claims")}
            </h2>
            <Link href={`/${locale}/admin/klaim`} className="shrink-0 text-xs font-bold text-sage-700 hover:underline">
              {tr("Semua klaim", "All claims")}
            </Link>
          </div>
          <ul className="divide-y divide-[#e8e2d5]">
            {data.recentClaims.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-bark-500">
                {tr("Belum ada klaim masuk.", "No claims yet.")}
              </li>
            ) : null}
            {data.recentClaims.map((claim) => (
              <li key={claim.id}>
                <Link
                  href={`/${locale}/admin/klaim`}
                  className="flex items-start gap-3 px-5 py-3 transition hover:bg-sage-100/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-bark-900">{claim.text}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-bark-500">
                      <span>{claim.categorySlug ? categoryName(claim.categorySlug, locale) : tr("Tanpa kategori", "No category")}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatRelative(claim.createdAt, locale)}</span>
                    </p>
                  </div>
                  <StatusBadge status={claim.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow cozy-hover hover:border-sage-300">
          <div className="flex items-center justify-between gap-3 border-b border-[#e8e2d5] px-5 py-3.5">
            <h2 className="min-w-0 font-heading text-base font-extrabold text-bark-900">
              {tr("Feed terverifikasi terbaru", "Latest verified feed")}
            </h2>
            <Link href={`/${locale}/admin/feed`} className="shrink-0 text-xs font-bold text-sage-700 hover:underline">
              {tr("Kelola feed", "Manage feed")}
            </Link>
          </div>
          <ul className="divide-y divide-[#e8e2d5]">
            {data.recentFeed.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-bark-500">
                {tr("Belum ada feed terbit.", "No published feed yet.")}
              </li>
            ) : null}
            {data.recentFeed.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/${locale}/admin/feed`}
                  className="flex items-start gap-3 px-5 py-3 transition hover:bg-sage-100/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-bark-900">{item.title[locale]}</p>
                    <p className="mt-1 text-xs text-bark-500">{formatRelative(item.publishedAt, locale)}</p>
                  </div>
                  <VerdictBadge verdict={item.verdict} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow cozy-hover hover:border-sage-300">
          <div className="flex items-center justify-between gap-3 border-b border-[#e8e2d5] px-5 py-3.5">
            <h2 className="min-w-0 font-heading text-base font-extrabold text-bark-900">
              {tr("Saran knowledge base terbaru", "Latest KB suggestions")}
            </h2>
            <Link href={`/${locale}/admin/saran-kb`} className="shrink-0 text-xs font-bold text-sage-700 hover:underline">
              {tr("Semua saran", "All suggestions")}
            </Link>
          </div>
          <ul className="divide-y divide-[#e8e2d5]">
            {data.recentSuggestions.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-bark-500">
                {tr("Belum ada saran KB.", "No KB suggestions yet.")}
              </li>
            ) : null}
            {data.recentSuggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <Link
                  href={`/${locale}/reviewer/knowledge-base/saran/${suggestion.id}/chunks`}
                  className="flex items-start gap-3 px-5 py-3 transition hover:bg-sage-100/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-bark-900">{suggestion.title}</p>
                    <p className="mt-1 text-xs text-bark-500">{formatRelative(suggestion.createdAt, locale)}</p>
                  </div>
                  <StatusBadge status={suggestion.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow cozy-hover hover:border-sage-300">
          <div className="flex items-center justify-between gap-3 border-b border-[#e8e2d5] px-5 py-3.5">
            <h2 className="min-w-0 font-heading text-base font-extrabold text-bark-900">
              {tr("Moderasi forum terbaru", "Latest forum moderation")}
            </h2>
            <Link
              href={`/${locale}/admin/forum-moderasi`}
              className="shrink-0 text-xs font-bold text-sage-700 hover:underline"
            >
              {tr("Buka moderasi", "Open moderation")}
            </Link>
          </div>
          <ul className="divide-y divide-[#e8e2d5]">
            {data.recentModeration.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-bark-500">
                {tr("Tidak ada konten tertahan.", "No held content.")}
              </li>
            ) : null}
            {data.recentModeration.map((comment) => (
              <li key={comment.id}>
                <Link
                  href={`/${locale}/admin/forum-moderasi`}
                  className="flex items-start gap-3 px-5 py-3 transition hover:bg-sage-100/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-bark-900">{comment.body}</p>
                    <p className="mt-1 truncate text-xs text-bark-500">
                      {comment.threadTitle} · {formatRelative(comment.createdAt, locale)}
                    </p>
                  </div>
                  <StatusBadge status={comment.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="min-w-0 rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow cozy-hover hover:border-sage-300">
        <div className="flex items-center justify-between gap-3 border-b border-[#e8e2d5] px-5 py-3.5">
          <div>
            <h2 className="min-w-0 font-heading text-base font-extrabold text-bark-900">
              {tr("Audit terbaru", "Recent audit")}
            </h2>
            <p className="mt-0.5 text-xs text-bark-500">
              {tr("Aktor, aksi, target, dan request ID", "Actor, action, target, and request ID")}
            </p>
          </div>
          <Link href={`/${locale}/admin/audit`} className="inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline">
            <Activity className="size-3.5" aria-hidden="true" />
            {tr("Lihat audit log", "View audit log")}
          </Link>
        </div>
        <div className="overflow-x-auto">
          {data.audit.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              state="none"
              compact
              title={tr("Belum ada event audit", "No audit events yet")}
              description={tr("Perubahan penting pada sistem akan tercatat di sini.", "Important system changes will be recorded here.")}
            />
          ) : (
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-cream-100 text-xs uppercase tracking-[0.08em] text-bark-700">
                <tr>
                  <th className="px-5 py-3">{tr("Waktu", "Time")}</th>
                  <th className="px-5 py-3">{tr("Aktor", "Actor")}</th>
                  <th className="px-5 py-3">{tr("Aksi", "Action")}</th>
                  <th className="px-5 py-3">{tr("Target", "Target")}</th>
                  <th className="px-5 py-3">Request</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e2d5]">
                {data.audit.map((log) => (
                  <tr key={log.id} className="hover:bg-sage-100/30">
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-bark-500">{formatDate(log.createdAt, locale, true)}</td>
                    <td className="px-5 py-3 text-xs font-bold text-bark-900">{log.actor}</td>
                    <td className="px-5 py-3"><Badge variant="outline">{log.action}</Badge></td>
                    <td className="px-5 py-3 text-xs text-bark-700">{log.target}</td>
                    <td className="px-5 py-3 font-mono text-xs text-bark-500">{log.requestId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
