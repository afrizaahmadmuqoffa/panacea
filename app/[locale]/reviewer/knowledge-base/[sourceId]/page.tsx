import type { Metadata } from "next";
import { ReviewerKnowledgeBaseDetail } from "@/components/reviewer/knowledge-base-detail";
import { getReviewerKbSource } from "@/lib/reviewer/repository";

export const metadata: Metadata = {
  title: "Detail Sumber KB",
};

export const dynamic = "force-dynamic";

export default async function ReviewerKnowledgeBaseSourcePage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  const source = await getReviewerKbSource(sourceId);
  return <ReviewerKnowledgeBaseDetail source={source ?? undefined} />;
}