import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardHome } from "@/components/member/dashboard-home";
import { requireSession, roleHome } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Dasbor",
};

export default async function DashboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const session = await requireSession(locale);
  if (session.role !== "user") redirect(roleHome(locale, session.role));
  return <DashboardHome />;
}
