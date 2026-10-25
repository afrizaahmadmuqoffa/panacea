"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { extractArticle } from "@/lib/external/article";
import { getServerEnv } from "@/lib/env";
import { enqueueJob } from "@/lib/jobs/queue";
import { runJobs } from "@/lib/jobs/runner";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { removeAiReply } from "@/lib/forum/clarify";
import { validateImage, readPdf } from "@/lib/security/upload";
import { fail, message } from "@/lib/i18n/message";
import { getRuntimeSettings } from "@/lib/settings/runtime";
import type { Locale } from "@/lib/i18n/config";
import type { CommentStatus } from "@/lib/types";
import {
  claimInputSchema,
  commentSchema,
  profileSchema,
  reportSchema,
  threadSchema,
  updateCommentSchema,
} from "@/lib/validators/domain";

async function requireUser(locale: Locale) {
  const session = await getSession();
  if (!session) return { session: null, error: message(locale, "Sesi tidak ditemukan.", "Session not found.") };
  return { session, error: null };
}

async function readModerationResult(
  commentId: string,
  locale: Locale,
): Promise<{ status?: CommentStatus; moderationNote?: string }> {
  const admin = getSupabaseAdmin();
  const result = await admin
    .from("forum_comments")
    .select("status, moderation_note_id, moderation_note_en")
    .eq("id", commentId)
    .maybeSingle();
  if (result.error || !result.data) return {};
  const status = result.data.status as CommentStatus;
  const note =
    locale === "id"
      ? (result.data.moderation_note_id as string | null)
      : (result.data.moderation_note_en as string | null);
  return { status, moderationNote: note || undefined };
}

