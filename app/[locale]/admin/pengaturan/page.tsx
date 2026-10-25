import type { Metadata } from "next";
import { AdminSettings } from "@/components/admin/admin-settings";
import { getAdminSettings } from "@/lib/admin/repository";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Pengaturan Umum",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  await params;
  const settings = await getAdminSettings();
  return <AdminSettings settings={settings} />;
}
