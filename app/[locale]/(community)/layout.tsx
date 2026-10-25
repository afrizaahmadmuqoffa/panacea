import type { Metadata } from "next";
import { DashboardShell } from "@/components/panacea/dashboard-shell";
import { requireRole } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  const session = await requireRole(locale, ["user", "reviewer"]);
  const area = session.role === "reviewer" ? "reviewer" : "member";
  return (
    <DashboardShell area={area} session={session}>
      {children}
    </DashboardShell>
  );
}