export async function analyzeClaimAction(
  locale: Locale,
  formData: FormData,
): Promise<{ error?: string; claimId?: string }> {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const session = auth.session;

  const parsed = claimInputSchema.safeParse({
    inputType: formData.get("inputType"),
    text: formData.get("text") ?? "",
    url: formData.get("url") ?? "",
    language: formData.get("language") ?? "auto",
    categorySlug: formData.get("categorySlug") ?? "",
    idempotencyKey: formData.get("idempotencyKey") ?? "",
  });
  if (!parsed.success) {
    return {
      error: message(
        locale,
        "Periksa lagi isi klaim. Teks minimal 20 karakter.",
        "Check the claim. Text must be at least 20 characters.",
      ),
    };
  }

  const input = parsed.data;
  if (input.inputType === "text" && input.text.length < 20) {
    return { error: message(locale, "Teks klaim minimal 20 karakter.", "Claim text must be at least 20 characters.") };
  }
  if (input.inputType === "url" && !input.url) {
    return { error: message(locale, "Masukkan URL sumber.", "Enter a source URL.") };
  }

  const settings = await getRuntimeSettings();
  if (!settings.claimAnalysisEnabled) {
    return {
      error: message(
        locale,
        "Analisis klaim sedang dinonaktifkan admin. Coba lagi nanti.",
        "Claim analysis is currently disabled by an admin. Try again later.",
      ),
    };
  }
  if (input.inputType === "text" && input.text.length > settings.maxClaimTextLength) {
    return {
      error: message(
        locale,
        `Teks klaim maksimal ${settings.maxClaimTextLength} karakter.`,
        `The claim text must be at most ${settings.maxClaimTextLength} characters.`,
      ),
    };
  }

  const supabase = await createSupabaseServerClient();
  const existing = await supabase
    .from("claims")
    .select("id")
    .eq("user_id", session.userId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existing.data?.id) return { claimId: existing.data.id };

  const env = getServerEnv();
  const allowed = await supabase.rpc("claim_rate_limit", {
    p_limit: env.CLAIM_RATE_LIMIT_PER_HOUR,
    p_window_seconds: env.RATE_LIMIT_WINDOW_SECONDS,
  });
  if (allowed.error) return { error: fail(locale, "member", allowed.error) };
  if (!allowed.data) {
    return {
      error: message(
        locale,
        "Batas klaim per jam tercapai. Coba lagi nanti.",
        "Hourly claim limit reached. Try again later.",
      ),
    };
  }

  let originalText = input.text;
  let sourceUrl: string | null = input.url ?? null;
  let imagePath: string | null = null;

  if (input.inputType === "url") {
    try {
      const article = await extractArticle(input.url!);
      originalText = article.text;
      sourceUrl = article.url;
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : message(locale, "Artikel tidak dapat dibaca.", "The article could not be read."),
      };
    }
  }

  if (input.inputType === "image") {
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return { error: message(locale, "Pilih gambar klaim.", "Choose a claim image.") };
    }
    try {
      const image = await validateImage(file);
      imagePath = `${session.userId}/${crypto.randomUUID()}.${image.extension}`;
      const upload = await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET_CLAIM_IMAGES).upload(
        imagePath,
        image.buffer,
        { contentType: image.mime, upsert: false },
      );
      if (upload.error) throw new Error("Gagal mengunggah gambar klaim.");
      originalText = "Klaim dari gambar. Teks akan diekstrak otomatis.";
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : message(locale, "Gambar gagal diunggah.", "The image could not be uploaded."),
      };
    }
  }

  if (!originalText.trim()) {
    return { error: message(locale, "Isi klaim tidak boleh kosong.", "The claim cannot be empty.") };
  }

  let categoryId: string | null = null;
  if (input.categorySlug) {
    const category = await supabase
      .from("categories")
      .select("id")
      .eq("slug", input.categorySlug)
      .maybeSingle();
    categoryId = category.data?.id ?? null;
  }

  const claim = await supabase
    .from("claims")
    .insert({
      user_id: session.userId,
      input_type: input.inputType,
      original_text: originalText,
      source_url: sourceUrl,
      image_path: imagePath,
      language: input.language === "auto" ? "unknown" : input.language,
      category_id: categoryId,
      status: "queued",
      idempotency_key: input.idempotencyKey,
    })
    .select("id")
    .single();

  if (claim.error || !claim.data) {
    return { error: claim.error?.message ?? message(locale, "Klaim gagal disimpan.", "The claim could not be saved.") };
  }

  const admin = getSupabaseAdmin();
  const analysis = await admin
    .from("claim_analyses")
    .insert({ claim_id: claim.data.id, status: "queued" })
    .select("id")
    .single();
  if (analysis.error || !analysis.data) {
    return { error: fail(locale, "member", analysis.error) };
  }

  const jobId = await enqueueJob("analyze_claim", {
    claimId: claim.data.id,
    analysisId: analysis.data.id,
  });
  await runJobs(1, jobId);

  revalidatePath(`/${locale}/riwayat-klaim`);
  return { claimId: claim.data.id };
}

export async function retryClaimAction(
  locale: Locale,
  claimId: string,
): Promise<{ error?: string; ok?: boolean }> {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };

  const supabase = await createSupabaseServerClient();
  const claim = await supabase
    .from("claims")
    .select("id, status")
    .eq("id", claimId)
    .eq("user_id", auth.session.userId)
    .maybeSingle();
  if (!claim.data) return { error: message(locale, "Klaim tidak ditemukan.", "Claim not found.") };
  if (claim.data.status !== "analysis_failed") {
    return { error: message(locale, "Klaim ini tidak sedang gagal.", "This claim is not in a failed state.") };
  }

  const admin = getSupabaseAdmin();
  await admin
    .schema("private")
    .from("ai_jobs")
    .update({ status: "failed", last_error: "superseded_by_retry", locked_at: null, locked_by: null })
    .eq("type", "analyze_claim")
    .eq("status", "queued")
    .eq("payload->>claimId", claimId);

  // Analisis lama yang gagal dibuang supaya bukti dan riwayatnya tidak menumpuk.
  await admin
    .from("claim_analyses")
    .delete()
    .eq("claim_id", claimId)
    .eq("status", "failed");

  const analysis = await admin
    .from("claim_analyses")
    .insert({ claim_id: claimId, status: "queued" })
    .select("id")
    .single();
  if (analysis.error || !analysis.data) return { error: fail(locale, "member", analysis.error) };

  await admin.from("claims").update({ status: "queued" }).eq("id", claimId);
  const jobId = await enqueueJob("analyze_claim", { claimId, analysisId: analysis.data.id });
  await runJobs(1, jobId);
  revalidatePath(`/${locale}/cek-klaim/${claimId}`);
  return { ok: true };
}

