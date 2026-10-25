import type { Metadata } from "next";
import { SuggestionList } from "@/components/reviewer/suggestion-list";
import { requireRole } from "@/lib/auth/session";
import { getPublicCategories } from "@/lib/data/repository";
import { getKbSourceOptions, getReviewerSuggestions } from "@/lib/reviewer/repository";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Saran Knowledge Base",
};

export const dynamic = "force-dynamic";

export default async function SuggestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  const session = await requireRole(locale, ["reviewer", "admin"]);
  const [suggestions, sources, categories] = await Promise.all([
    getReviewerSuggestions(session.userId),
    getKbSourceOptions(),
    getPublicCategories(),
  ]);
  return <SuggestionList suggestions={suggestions} sources={sources} categories={categories} />;
}
