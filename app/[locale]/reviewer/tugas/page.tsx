import type { Metadata } from "next";
import { ReviewerTaskList } from "@/components/reviewer/task-list";
import { getPublicCategories } from "@/lib/data/repository";
import { requireRole } from "@/lib/auth/session";
import { getReviewerTasks } from "@/lib/reviewer/repository";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Daftar Tugas",
};

export const dynamic = "force-dynamic";

export default async function ReviewerTasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  const session = await requireRole(locale, ["reviewer", "admin"]);
  const [tasks, categories] = await Promise.all([getReviewerTasks(session.userId), getPublicCategories()]);
  return <ReviewerTaskList tasks={tasks} categories={categories} />;
}