export async function reportClaimAction(
  locale: Locale,
  formData: FormData,
): Promise<{ error?: string; reportId?: string; reviewerCount?: number }> {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const session = auth.session;

  const rawUrls = String(formData.get("referenceUrls") ?? "[]");
  let referenceUrls: string[] = [];
  try {
    const parsed = JSON.parse(rawUrls);
    if (Array.isArray(parsed)) {
      referenceUrls = parsed.filter((value): value is string => typeof value === "string" && value.length > 0);
    }
  } catch {
    referenceUrls = [];
  }

  const parsed = reportSchema.safeParse({
    claimId: formData.get("claimId"),
    reason: formData.get("reason"),
    referenceUrls,
    publicationAck: formData.get("publicationAck"),
  });
  if (!parsed.success) {
    return {
      error: message(
        locale,
        "Alasan laporan minimal 30 karakter dan centang persetujuan publikasi.",
        "The report reason must be at least 30 characters and the publication consent must be checked.",
      ),
    };
  }

  const supabase = await createSupabaseServerClient();
  const claim = await supabase
    .from("claims")
    .select("id, status")
    .eq("id", parsed.data.claimId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!claim.data) {
    return { error: message(locale, "Klaim tidak ditemukan.", "Claim not found.") };
  }
  if (claim.data.status === "queued" || claim.data.status === "analyzing") {
    return { error: message(locale, "Tunggu analisis awal selesai.", "Wait for the initial analysis to finish.") };
  }

  const existing = await supabase
    .from("claim_reports")
    .select("id, status")
    .eq("claim_id", parsed.data.claimId)
    .eq("reporter_id", session.userId)
    .not("status", "eq", "closed")
    .limit(1)
    .maybeSingle();
  if (existing.data?.id) {
    return {
      error: message(locale, "Laporan untuk klaim ini sudah ada.", "A report for this claim already exists."),
      reportId: existing.data.id,
    };
  }

  const allowed = await supabase.rpc("action_rate_limit", {
    p_scope: "report",
    p_limit: 5,
    p_window_seconds: 3600,
  });
  if (allowed.error) return { error: fail(locale, "reportClaim", allowed.error) };
  if (!allowed.data) {
    return {
      error: message(
        locale,
        "Terlalu banyak laporan dalam satu jam. Coba lagi nanti.",
        "Too many reports in the last hour. Try again later.",
      ),
    };
  }

  let attachmentPath: string | null = null;
  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    const env = getServerEnv();
    const invalid = message(
      locale,
      "Lampiran harus PDF, JPG, PNG, atau WEBP maksimal 5 MB.",
      "The attachment must be a PDF, JPG, PNG, or WEBP up to 5 MB.",
    );
    if (file.size > env.UPLOAD_MAX_IMAGE_BYTES) {
      return { error: invalid };
    }
    let body: Uint8Array;
    let contentType: string;
    let extension: string;
    try {
      if (file.type === "application/pdf") {
        body = await readPdf(file);
        contentType = "application/pdf";
        extension = "pdf";
      } else if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        const image = await validateImage(file);
        body = image.buffer;
        contentType = image.mime;
        extension = image.extension;
      } else {
        return { error: invalid };
      }
    } catch {
      return { error: invalid };
    }
    attachmentPath = `${session.userId}/${crypto.randomUUID()}.${extension}`;
    const upload = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET_REPORT_ATTACHMENTS)
      .upload(attachmentPath, body, {
        contentType,
        upsert: false,
      });
    if (upload.error) return { error: fail(locale, "member", upload.error) };
  }

  const report = await supabase
    .from("claim_reports")
    .insert({
      claim_id: parsed.data.claimId,
      reporter_id: session.userId,
      reason: parsed.data.reason,
      reference_urls: parsed.data.referenceUrls,
      attachment_path: attachmentPath,
      publication_ack: true,
      status: "waiting_assignment",
    })
    .select("id")
    .single();
  if (report.error || !report.data) {
    return { error: report.error?.message ?? message(locale, "Laporan gagal disimpan.", "The report could not be saved.") };
  }

  const routed = await supabase.rpc("route_claim_report", { p_report_id: report.data.id });
  const admin = getSupabaseAdmin();
  await admin.from("claims").update({ status: "reported" }).eq("id", parsed.data.claimId);

  revalidatePath(`/${locale}/riwayat-klaim`);
  return { reportId: report.data.id, reviewerCount: Number(routed.data ?? 0) };
}

