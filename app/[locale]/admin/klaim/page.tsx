import type { Metadata } from "next";
import { AdminClaims } from "@/components/admin/admin-claims";
import { getAdminCategories, getAdminClaims, getAdminReviewers } from "@/lib/admin/repository";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Monitoring Klaim",
};

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  await params;
  const [claims, reviewers, categories] = await Promise.all([
    getAdminClaims(),
    getAdminReviewers(),
    getAdminCategories(),
  ]);
  return <AdminClaims claims={claims} reviewers={reviewers} categories={categories} />;
}
