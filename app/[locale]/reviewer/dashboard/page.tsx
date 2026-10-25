import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { VerdictBadge } from "@/components/panacea/verdict-badge";
import { StatusBadge } from "@/components/panacea/status-badge";
import { MemberHero } from "@/components/member/member-hero";
import { CozyPanel } from "@/components/member/cozy-panel";
import { categoryName } from "@/lib/data/categories";
import { requireRole } from "@/lib/auth/session";
import {
  getReviewerDashboardStats,
  getReviewerRecentSuggestions,
  getReviewerTasks,
} from "@/lib/reviewer/repository";
import { createTr, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";

export const metadata: Metadata = {
  title: "Dasbor Reviewer",
};

export default async function ReviewerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  const tr = createTr(locale);
  const session = await requireRole(locale, ["reviewer", "admin"]);
  const [tasks, stats, recentSuggestions] = await Promise.all([
    getReviewerTasks(session.userId),
    getReviewerDashboardStats(session.userId),
    getReviewerRecentSuggestions(session.userId, 5),
  ]);
  const activeTasks = tasks.filter((task) => task.status !== "submitted_primary" && task.status !== "submitted_supplemental");
  const highPriorityTasks = activeTasks.filter((task) => task.priority === "high").length;
  return (
    <div className="space-y-6">
      <MemberHero
        kicker={tr("Ruang reviewer", "Reviewer space")}
        kickerIcon={ShieldCheck}
        title={tr(`Halo, ${session.fullName.split(" ")[0]}.`, `Hi, ${session.fullName.split(" ")[0]}.`)}
        description={tr(
          "Tinjau kasus sesuai keahlianmu. Identitas pelapor disembunyikan; fokus pada klaim, bukti, dan salinan publik yang aman.",
          "Review cases within your expertise. Reporter identities are hidden; focus on the claim, evidence, and a safe public copy.",
        )}
        mascot="reviewer"
        actions={
          <Link href={`/${locale}/reviewer/tugas`} className={buttonVariants({ variant: "cozy" })}>
            <ClipboardCheck className="size-4" aria-hidden="true" />
            {tr("Buka daftar tugas", "Open task list")}
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label={tr("Total tugas verifikasi", "Total verification tasks")}
          value={stats.totalTasks}
          hint={`${activeTasks.length} ${tr("aktif", "active")}`}
          icon={ClipboardCheck}
          variant="cozy"
          interactive
          tone="butter"
        />
        <StatTile
          label={tr("Total publikasi", "Total publications")}
          value={stats.published}
          hint={tr("Putusanmu yang terbit di feed", "Your verdicts published to the feed")}
          icon={FileCheck2}
          variant="cozy"
          interactive
          tone="sage"
        />
        <StatTile
          label={tr("Saran KB disetujui", "Approved KB suggestions")}
          value={stats.approvedSuggestions}
          hint={tr("Kontribusi bukti yang diterima", "Accepted evidence contributions")}
          icon={BookOpenCheck}
          variant="cozy"
          interactive
          tone="butter"
        />
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <CozyPanel padded={false} interactive>
          <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#e8e2d5] px-5 py-4">
            <div>
              <h2 className="font-heading text-lg font-extrabold text-bark-900">{tr("Antrean menunggu tindakan", "Queue awaiting action")}</h2>
              <p className="mt-0.5 text-xs text-bark-500">
                {highPriorityTasks > 0
                  ? `${highPriorityTasks} ${tr("prioritas tinggi", "high priority")}`
                  : tr("Hanya kasus yang ditugaskan kepadamu", "Only cases assigned to you")}
              </p>
            </div>
            <Link href={`/${locale}/reviewer/tugas`} className="text-xs font-bold text-sage-700 hover:underline">
              {tr("Semua tugas", "All tasks")}
            </Link>
          </div>
          <ul className="divide-y divide-[#e8e2d5]">
            {activeTasks.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-bark-500">
                {tr("Tidak ada kasus aktif saat ini.", "No active cases right now.")}
              </li>
            ) : null}
            {activeTasks.map((task) => (
              <li key={task.id}>
                <Link href={`/${locale}/reviewer/tugas/${task.id}`} className="block px-5 py-4 transition hover:bg-sage-100/30">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={task.priority === "high" ? "rose" : "default"}>
                      {task.priority === "high" ? tr("Prioritas tinggi", "High priority") : tr("Normal", "Normal")}
                    </Badge>
                    <Badge variant="outline">{categoryName(task.categorySlug, locale)}</Badge>
                    <span className="ml-auto text-xs text-bark-500">{formatDate(task.assignedAt, locale)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-extrabold leading-snug text-bark-900">{task.claimTitle}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-bark-500">{tr("Analisis AI", "AI analysis")}</span>
                    <VerdictBadge verdict={task.aiVerdict} size="sm" />
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-sage-700">
                      {tr("Tinjau", "Review")}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CozyPanel>

        <CozyPanel padded={false} interactive>
          <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#e8e2d5] px-5 py-4">
            <h2 className="font-heading text-base font-extrabold text-bark-900">{tr("Saran KB terbaru", "Latest KB suggestions")}</h2>
            <Link href={`/${locale}/reviewer/knowledge-base/saran`} className="text-xs font-bold text-sage-700 hover:underline">
              {tr("Semua saran", "All suggestions")}
            </Link>
          </div>
          <ul className="divide-y divide-[#e8e2d5]">
            {recentSuggestions.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-bark-500">
                {tr("Belum ada saran KB.", "No KB suggestions yet.")}
              </li>
            ) : null}
            {recentSuggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <Link
                  href={`/${locale}/reviewer/knowledge-base/saran/${suggestion.id}/chunks`}
                  className="flex items-start gap-3 px-5 py-4 transition hover:bg-sage-100/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-bark-900">{suggestion.title}</p>
                    <p className="mt-1 text-xs text-bark-500">{formatDate(suggestion.createdAt, locale)}</p>
                  </div>
                  <StatusBadge status={suggestion.status} />
                </Link>
              </li>
            ))}
          </ul>
        </CozyPanel>
      </div>
    </div>
  );
}
