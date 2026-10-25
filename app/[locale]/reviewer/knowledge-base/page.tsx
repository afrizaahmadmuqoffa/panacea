import type { Metadata } from "next";
import { ReviewerKnowledgeBase } from "@/components/reviewer/knowledge-base-list";
import { getPublicCategories } from "@/lib/data/repository";
import { getReviewerKbSources } from "@/lib/reviewer/repository";

export const metadata: Metadata = {
  title: "Knowledge Base",
};

export const dynamic = "force-dynamic";

export default async function ReviewerKnowledgeBasePage() {
  const [sources, categories] = await Promise.all([getReviewerKbSources(), getPublicCategories()]);
  return <ReviewerKnowledgeBase sources={sources} categories={categories} />;
}
