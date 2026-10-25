import type { Metadata } from "next";
import { AdminAudit } from "@/components/admin/admin-audit";
import { getAdminAudit } from "@/lib/admin/repository";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Audit Log",
};

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({ params }: { params: Promise<{ locale: Locale }> }) {
  await params;
  const logs = await getAdminAudit();
  return <AdminAudit logs={logs} />;
}
