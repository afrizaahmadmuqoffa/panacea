import "server-only";
import { embedTexts } from "@/lib/ai/provider";
import { getServerEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.33));
}

export function chunkText(
  content: string,
  targetTokens = 600,
  overlapTokens = 80,
): Array<{ content: string; tokenCount: number }> {
  const sentences = content
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const targetWords = Math.max(80, Math.floor(targetTokens * 0.75));
  const overlapWords = Math.max(0, Math.min(Math.floor(overlapTokens * 0.75), Math.floor(targetWords / 2)));

  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  const countWords = (value: string) => value.split(/\s+/).filter(Boolean).length;

  const push = () => {
    if (current.length === 0) return;
    chunks.push(current.join(" "));
    // Overlap dihitung per kata dari kalimat terakhir, bukan per jumlah kalimat.
    const overlap: string[] = [];
    let words = 0;
    for (let index = current.length - 1; index >= 0; index -= 1) {
      const size = countWords(current[index]);
      if (words + size > overlapWords) break;
      overlap.unshift(current[index]);
      words += size;
    }
    // Overlap tidak boleh menyalin seluruh chunk, jika tidak isinya terulang terus.
    while (overlap.length >= current.length) {
      words -= countWords(overlap.shift() ?? "");
    }
    current = overlap;
    currentWords = words;
  };

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(Boolean);
    if (currentWords + words.length > targetWords && current.length > 0) push();
    current.push(sentence);
    currentWords += words.length;
    if (currentWords >= targetWords * 1.5) push();
  }
  if (current.length > 0) chunks.push(current.join(" "));

  return chunks.map((text) => ({ content: text, tokenCount: estimateTokens(text) }));
}

export async function embedKbSourceJob(payload: Record<string, unknown>) {
  const env = getServerEnv();
  const admin = getSupabaseAdmin();
  const sourceId = String(payload.sourceId ?? "");
  if (!sourceId) throw new Error("KB source id missing.");

  const chunks = await admin
    .schema("private")
    .from("kb_chunks")
    .select("id, content")
    .eq("source_id", sourceId)
    // Chunk ter-ingest ikut diambil agar job tetap idempotent saat dijalankan ulang.
    .in("status", ["approved", "ingested"])
    .order("chunk_index");
  if (chunks.error) throw new Error(chunks.error.message);
  if (!chunks.data?.length) throw new Error("Tidak ada chunk approved untuk di-ingest.");

  const vectors = await embedTexts(
    chunks.data.map((chunk) => chunk.content),
    "RETRIEVAL_DOCUMENT",
  );
  if (vectors.some((vector) => vector.length !== env.GEMINI_EMBEDDING_DIMENSION)) {
    throw new Error("Dimensi embedding tidak sesuai.");
  }

  for (let index = 0; index < chunks.data.length; index += 1) {
    const update = await admin.rpc("set_kb_embedding", {
      p_chunk_id: chunks.data[index].id,
      p_embedding: vectors[index],
    });
    if (update.error) throw new Error(update.error.message);
  }

  const source = await admin
    .schema("private")
    .from("kb_sources")
    .update({ status: "ingested" })
    .eq("id", sourceId);
  if (source.error) throw new Error(source.error.message);

  await admin.schema("private").from("audit_logs").insert({
    actor_id: null,
    action: "ingest_kb_source",
    target_type: "kb_source",
    target_id: sourceId,
    metadata: { chunks: chunks.data.length },
  });
}
