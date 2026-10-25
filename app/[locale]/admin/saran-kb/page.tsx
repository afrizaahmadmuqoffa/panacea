import type { Metadata } from "next";
import { AdminSuggestions } from "@/components/admin/admin-suggestions";
import { getAdminSuggestions } from "@/lib/admin/repository";
import { getKbSourceOptions } from "@/lib/reviewer/repository";

export const metadata: Metadata = {
  title: "Saran dari Reviewer",
};

export const dynamic = "force-dynamic";

export default async function AdminSuggestionsPage() {
  const [suggestions, sources] = await Promise.all([getAdminSuggestions(), getKbSourceOptions()]);
  return <AdminSuggestions suggestions={suggestions} sources={sources} />;
}
