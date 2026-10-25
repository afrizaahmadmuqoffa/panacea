import type { Metadata } from "next";
import { AdminGameStatements } from "@/components/admin/admin-game-statements";
import { getAdminCategories, getAdminGameStatements } from "@/lib/admin/repository";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Bank Soal Game",
};

export const dynamic = "force-dynamic";

export default async function AdminGameStatementsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  await params;
  const [statements, categories] = await Promise.all([getAdminGameStatements(), getAdminCategories()]);
  return <AdminGameStatements statements={statements} categories={categories} />;
}