export async function createThreadAction(
  locale: Locale,
  formData: FormData,
): Promise<{ error?: string; threadId?: string }> {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const session = auth.session;

  const parsed = threadSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    categorySlug: formData.get("categorySlug"),
  });
  if (!parsed.success) {
    return {
      error: message(
        locale,
        "Judul minimal 10 karakter dan isi minimal 40 karakter.",
        "The title must be at least 10 characters and the body at least 40 characters.",
      ),
    };
  }

  const supabase = await createSupabaseServerClient();
  const category = await supabase
    .from("categories")
    .select("id")
    .eq("slug", parsed.data.categorySlug)
    .maybeSingle();
  if (!category.data) {
    return { error: message(locale, "Kategori tidak ditemukan.", "The category was not found.") };
  }

  const allowed = await supabase.rpc("action_rate_limit", {
    p_scope: "thread",
    p_limit: 10,
    p_window_seconds: 3600,
  });
  if (allowed.error) return { error: fail(locale, "createThread", allowed.error) };
  if (!allowed.data) {
    return {
      error: message(
        locale,
        "Terlalu banyak thread dibuat dalam satu jam. Coba lagi nanti.",
        "Too many threads were created in the last hour. Try again later.",
      ),
    };
  }

  const thread = await supabase
    .from("forum_threads")
    .insert({
      author_id: session.userId,
      author_alias: session.alias,
      title: parsed.data.title,
      body: parsed.data.body,
      category_id: category.data?.id ?? null,
    })
    .select("id")
    .single();
  if (thread.error || !thread.data) {
    return { error: thread.error?.message ?? message(locale, "Diskusi gagal dibuat.", "The thread could not be created.") };
  }

  revalidatePath(`/${locale}/forum`);
  return { threadId: thread.data.id };
}

const MENTION_PATTERN = /@([A-Za-z0-9._-]{2,40})/g;

async function notifyMentions(
  threadId: string,
  body: string,
  actorId: string,
  actorAlias: string,
  parentAuthorId?: string,
) {
  const admin = getSupabaseAdmin();
  const recipients = new Set<string>();
  if (parentAuthorId && parentAuthorId !== actorId) recipients.add(parentAuthorId);

  const aliases = new Set<string>();
  for (const match of body.matchAll(MENTION_PATTERN)) {
    if (aliases.size >= 5) break;
    aliases.add(match[1]);
  }
  if (aliases.size > 0) {
    const { data } = await admin.from("profiles").select("id, alias").in("alias", [...aliases]);
    for (const row of (data ?? []) as Array<{ id: string; alias: string }>) {
      if (row.id !== actorId) recipients.add(row.id);
    }
  }
  if (recipients.size === 0) return;

  await admin.from("notifications").insert(
    [...recipients].map((userId) => ({
      user_id: userId,
      type: "mention",
      title_id: "Kamu disebut di diskusi",
      title_en: "You were mentioned in a discussion",
      body_id: `${actorAlias} menyebutmu di sebuah diskusi.`,
      body_en: `${actorAlias} mentioned you in a discussion.`,
      href: `/forum/${threadId}`,
    })),
  );
}

