import type { Metadata } from "next";
import { ReviewCase } from "@/components/reviewer/review-case";
import { requireRole } from "@/lib/auth/session";
import { getReviewerKbSources, getReviewerTasks } from "@/lib/reviewer/repository";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Tinjau Klaim",
};

export const dynamic = "force-dynamic";

export default async function ReviewCasePage({
  params,
}: {
  params: Promise<{ locale: string; reportId: string }>;
}) {
  const { locale: localeParam, reportId } = await params;
  const locale = localeParam as Locale;
  const session = await requireRole(locale, ["reviewer", "admin"]);
  const [tasks, kbSources] = await Promise.all([getReviewerTasks(session.userId), getReviewerKbSources()]);
  const task = tasks.find((item) => item.id === reportId);
  return <ReviewCase task={task} kbSources={kbSources} />;
}
