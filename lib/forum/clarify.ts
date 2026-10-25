import "server-only";
import { clarificationSchema } from "@/lib/ai/schemas";
import { clarificationPrompt, clarificationSystem } from "@/lib/ai/prompts";
import { generateJson } from "@/lib/ai/provider";
import { redactPii } from "@/lib/ai/redact";
import { requireAiTextEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type AiBot = { id: string; alias: string };

let cachedBot: AiBot | undefined;

async function getAiBot(): Promise<AiBot | null> {
  if (cachedBot !== undefined) return cachedBot;
  const admin = getSupabaseAdmin();
  const result = await admin.from("profiles").select("id, alias").eq("is_bot", true).limit(1).maybeSingle();
  // Hasil kosong tidak dicache supaya bot tetap dicari lagi di pemanggilan berikutnya.
  if (!result.data) return null;
  cachedBot = { id: String(result.data.id), alias: String(result.data.alias) };
  return cachedBot;
}

// shortcut: only the 20 newest feeds are offered as candidates. Move to embedding search when the feed grows.
async function loadCandidates() {
  const admin = getSupabaseAdmin();
  const result = await admin
    .from("verified_feed")
    .select(
      "id, slug, title_id, title_en, public_claim_text_id, public_claim_text_en, summary_id, summary_en, limitations_id, limitations_en",
    )
    .eq("status", "visible")
    .order("published_at", { ascending: false })
    .limit(20);
  return result.data ?? [];
}

/**
 * Best-effort AI reply. It never throws: a failure must not block moderation or posting.
 */
export async function clarifyComment(commentId: string): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    const bot = await getAiBot();
    if (!bot) return;

    const commentResult = await admin
      .from("forum_comments")
      .select("id, body, thread_id, parent_id, author_id, status, ai_reply_to")
      .eq("id", commentId)
      .maybeSingle();
    const comment = commentResult.data;
    if (!comment || comment.status !== "visible" || comment.ai_reply_to || comment.author_id === bot.id) return;

    const existing = await admin.from("forum_comments").select("id").eq("ai_reply_to", commentId).limit(1).maybeSingle();
    if (existing.data) return;

    const candidates = await loadCandidates();
    if (candidates.length === 0) return;

    const ai = requireAiTextEnv();
    const output = await generateJson(clarificationSchema, {
      model: ai.moderationModel,
      system: clarificationSystem,
      contents: clarificationPrompt(
        redactPii(String(comment.body)),
        candidates.map((row) => ({
          slug: String(row.slug),
          titleId: String(row.title_id),
          titleEn: String(row.title_en),
          claimId: String(row.public_claim_text_id),
          claimEn: String(row.public_claim_text_en),
          summaryId: String(row.summary_id),
          summaryEn: String(row.summary_en),
          limitationsId: String(row.limitations_id),
          limitationsEn: String(row.limitations_en),
        })),
      ),
    });

    const feed = candidates.find((row) => row.slug === output.linkedFeedSlug);
    if (!feed) return;
    const note = (output.language === "en" ? output.noteEn : output.noteId).trim();
    if (!note) return;

    await admin.from("forum_comments").insert({
      thread_id: comment.thread_id,
      parent_id: comment.parent_id ?? comment.id,
      author_id: bot.id,
      author_alias: bot.alias,
      body: note,
      status: "visible",
      linked_feed_id: feed.id,
      ai_reply_to: comment.id,
    });

    await admin.from("notifications").insert({
      user_id: comment.author_id,
      type: "system",
      title_id: "Klarifikasi AI tersedia",
      title_en: "AI clarification available",
      body_id: "Asisten AI membalas komentarmu dengan klarifikasi terverifikasi.",
      body_en: "The AI assistant replied to your comment with a verified clarification.",
      href: `/forum/${comment.thread_id}`,
    });
  } catch {
    return;
  }
}

/**
 * Hard-deletes the AI reply attached to a comment. The reply is generated content, not user data.
 */
export async function removeAiReply(commentId: string): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    await admin.from("forum_comments").delete().eq("ai_reply_to", commentId);
  } catch {
    return;
  }
}