export async function createCommentAction(
  locale: Locale,
  formData: FormData,
): Promise<{
  error?: string;
  commentId?: string;
  status?: CommentStatus;
  moderationNote?: string;
}> {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const session = auth.session;

  const parsed = commentSchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
    linkedFeedSlug: formData.get("linkedFeedSlug") ?? "",
    parentId: formData.get("parentId") ?? "",
  });
  if (!parsed.success) {
    return { error: message(locale, "Komentar minimal 3 karakter.", "The comment must be at least 3 characters.") };
  }

  const supabase = await createSupabaseServerClient();
  const allowed = await supabase.rpc("action_rate_limit", {
    p_scope: "comment",
    p_limit: 30,
    p_window_seconds: 3600,
  });
  if (allowed.error) return { error: fail(locale, "createComment", allowed.error) };
  if (!allowed.data) {
    return {
      error: message(
        locale,
        "Terlalu banyak komentar dalam satu jam. Coba lagi nanti.",
        "Too many comments in the last hour. Try again later.",
      ),
    };
  }

  const feed = parsed.data.linkedFeedSlug
    ? await supabase.from("verified_feed").select("id").eq("slug", parsed.data.linkedFeedSlug).maybeSingle()
    : { data: null };

  let parentAuthorId: string | undefined;
  if (parsed.data.parentId) {
    const parent = await supabase
      .from("forum_comments")
      .select("id, author_id, thread_id, status")
      .eq("id", parsed.data.parentId)
      .maybeSingle();
    if (parent.error || !parent.data || parent.data.thread_id !== parsed.data.threadId || parent.data.status === "removed") {
      return { error: message(locale, "Komentar yang dibalas tidak ditemukan.", "The comment you replied to was not found.") };
    }
    parentAuthorId = parent.data.author_id;
  }

  const comment = await supabase
    .from("forum_comments")
    .insert({
      thread_id: parsed.data.threadId,
      author_id: session.userId,
      author_alias: session.alias,
      body: parsed.data.body,
      status: "pending_moderation",
      linked_feed_id: feed.data?.id ?? null,
      parent_id: parsed.data.parentId ?? null,
    })
    .select("id")
    .single();
  if (comment.error || !comment.data) {
    return { error: comment.error?.message ?? message(locale, "Komentar gagal disimpan.", "The comment could not be saved.") };
  }

  const jobId = await enqueueJob("moderate_comment", { commentId: comment.data.id });
  await runJobs(1, jobId);
  const moderation = await readModerationResult(comment.data.id, locale);
  await notifyMentions(parsed.data.threadId, parsed.data.body, session.userId, session.alias, parentAuthorId);
  revalidatePath(`/${locale}/forum/${parsed.data.threadId}`);
  return { commentId: comment.data.id, ...moderation };
}

export async function updateCommentAction(
  locale: Locale,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean; status?: CommentStatus; moderationNote?: string }> {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };

  const parsed = updateCommentSchema.safeParse({
    commentId: formData.get("commentId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: message(locale, "Komentar minimal 3 karakter.", "The comment must be at least 3 characters.") };
  }

  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("forum_comments")
    .update({
      body: parsed.data.body,
      status: "pending_moderation",
      moderation_note_id: null,
      moderation_note_en: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.commentId)
    .select("thread_id")
    .maybeSingle();
  if (result.error || !result.data) {
    return { error: fail(locale, "updateComment", result.error) };
  }
  await removeAiReply(parsed.data.commentId);

  const jobId = await enqueueJob("moderate_comment", { commentId: parsed.data.commentId });
  await runJobs(1, jobId);
  const moderation = await readModerationResult(parsed.data.commentId, locale);
  revalidatePath(`/${locale}/forum/${result.data.thread_id}`);
  return { ok: true, ...moderation };
}

export async function deleteCommentAction(
  locale: Locale,
  commentId: string,
): Promise<{ error?: string; ok?: boolean }> {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  if (!commentId) return { error: message(locale, "Komentar tidak valid.", "Invalid comment.") };

  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("forum_comments")
    .update({ status: "removed", body: "" })
    .eq("id", commentId)
    .select("thread_id")
    .maybeSingle();
  if (result.error || !result.data) {
    return { error: fail(locale, "deleteComment", result.error) };
  }
  await removeAiReply(commentId);

  revalidatePath(`/${locale}/forum/${result.data.thread_id}`);
  return { ok: true };
}

export async function incrementThreadViewAction(locale: Locale, threadId: string) {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error };
  if (!threadId) return { error: message(locale, "Thread tidak valid.", "Invalid thread.") };
  const supabase = await createSupabaseServerClient();
  const result = await supabase.rpc("increment_thread_views", { p_thread_id: threadId });
  if (result.error) return { error: fail(locale, "member", result.error) };
  return { ok: true, views: typeof result.data === "number" ? result.data : null };
}

export async function markNotificationReadAction(locale: Locale, id: string) {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error };
  const supabase = await createSupabaseServerClient();
  const result = await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", auth.session.userId);
  if (result.error) return { error: fail(locale, "member", result.error) };
  revalidatePath(`/${locale}/notifikasi`);
  return { ok: true };
}

