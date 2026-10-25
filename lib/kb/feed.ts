import "server-only";
import { getServerEnv } from "@/lib/env";
import { chunkText } from "@/lib/kb/ingest";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type FeedKbRow = {
  slug: string;
  title_id: string | null;
  title_en: string | null;
  public_claim_text_id: string | null;
  public_claim_text_en: string | null;
  verdict: string;
  summary_id: string | null;
  summary_en: string | null;
  expert_note_id: string | null;
  expert_note_en: string | null;
  limitations_id: string | null;
  limitations_en: string | null;
  evidence: unknown;
  category_id: string | null;
};

function evidenceLines(evidence: unknown): string[] {
  if (!Array.isArray(evidence)) return [];
  return evidence.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!title) return [];
    const source = typeof row.source === "string" ? row.source.trim() : "";
    const year = typeof row.year === "number" || typeof row.year === "string" ? String(row.year) : "";
    const identifier = typeof row.identifier === "string" ? row.identifier.trim() : "";
    const url = typeof row.url === "string" ? row.url.trim() : "";
    const meta = [source, year, identifier, url].filter(Boolean).join(", ");
    return [meta ? `${title} (${meta})` : title];
  });
}

export function composeFeedKbContent(feed: FeedKbRow): string {
  const blocks: string[] = [];
  const title = feed.title_id || feed.title_en;
  if (title) blocks.push(`Judul: ${title}`);
  if (feed.title_en && feed.title_en !== feed.title_id) blocks.push(`Title: ${feed.title_en}`);
  if (feed.public_claim_text_id) blocks.push(`Klaim publik: ${feed.public_claim_text_id}`);
  blocks.push(`Putusan pakar: ${feed.verdict}`);
  if (feed.summary_id || feed.summary_en) {
    blocks.push(`Ringkasan: ${[feed.summary_id, feed.summary_en].filter(Boolean).join(" ")}`);
  }
  if (feed.expert_note_id || feed.expert_note_en) {
    blocks.push(`Catatan pakar: ${[feed.expert_note_id, feed.expert_note_en].filter(Boolean).join(" ")}`);
  }
  if (feed.limitations_id || feed.limitations_en) {
    blocks.push(`Batasan: ${[feed.limitations_id, feed.limitations_en].filter(Boolean).join(" ")}`);
  }
  const evidence = evidenceLines(feed.evidence);
  if (evidence.length > 0) blocks.push(`Bukti:\n- ${evidence.join("\n- ")}`);
  return blocks.join("\n\n");
}

function feedSourceUrl(slug: string) {
  return `/feed-terverifikasi/${slug}`;
}

export async function ingestFeedToKb(feedId: string, actorId: string) {
  const admin = getSupabaseAdmin();
  const feed = await admin
    .from("verified_feed")
    .select(
      "slug, title_id, title_en, public_claim_text_id, public_claim_text_en, verdict, summary_id, summary_en, expert_note_id, expert_note_en, limitations_id, limitations_en, evidence, category_id, published_at",
    )
    .eq("id", feedId)
    .maybeSingle();
  if (feed.error || !feed.data) throw new Error(feed.error?.message ?? "Feed not found.");

  const row = feed.data as FeedKbRow & { published_at: string | null };
  const url = feedSourceUrl(row.slug);

  const existing = await admin
    .schema("private")
    .from("kb_sources")
    .select("id")
    .eq("source_url", url)
    .maybeSingle();
  if (existing.data) return null;

  const year = row.published_at ? new Date(row.published_at).getFullYear() : new Date().getFullYear();
  const source = await admin
    .schema("private")
    .from("kb_sources")
    .insert({
      type: "article",
      title: (row.title_id || row.title_en || "Feed terverifikasi").slice(0, 300),
      author: "Feed terverifikasi",
      year: Number.isFinite(year) ? year : new Date().getFullYear(),
      category_id: row.category_id,
      source_url: url,
      status: "chunked",
      created_by: actorId,
    })
    .select("id")
    .single();
  if (source.error || !source.data) throw new Error(source.error?.message ?? "KB source insert failed.");

  const sourceId = source.data.id as string;
  const content = composeFeedKbContent(row);
  const chunks = chunkText(content, getServerEnv().KB_CHUNK_TARGET_TOKENS, getServerEnv().KB_CHUNK_OVERLAP_TOKENS);
  const replaced = await admin.rpc("admin_replace_kb_chunks", {
    p_source_id: sourceId,
    p_chunks: chunks.map((chunk, index) => ({
      index,
      content: chunk.content,
      tokenCount: chunk.tokenCount,
      status: "approved",
      approvedBy: actorId,
    })),
  });
  if (replaced.error) {
    await admin.schema("private").from("kb_sources").delete().eq("id", sourceId);
    throw new Error(replaced.error.message);
  }

  await admin.schema("private").from("audit_logs").insert({
    actor_id: actorId,
    action: "ingest_feed_kb_source",
    target_type: "kb_source",
    target_id: sourceId,
    metadata: { feedId, chunks: chunks.length },
  });

  return { sourceId, chunkCount: chunks.length };
}