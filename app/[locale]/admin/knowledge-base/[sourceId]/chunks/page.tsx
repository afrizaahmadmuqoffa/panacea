import type { Metadata } from "next";
import { SourceChunks } from "@/components/admin/source-chunks";
import { getAdminKbSource } from "@/lib/admin/repository";

export const metadata: Metadata = {
  title: "Preview & CRUD Chunk",
};

export const dynamic = "force-dynamic";

export default async function SourceChunksPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  const source = await getAdminKbSource(sourceId);
  return <SourceChunks source={source ?? undefined} />;
}