export async function markAllNotificationsReadAction(locale: Locale) {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error };
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", auth.session.userId)
    .eq("is_read", false);
  if (result.error) return { error: fail(locale, "member", result.error) };
  revalidatePath(`/${locale}/notifikasi`);
  return { ok: true };
}

export async function updateProfileAction(
  locale: Locale,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    alias: formData.get("alias"),
    showOnLeaderboard: formData.get("showOnLeaderboard"),
    uiLanguage: formData.get("uiLanguage"),
  });
  if (!parsed.success) {
    return { error: message(locale, "Periksa nama dan alias.", "Check your name and alias.") };
  }

  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      alias: parsed.data.alias,
      show_on_leaderboard: auth.session.role === "user" ? parsed.data.showOnLeaderboard : false,
      ui_language: parsed.data.uiLanguage,
    })
    .eq("id", auth.session.userId);
  if (result.error) return { error: fail(locale, "member", result.error) };
  revalidatePath(`/${locale}/profil`);
  return { ok: true };
}

export async function changePasswordAction(
  locale: Locale,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8) {
    return { error: message(locale, "Password minimal 8 karakter.", "The password must be at least 8 characters.") };
  }
  if (password !== confirm) {
    return { error: message(locale, "Konfirmasi password tidak cocok.", "Password confirmation does not match.") };
  }
  if (currentPassword.length < 8) {
    return { error: message(locale, "Masukkan password saat ini.", "Enter your current password.") };
  }

  const supabase = await createSupabaseServerClient();
  const verified = await supabase.auth.signInWithPassword({
    email: auth.session.email,
    password: currentPassword,
  });
  if (verified.error) {
    return { error: message(locale, "Password saat ini salah.", "The current password is incorrect.") };
  }
  const result = await supabase.auth.updateUser({ password });
  if (result.error) return { error: fail(locale, "member", result.error) };
  return { ok: true };
}

export async function startGameAction(locale: Locale) {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const supabase = await createSupabaseServerClient();
  const result = await supabase.rpc("start_game_session");
  if (result.error) {
    if (result.error.message.includes("Daily game limit reached")) {
      return {
        error: message(
          locale,
          "Kuota harian tercapai. Kamu bisa bermain dua sesi per hari.",
          "Daily limit reached. You can play two sessions per day.",
        ),
      };
    }
    if (result.error.message.includes("No game statements available")) {
      return {
        error: message(
          locale,
          "Belum ada soal yang bisa dimainkan. Coba lagi saat jadwal review berikutnya.",
          "No statements are available to play. Try again at the next review date.",
        ),
      };
    }
    return { error: fail(locale, "member", result.error) };
  }
  return {
    session: result.data as {
      sessionId: string;
      questions: unknown[];
      newCount?: number;
      reviewCount?: number;
    },
  };
}

export async function submitGameAnswerAction(
  locale: Locale,
  sessionId: string,
  statementId: string,
  answerIsFact: boolean,
) {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const supabase = await createSupabaseServerClient();
  const result = await supabase.rpc("submit_game_answer", {
    p_session_id: sessionId,
    p_statement_id: statementId,
    p_answer_is_fact: answerIsFact,
  });
  if (result.error) return { error: fail(locale, "member", result.error) };
  return { result: result.data as Record<string, unknown> };
}

export async function finishGameAction(locale: Locale, sessionId: string) {
  const auth = await requireUser(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const supabase = await createSupabaseServerClient();
  const result = await supabase.rpc("finish_game_session", { p_session_id: sessionId });
  if (result.error) return { error: fail(locale, "member", result.error) };
  revalidatePath(`/${locale}/game`);
  return { result: result.data as Record<string, unknown> };
}
