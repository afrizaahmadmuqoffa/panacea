import "server-only";
import { moderationSchema } from "@/lib/ai/schemas";
import { generateJson } from "@/lib/ai/provider";
import { moderationPrompt, moderationSystem } from "@/lib/ai/prompts";
import { redactPii } from "@/lib/ai/redact";
import { requireGeminiGenerationEnv } from "@/lib/env";
import { clarifyComment } from "@/lib/forum/clarify";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getRuntimeSettings } from "@/lib/settings/runtime";

const BLOCKED_PATTERN = /\b(bodoh|idiot|anjing|bangsat|goblok|stupid|moron)\b/i;

export async function moderateCommentJob(payload: Record<string, unknown>) {
  const admin = getSupabaseAdmin();
  const commentId = String(payload.commentId ?? "");
  if (!commentId) throw new Error("Comment id missing.");

  const result = await admin
    .from("forum_comments")
    .select("id, body, author_id, thread_id, status, linked_feed_id, ai_reply_to")
    .eq("id", commentId)
    .maybeSingle();
  if (result.error || !result.data) throw new Error(result.error?.message ?? "Comment not found.");
  const comment = result.data;
  if (comment.status !== "pending_moderation") return;

  let decision: "visible" | "held" | "removed" = "held";
  let reasonId =
    "Moderasi otomatis tidak dapat menyelesaikan penilaian. Komentar ditahan untuk ditinjau admin.";
  let reasonEn =
    "Automated moderation could not complete the review. The comment is held for an admin.";

  const settings = await getRuntimeSettings();

  if (BLOCKED_PATTERN.test(comment.body)) {
    decision = "held";
    reasonId = "Komentar ditahan karena terindikasi serangan personal.";
    reasonEn = "The comment was held because it appears to contain a personal attack.";
  } else {
    try {
      const gemini = requireGeminiGenerationEnv();
      const output = await generateJson(moderationSchema, {
        provider: "gemini",
        model: gemini.moderationModel,
        system: moderationSystem,
        contents: moderationPrompt(redactPii(comment.body)),
      });
      decision = output.decision;
      reasonId = output.reasonId || reasonId;
      reasonEn = output.reasonEn || reasonEn;
    } catch {
      if (settings.forumModerationFailClosed) {
        decision = "held";
      } else {
        // Gagal moderasi tidak selalu berarti Held. Dengan fail-closed dimatikan,
        // komentar ditunggu di antrean admin, bukan ditahan otomatis.
        await admin
          .from("forum_comments")
          .update({
            status: "pending_moderation",
            moderation_note_id: reasonId,
            moderation_note_en: reasonEn,
          })
          .eq("id", commentId);
        return;
      }
    }
  }

  await admin
    .from("forum_comments")
    .update({
      status: decision,
      moderation_note_id: decision === "visible" ? null : reasonId,
      moderation_note_en: decision === "visible" ? null : reasonEn,
    })
    .eq("id", commentId);

  await admin.schema("private").from("moderation_logs").insert({
    comment_id: commentId,
    actor_id: null,
    action: decision,
    reason: reasonId,
  });

  if (decision === "visible") {
    await clarifyComment(commentId);
    return;
  }

  await admin.from("notifications").insert({
    user_id: comment.author_id,
    type: "moderation",
    title_id: decision === "removed" ? "Komentar dihapus" : "Komentar ditahan",
    title_en: decision === "removed" ? "Comment removed" : "Comment held",
    body_id: reasonId,
    body_en: reasonEn,
    href: `/forum/${comment.thread_id}`,
  });
}
