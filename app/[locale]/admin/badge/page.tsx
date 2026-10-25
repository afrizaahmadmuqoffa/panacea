import type { Metadata } from "next";
import { AdminBadges } from "@/components/admin/admin-badges";
import { getAdminBadges } from "@/lib/admin/repository";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Konfigurasi Badge",
};

export const dynamic = "force-dynamic";

export default async function AdminBadgesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  await params;
  const badges = await getAdminBadges();
  return <AdminBadges badges={badges} />;
}
