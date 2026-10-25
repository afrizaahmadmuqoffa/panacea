import type { Metadata } from "next";
import { AdminKnowledgeBase } from "@/components/admin/admin-knowledge-base";
import { getAdminKbSources, getAdminCategories } from "@/lib/admin/repository";

export const metadata: Metadata = {
  title: "Sumber Knowledge Base",
};

export const dynamic = "force-dynamic";

export default async function AdminKnowledgeBasePage() {
  const [sources, categories] = await Promise.all([getAdminKbSources(), getAdminCategories()]);
  return <AdminKnowledgeBase sources={sources} categories={categories} />;
}
