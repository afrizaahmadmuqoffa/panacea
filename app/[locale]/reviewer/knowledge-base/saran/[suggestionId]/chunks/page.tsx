import type { Metadata } from "next";
import { SuggestionChunks } from "@/components/reviewer/suggestion-chunks";
import { requireRole } from "@/lib/auth/session";
import { getReviewerSuggestions } from "@/lib/reviewer/repository";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Kelola Chunk Saran",
};

export const dynamic = "force-dynamic";

export default async function SuggestionChunksPage({
  params,
}: {
  params: Promise<{ locale: string; suggestionId: string }>;
}) {
  const { locale: localeParam, suggestionId } = await params;
  const locale = localeParam as Locale;
  const session = await requireRole(locale, ["reviewer", "admin"]);
  const suggestions = await getReviewerSuggestions(session.userId);
  const suggestion = suggestions.find((item) => item.id === suggestionId);
  return <SuggestionChunks suggestion={suggestion} />;
}
