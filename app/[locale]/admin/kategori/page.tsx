import type { Metadata } from "next";
import { AdminCategories } from "@/components/admin/admin-categories";
import { getAdminCategories } from "@/lib/admin/repository";

export const metadata: Metadata = {
  title: "Manajemen Kategori",
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();
  return <AdminCategories categories={categories} />;
}
