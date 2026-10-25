import type { Metadata } from "next";
import { AdminForumModeration } from "@/components/admin/admin-forum-moderation";
import { getAdminThreads } from "@/lib/admin/repository";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Moderasi Forum",
};

export const dynamic = "force-dynamic";

export default async function AdminForumModerationPage({ params }: { params: Promise<{ locale: Locale }> }) {
  await params;
  const threads = await getAdminThreads();
  return <AdminForumModeration threads={threads} />;
}
