import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/admin/article-editor";
import { getAdminCategories, getAdminKbSource } from "@/lib/admin/repository";

export const metadata: Metadata = {
  title: "Edit Artikel KB",
};

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [source, categories] = await Promise.all([getAdminKbSource(id), getAdminCategories()]);
  if (!source) notFound();
  return <ArticleEditor source={source} categories={categories} />;
}
