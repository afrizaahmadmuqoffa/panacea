import type { Metadata } from "next";
import { AdminReviewers } from "@/components/admin/admin-reviewers";
import { getAdminCategories, getAdminReviewers } from "@/lib/admin/repository";

export const metadata: Metadata = {
  title: "Manajemen Reviewer",
};

export const dynamic = "force-dynamic";

export default async function AdminReviewersPage() {
  const [reviewers, categories] = await Promise.all([getAdminReviewers(), getAdminCategories()]);
  return <AdminReviewers reviewers={reviewers} categories={categories} />;
}
