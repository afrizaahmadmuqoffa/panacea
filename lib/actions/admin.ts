"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import mammoth from "mammoth";
import { extractText } from "unpdf";
import { getSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { chunkText, estimateTokens } from "@/lib/kb/ingest";
import { SETTING_KEYS, type SettingField } from "@/lib/settings/keys";
import { enqueueJob } from "@/lib/jobs/queue";
import { runJobs } from "@/lib/jobs/runner";
import { clarifyComment } from "@/lib/forum/clarify";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { probeServices } from "@/lib/admin/health";
import { fail, message } from "@/lib/i18n/message";
import type { Locale } from "@/lib/i18n/config";
import {
  adminUserSchema,
  badgeSchema,
  categorySchema,
  feedVisibilitySchema,
  gameStatementSchema,
  kbArticleSchema,
  kbChunksSchema,
  moderationSchema,
  reviewerSchema,
  settingsSchema,
  suggestionDecisionSchema,
} from "@/lib/validators/domain";

async function requireAdmin(locale: Locale) {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: message(locale, "Sesi tidak ditemukan. Masuk kembali.", "Session not found. Sign in again."),
      code: "session_missing" as const,
    };
  }
  if (session.role !== "admin") {
    return {
      session: null,
      error: message(locale, "Akses admin diperlukan.", "Admin access is required."),
      code: "forbidden" as const,
    };
  }
  return { session, error: null, code: null };
}

async function audit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const admin = getSupabaseAdmin();
  await admin.schema("private").from("audit_logs").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
    request_id: crypto.randomUUID(),
  });
}

export async function setUserStatusAction(
  locale: Locale,
  userId: string,
  action: "activate" | "deactivate" | "revoke_sessions",
) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const parsed = adminUserSchema.safeParse({ userId, action });
  if (!parsed.success) return { error: message(locale, "Aksi pengguna tidak valid.", "Invalid user action.") };

  const admin = getSupabaseAdmin();
  let revoked = 0;
  if (action === "revoke_sessions") {
    const result = await admin.rpc("admin_revoke_user_sessions", { p_user_id: userId });
    if (result.error) return { error: fail(locale, "admin", result.error) };
    revoked = Number(result.data ?? 0);
  } else {
    const result = await admin.auth.admin.updateUserById(userId, {
      ban_duration: action === "deactivate" ? "876000h" : "none",
    });
    if (result.error) return { error: fail(locale, "admin", result.error) };
  }
  await audit(auth.session.userId, `user_${action}`, "user", userId);
  revalidatePath(`/${locale}/admin/pengguna`);

  if (action === "revoke_sessions" && userId === auth.session.userId) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect(`/${locale}/masuk`);
  }

  return { ok: true, revoked };
}

export async function saveReviewerAction(
  locale: Locale,
  input: {
    reviewerId?: string;
    fullName: string;
    email?: string;
    password?: string;
    categorySlugs: string[];
    isAvailable: boolean;
  },
) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized", code: auth.code };

  const parsed = reviewerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: message(locale, "Periksa nama, email, password, dan kategori reviewer.", "Check the reviewer name, email, password, and categories.") };
  }

  const admin = getSupabaseAdmin();
  let userId = parsed.data.reviewerId;
  if (!userId) {
    if (!parsed.data.email || !parsed.data.password) {
      return { error: message(locale, "Email dan password wajib untuk reviewer baru.", "Email and password are required for a new reviewer.") };
    }
    const created = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.fullName },
    });
    if (created.error || !created.data.user) {
      return { error: fail(locale, "admin", created.error) };
    }
    userId = created.data.user.id;
  } else if (parsed.data.email) {
    const current = await admin.auth.admin.getUserById(userId);
    if (current.error) return { error: fail(locale, "admin", current.error) };
    const currentEmail = (current.data.user?.email ?? "").toLowerCase();
    if (currentEmail !== parsed.data.email.toLowerCase()) {
      const updated = await admin.auth.admin.updateUserById(userId, {
        email: parsed.data.email,
        email_confirm: true,
      });
      if (updated.error) return { error: fail(locale, "admin", updated.error) };
    }
  }

  const alias = parsed.data.fullName.split(/\s+/).slice(0, 2).join(" ");
  const profile = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: parsed.data.fullName,
      alias,
    },
    { onConflict: "id" },
  );
  if (profile.error) return { error: fail(locale, "admin", profile.error) };

  const role = await admin.schema("private").from("user_roles").upsert(
    { user_id: userId, role: "reviewer" },
    { onConflict: "user_id" },
  );
  if (role.error) return { error: fail(locale, "admin", role.error) };

  const reviewer = await admin.from("reviewers").upsert(
    { id: userId, is_available: parsed.data.isAvailable },
    { onConflict: "id" },
  );
  if (reviewer.error) return { error: fail(locale, "admin", reviewer.error) };

  const categories = await admin.from("categories").select("id, slug").in("slug", parsed.data.categorySlugs);
  const categoryIds = (categories.data ?? []).map((row) => row.id);
  await admin.from("reviewer_categories").delete().eq("reviewer_id", userId);
  if (categoryIds.length > 0) {
    const links = await admin.from("reviewer_categories").insert(
      categoryIds.map((categoryId) => ({ reviewer_id: userId, category_id: categoryId })),
    );
    if (links.error) return { error: fail(locale, "admin", links.error) };
  }

  await audit(auth.session.userId, parsed.data.reviewerId ? "update_reviewer" : "create_reviewer", "reviewer", userId, {
    categories: parsed.data.categorySlugs,
  });
  revalidatePath(`/${locale}/admin/reviewer`);
  return { ok: true, reviewerId: userId };
}

export async function saveCategoryAction(
  locale: Locale,
  input: {
    id?: string;
    slug: string;
    nameId: string;
    nameEn: string;
    descriptionId: string;
    descriptionEn: string;
    isActive: boolean;
  },
) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: message(locale, "Periksa nama dan slug kategori.", "Check the category name and slug.") };

  const admin = getSupabaseAdmin();
  const payload = {
    slug: parsed.data.slug,
    name_id: parsed.data.nameId,
    name_en: parsed.data.nameEn,
    description_id: parsed.data.descriptionId,
    description_en: parsed.data.descriptionEn,
    is_active: parsed.data.isActive,
  };
  const result = parsed.data.id
    ? await admin.from("categories").update(payload).eq("id", parsed.data.id)
    : await admin.from("categories").insert(payload);
  if (result.error) return { error: fail(locale, "admin", result.error) };
  await audit(auth.session.userId, parsed.data.id ? "update_category" : "create_category", "category", parsed.data.id ?? null, {
    slug: parsed.data.slug,
  });
  revalidatePath(`/${locale}/admin/kategori`);
  revalidatePath(`/${locale}/feed-terverifikasi`);
  return { ok: true };
}

export async function deleteCategoryAction(locale: Locale, categoryId: string) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const admin = getSupabaseAdmin();
  const [claims, feed, sources, statements] = await Promise.all([
    admin.from("claims").select("id", { count: "exact", head: true }).eq("category_id", categoryId),
    admin.from("verified_feed").select("id", { count: "exact", head: true }).eq("category_id", categoryId),
    admin.schema("private").from("kb_sources").select("id", { count: "exact", head: true }).eq("category_id", categoryId),
    admin.from("game_statements").select("id", { count: "exact", head: true }).eq("category_id", categoryId),
  ]);
  const used = (claims.count ?? 0) + (feed.count ?? 0) + (sources.count ?? 0) + (statements.count ?? 0);
  if (used > 0) {
    return { error: message(locale, "Kategori masih dipakai. Pindahkan datanya dulu.", "The category is still in use. Move its data first.") };
  }
  const result = await admin.from("categories").delete().eq("id", categoryId);
  if (result.error) return { error: fail(locale, "admin", result.error) };
  await audit(auth.session.userId, "delete_category", "category", categoryId);
  revalidatePath(`/${locale}/admin/kategori`);
  return { ok: true };
}

export async function saveKbArticleAction(
  locale: Locale,
  input: {
    sourceId?: string;
    title: string;
    author: string;
    year: number;
    categorySlug: string;
    sourceUrl?: string;
    content: string;
  },
) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const parsed = kbArticleSchema.safeParse(input);
  if (!parsed.success) return { error: message(locale, "Periksa detail artikel dan isi minimal 100 karakter.", "Check the article details and content of at least 100 characters.") };

  const admin = getSupabaseAdmin();
  const category = await admin.from("categories").select("id").eq("slug", parsed.data.categorySlug).maybeSingle();
  const sourcePayload = {
    type: "article" as const,
    title: parsed.data.title,
    author: parsed.data.author,
    year: parsed.data.year,
    category_id: category.data?.id ?? null,
    source_url: parsed.data.sourceUrl ?? null,
    status: "chunked" as const,
  };
  const source = parsed.data.sourceId
    ? await admin.schema("private").from("kb_sources").update(sourcePayload).eq("id", parsed.data.sourceId).select("id").single()
    : await admin.schema("private").from("kb_sources").insert({ ...sourcePayload, created_by: auth.session.userId }).select("id").single();
  if (source.error || !source.data) return { error: fail(locale, "admin", source.error) };

  const sourceId = source.data.id as string;
  const chunks = chunkText(parsed.data.content, getServerEnv().KB_CHUNK_TARGET_TOKENS, getServerEnv().KB_CHUNK_OVERLAP_TOKENS);
  const replaced = await admin.rpc("admin_replace_kb_chunks", {
    p_source_id: sourceId,
    p_chunks: chunks.map((chunk, index) => ({
      index,
      content: chunk.content,
      tokenCount: chunk.tokenCount,
    })),
  });
  if (replaced.error) {
    if (!parsed.data.sourceId) {
      await admin.schema("private").from("kb_sources").delete().eq("id", sourceId);
    }
    console.error("[admin:saveKbArticle] chunk replacement failed", replaced.error);
    return { error: fail(locale, "admin", replaced.error) };
  }

  await audit(auth.session.userId, parsed.data.sourceId ? "update_kb_article" : "create_kb_article", "kb_source", sourceId, {
    chunks: chunks.length,
  });
  revalidatePath(`/${locale}/admin/knowledge-base`);
  revalidatePath(`/${locale}/admin/knowledge-base/${sourceId}/chunks`);
  return { sourceId };
}

export async function uploadKbDocumentAction(locale: Locale, formData: FormData) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const env = getServerEnv();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: message(locale, "Pilih dokumen KB.", "Choose a KB document.") };
  }
  if (file.size > env.UPLOAD_MAX_KB_DOCUMENT_BYTES) {
    return { error: message(locale, "Dokumen terlalu besar.", "The document is too large.") };
  }

  const name = file.name.toLowerCase();
  const original = new Uint8Array(await file.arrayBuffer());
  const extractionCopy = original.slice();
  let content = "";
  let fileType = "";
  try {
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      const result = await extractText(extractionCopy, { mergePages: true });
      content = result.text;
      fileType = "pdf";
    } else if (name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(extractionCopy) });
      content = result.value;
      fileType = "docx";
    } else if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
      content = new TextDecoder().decode(extractionCopy);
      fileType = name.endsWith(".md") ? "md" : "txt";
    } else {
      return { error: message(locale, "Format harus PDF, DOCX, TXT, atau MD.", "The format must be PDF, DOCX, TXT, or MD.") };
    }
  } catch {
    return { error: message(locale, "Dokumen tidak dapat diekstrak.", "The document could not be extracted.") };
  }
  if (content.trim().length < 100) {
    return { error: message(locale, "Teks dokumen terlalu pendek.", "The document text is too short.") };
  }

  const title = String(formData.get("title") ?? "").trim() || file.name.replace(/\.[^.]+$/, "");
  const author = String(formData.get("author") ?? "").trim() || "Dokumen internal";
  const year = Number(formData.get("year") ?? new Date().getFullYear());
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const admin = getSupabaseAdmin();
  const category = categorySlug
    ? await admin.from("categories").select("id").eq("slug", categorySlug).maybeSingle()
    : { data: null };

  const path = `${auth.session.userId}/${crypto.randomUUID()}.${fileType}`;
  const upload = await admin.storage.from(env.SUPABASE_STORAGE_BUCKET_KB_DOCUMENTS).upload(path, original, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upload.error) return { error: fail(locale, "admin", upload.error) };

  const source = await admin
    .schema("private")
    .from("kb_sources")
    .insert({
      type: "document",
      title,
      author,
      year: Number.isFinite(year) ? year : new Date().getFullYear(),
      category_id: category.data?.id ?? null,
      status: "chunked",
      file_path: path,
      file_type: fileType,
      created_by: auth.session.userId,
    })
    .select("id")
    .single();
  if (source.error || !source.data) {
    await admin.storage.from(env.SUPABASE_STORAGE_BUCKET_KB_DOCUMENTS).remove([path]);
    return { error: fail(locale, "admin", source.error) };
  }

  const chunks = chunkText(content, env.KB_CHUNK_TARGET_TOKENS, env.KB_CHUNK_OVERLAP_TOKENS);
  const replaced = await admin.rpc("admin_replace_kb_chunks", {
    p_source_id: source.data.id,
    p_chunks: chunks.map((chunk, index) => ({
      index,
      content: chunk.content,
      tokenCount: chunk.tokenCount,
    })),
  });
  if (replaced.error) {
    await admin.schema("private").from("kb_sources").delete().eq("id", source.data.id);
    await admin.storage.from(env.SUPABASE_STORAGE_BUCKET_KB_DOCUMENTS).remove([path]);
    console.error("[admin:uploadKbDocument] chunk replacement failed", replaced.error);
    return { error: fail(locale, "admin", replaced.error) };
  }

  await audit(auth.session.userId, "upload_kb_document", "kb_source", source.data.id, { chunks: chunks.length, fileType });
  revalidatePath(`/${locale}/admin/knowledge-base`);
  return { sourceId: source.data.id as string, chunkCount: chunks.length };
}

export async function saveKbChunksAction(
  locale: Locale,
  sourceId: string,
  chunks: Array<{ content: string; status: "draft" | "approved" | "rejected" }>,
) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const parsed = kbChunksSchema.array().safeParse(chunks);
  if (!parsed.success) {
    return { error: message(locale, "Setiap chunk minimal 10 karakter dan statusnya valid.", "Each chunk must be at least 10 characters with a valid status.") };
  }
  const admin = getSupabaseAdmin();
  // RPC dipakai supaya delete + insert chunk terjadi dalam satu transaksi.
  const replaced = await admin.rpc("admin_replace_kb_chunks", {
    p_source_id: sourceId,
    p_chunks: parsed.data.map((chunk, index) => ({
      index,
      content: chunk.content.trim(),
      tokenCount: estimateTokens(chunk.content),
      status: chunk.status,
      approvedBy: chunk.status === "approved" ? auth.session.userId : null,
    })),
  });
  if (replaced.error) return { error: fail(locale, "saveKbChunks", replaced.error) };
  await admin.schema("private").from("kb_sources").update({ status: "chunked" }).eq("id", sourceId);
  await audit(auth.session.userId, "save_kb_chunks", "kb_source", sourceId, { chunks: parsed.data.length });
  revalidatePath(`/${locale}/admin/knowledge-base/${sourceId}/chunks`);
  return { ok: true };
}

export async function ingestKbSourceAction(locale: Locale, sourceId: string) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const admin = getSupabaseAdmin();
  const chunks = await admin.schema("private").from("kb_chunks").select("status").eq("source_id", sourceId);
  if (chunks.error) return { error: fail(locale, "admin", chunks.error) };
  const rows = chunks.data ?? [];
  if (rows.some((row) => row.status === "draft")) {
    return { error: message(locale, "Setujui atau tolak semua chunk sebelum ingest.", "Approve or reject every chunk before ingest.") };
  }
  if (!rows.some((row) => row.status === "approved")) {
    return { error: message(locale, "Butuh minimal satu chunk approved.", "At least one approved chunk is required.") };
  }
  const jobId = await enqueueJob("embed_kb", { sourceId });
  let queuedOnly = false;
  // Worker dijalankan inline (bukan di after) supaya job benar-benar dieksekusi:
  // after() pada platform tertentu tidak dijalankan, dan job bisa tertinggal di antrean.
  try {
    await runJobs(1, jobId);
  } catch (error) {
    // Job tetap queued dan akan diambil queue sweeper; jangan sembunyikan kegagalan.
    console.error("ingestKbSourceAction worker failed", error);
    queuedOnly = true;
  }
  await audit(auth.session.userId, "queue_kb_ingest", "kb_source", sourceId, { jobId, queuedOnly });
  revalidatePath(`/${locale}/admin/knowledge-base`);
  return { ok: true, jobId, queuedOnly };
}

export async function reviewSuggestionAction(
  locale: Locale,
  suggestionId: string,
  decision: "approved" | "rejected" | "needs_changes",
  adminNote: string,
) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const decisionParsed = suggestionDecisionSchema.safeParse({ decision, adminNote: adminNote ?? "" });
  if (!decisionParsed.success) {
    return { error: message(locale, "Keputusan atau catatan admin tidak valid.", "The decision or admin note is not valid.") };
  }
  const admin = getSupabaseAdmin();
  const suggestion = await admin
    .schema("private")
    .from("kb_suggestions")
    .select("*, kb_suggestion_chunks(*)")
    .eq("id", suggestionId)
    .maybeSingle();
  if (suggestion.error || !suggestion.data) return { error: "Suggestion not found." };
  if (suggestion.data.status === "approved" || suggestion.data.status === "rejected") {
    return {
      error: message(
        locale,
        "Saran ini sudah pernah diputuskan.",
        "This suggestion has already been decided.",
      ),
    };
  }

  let sourceId: string | null = null;
  if (decision === "approved") {
    const source = await admin
      .schema("private")
      .from("kb_sources")
      .insert({
        type: "article",
        title: suggestion.data.title,
        author: (typeof suggestion.data.author === "string" && suggestion.data.author.trim()) || "Saran reviewer",
        year: typeof suggestion.data.year === "number" ? suggestion.data.year : new Date().getFullYear(),
        category_id: typeof suggestion.data.category_id === "string" ? suggestion.data.category_id : null,
        source_url: typeof suggestion.data.source_url === "string" ? suggestion.data.source_url : null,
        status: "chunked",
        created_by: auth.session.userId,
      })
      .select("id")
      .single();
    if (source.error || !source.data) return { error: fail(locale, "reviewSuggestion", source.error) };
    sourceId = source.data.id as string;
    const chunks = (suggestion.data.kb_suggestion_chunks ?? []) as Array<Record<string, unknown>>;
    if (chunks.length > 0) {
      const inserted = await admin.rpc("admin_replace_kb_chunks", {
        p_source_id: sourceId,
        p_chunks: chunks.map((chunk, index) => ({
          index,
          content: String(chunk.content ?? ""),
          tokenCount: Number(chunk.token_count ?? 1),
          status: "approved",
          approvedBy: auth.session.userId,
        })),
      });
      if (inserted.error) {
        // Chunk gagal: sumber yang baru dibuat dibuang agar tidak ada KB setengah jadi.
        await admin.schema("private").from("kb_sources").delete().eq("id", sourceId);
        return { error: fail(locale, "reviewSuggestion", inserted.error) };
      }
    }
  }

  const update = await admin
    .schema("private")
    .from("kb_suggestions")
    .update({ status: decision, admin_note: adminNote || null })
    .eq("id", suggestionId);
  if (update.error) {
    if (sourceId) await admin.schema("private").from("kb_sources").delete().eq("id", sourceId);
    return { error: fail(locale, "reviewSuggestion", update.error) };
  }

  await admin.from("notifications").insert({
    user_id: suggestion.data.reviewer_id,
    type: "suggestion",
    title_id: "Saran KB ditinjau",
    title_en: "KB suggestion reviewed",
    body_id: adminNote || `Status: ${decision}`,
    body_en: adminNote || `Status: ${decision}`,
    href: "/reviewer/knowledge-base/saran",
  });
  await audit(auth.session.userId, `suggestion_${decision}`, "kb_suggestion", suggestionId, { sourceId });
  revalidatePath(`/${locale}/admin/saran-kb`);
  revalidatePath(`/${locale}/reviewer/knowledge-base/saran`);
  return { ok: true, sourceId };
}

export async function reassignClaimAction(locale: Locale, claimId: string, reviewerId: string) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const admin = getSupabaseAdmin();
  const report = await admin
    .from("claim_reports")
    .select("id")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!report.data) return { error: message(locale, "Klaim ini belum memiliki laporan.", "This claim has no report yet.") };
  const assignment = await admin.from("claim_review_assignments").upsert(
    { report_id: report.data.id, reviewer_id: reviewerId, status: "assigned" },
    { onConflict: "report_id,reviewer_id" },
  );
  if (assignment.error) return { error: fail(locale, "admin", assignment.error) };
  await audit(auth.session.userId, "reassign_claim", "claim", claimId, { reviewerId });
  revalidatePath(`/${locale}/admin/klaim`);
  return { ok: true };
}

export async function moderateCommentAction(
  locale: Locale,
  input: { commentId: string; action: "visible" | "held" | "hidden" | "removed"; reason?: string },
) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const parsed = moderationSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid moderation input." };
  const admin = getSupabaseAdmin();
  const comment = await admin.from("forum_comments").select("author_id, thread_id").eq("id", parsed.data.commentId).maybeSingle();
  const result = await admin
    .from("forum_comments")
    .update({ status: parsed.data.action, moderation_note_id: parsed.data.reason ?? null, moderation_note_en: parsed.data.reason ?? null })
    .eq("id", parsed.data.commentId);
  if (result.error) return { error: fail(locale, "admin", result.error) };
  await admin.schema("private").from("moderation_logs").insert({
    comment_id: parsed.data.commentId,
    actor_id: auth.session.userId,
    action: parsed.data.action,
    reason: parsed.data.reason ?? null,
  });
  if (comment.data && parsed.data.action !== "visible") {
    await admin.from("notifications").insert({
      user_id: comment.data.author_id,
      type: "moderation",
      title_id: "Komentar ditinjau admin",
      title_en: "Comment reviewed by admin",
      body_id: parsed.data.reason || "Komentar disembunyikan dari tampilan publik.",
      body_en: parsed.data.reason || "The comment is hidden from public view.",
      href: `/forum/${comment.data.thread_id}`,
    });
  }
  await audit(auth.session.userId, `moderate_comment_${parsed.data.action}`, "forum_comment", parsed.data.commentId);
  if (parsed.data.action === "visible") {
    await clarifyComment(parsed.data.commentId);
  }
  revalidatePath(`/${locale}/admin/forum-moderasi`);
  return { ok: true };
}

export async function toggleThreadLockAction(locale: Locale, threadId: string, locked: boolean) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const admin = getSupabaseAdmin();
  const result = await admin.from("forum_threads").update({ is_locked: locked }).eq("id", threadId);
  if (result.error) return { error: fail(locale, "admin", result.error) };
  await audit(auth.session.userId, locked ? "lock_thread" : "unlock_thread", "forum_thread", threadId);
  revalidatePath(`/${locale}/admin/forum-moderasi`);
  return { ok: true };
}

export async function saveGameStatementAction(
  locale: Locale,
  input: {
    id?: string;
    statementId: string;
    statementEn: string;
    isFact: boolean;
    explanationId: string;
    explanationEn: string;
    sourceUrl: string;
    categorySlug: string;
    isActive: boolean;
  },
) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const parsed = gameStatementSchema.safeParse(input);
  if (!parsed.success) return { error: message(locale, "Periksa pernyataan, penjelasan, dan sumber.", "Check the statement, explanation, and source.") };
  const admin = getSupabaseAdmin();
  const category = await admin.from("categories").select("id").eq("slug", parsed.data.categorySlug).maybeSingle();
  const payload = {
    statement_id: parsed.data.statementId,
    statement_en: parsed.data.statementEn,
    is_fact: parsed.data.isFact,
    explanation_id: parsed.data.explanationId,
    explanation_en: parsed.data.explanationEn,
    source_url: parsed.data.sourceUrl,
    category_id: category.data?.id ?? null,
    is_active: parsed.data.isActive,
  };
  const result = parsed.data.id
    ? await admin.from("game_statements").update(payload).eq("id", parsed.data.id)
    : await admin.from("game_statements").insert(payload);
  if (result.error) return { error: fail(locale, "admin", result.error) };
  await audit(auth.session.userId, parsed.data.id ? "update_game_statement" : "create_game_statement", "game_statement", parsed.data.id ?? null);
  revalidatePath(`/${locale}/admin/game-soal`);
  return { ok: true };
}

export async function saveBadgeThresholdAction(locale: Locale, input: { code: string; threshold: number }) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const parsed = badgeSchema.safeParse(input);
  if (!parsed.success) return { error: message(locale, "Ambang badge tidak valid.", "The badge threshold is invalid.") };
  const admin = getSupabaseAdmin();
  const result = await admin.from("badges").update({ threshold: parsed.data.threshold }).eq("code", parsed.data.code);
  if (result.error) return { error: fail(locale, "admin", result.error) };
  await audit(auth.session.userId, "update_badge_threshold", "badge", parsed.data.code, { threshold: parsed.data.threshold });
  revalidatePath(`/${locale}/admin/badge`);
  return { ok: true };
}

export async function saveBadgeActiveAction(
  locale: Locale,
  input: { code: string; isActive: boolean },
) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const admin = getSupabaseAdmin();
  const result = await admin
    .from("badges")
    .update({ is_active: input.isActive })
    .eq("code", input.code);
  if (result.error) return { error: fail(locale, "admin", result.error) };
  await audit(auth.session.userId, "update_badge_active", "badge", input.code, {
    isActive: input.isActive,
  });
  revalidatePath(`/${locale}/admin/badge`);
  return { ok: true };
}

export async function updateFeedContentAction(
  locale: Locale,
  input: {
    feedId: string;
    titleId: string;
    titleEn: string;
    summaryId: string;
    summaryEn: string;
    limitationsId: string;
    revisionNote: string;
  },
) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  if (
    input.titleId.trim().length < 5 ||
    input.titleEn.trim().length < 5 ||
    input.summaryId.trim().length < 20 ||
    input.summaryEn.trim().length < 20 ||
    input.revisionNote.trim().length < 5
  ) {
    return { error: message(locale, "Periksa judul, ringkasan, dan catatan revisi.", "Check the title, summary, and revision note.") };
  }
  const admin = getSupabaseAdmin();
  const feed = await admin.from("verified_feed").select("*").eq("id", input.feedId).maybeSingle();
  if (!feed.data) return { error: "Feed not found." };
  const update = await admin
    .from("verified_feed")
    .update({
      title_id: input.titleId.trim(),
      title_en: input.titleEn.trim(),
      summary_id: input.summaryId.trim(),
      summary_en: input.summaryEn.trim(),
      limitations_id: input.limitationsId.trim(),
      revision_note: input.revisionNote.trim(),
    })
    .eq("id", input.feedId);
  if (update.error) return { error: fail(locale, "admin", update.error) };
  await admin.from("feed_revisions").insert({
    feed_id: input.feedId,
    revision_note: input.revisionNote.trim(),
    snapshot: feed.data,
    created_by: auth.session.userId,
  });
  await audit(auth.session.userId, "update_feed_content", "verified_feed", input.feedId);
  revalidatePath(`/${locale}/feed-terverifikasi`);
  revalidatePath(`/${locale}/admin/feed`);
  revalidatePath(`/${locale}/feed-terverifikasi/${feed.data.slug}`);
  return { ok: true };
}

export async function setFeedVisibilityAction(
  locale: Locale,
  input: { feedId: string; status: "visible" | "hidden"; revisionNote: string },
) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const parsed = feedVisibilitySchema.safeParse(input);
  if (!parsed.success) return { error: message(locale, "Catatan revisi minimal 5 karakter.", "The revision note must be at least 5 characters.") };
  const admin = getSupabaseAdmin();
  const feed = await admin.from("verified_feed").select("*").eq("id", parsed.data.feedId).maybeSingle();
  if (!feed.data) return { error: "Feed not found." };
  const update = await admin
    .from("verified_feed")
    .update({ status: parsed.data.status, revision_note: parsed.data.revisionNote })
    .eq("id", parsed.data.feedId);
  if (update.error) return { error: fail(locale, "admin", update.error) };
  await admin.from("feed_revisions").insert({
    feed_id: parsed.data.feedId,
    revision_note: parsed.data.revisionNote,
    snapshot: feed.data,
    created_by: auth.session.userId,
  });
  await audit(auth.session.userId, `feed_${parsed.data.status}`, "verified_feed", parsed.data.feedId);
  revalidatePath(`/${locale}/feed-terverifikasi`);
  revalidatePath(`/${locale}/admin/feed`);
  revalidatePath(`/${locale}/feed-terverifikasi/${feed.data.slug}`);
  return { ok: true };
}

export async function saveSettingsAction(locale: Locale, formData: FormData) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const parsed = settingsSchema.safeParse({
    siteName: formData.get("siteName"),
    defaultDescription: formData.get("defaultDescription"),
    defaultLocale: formData.get("defaultLocale"),
    ragMinScore: formData.get("ragMinScore"),
    ragChunkCount: formData.get("ragChunkCount"),
    kbMinEvidenceCount: formData.get("kbMinEvidenceCount"),
    // Checkbox yang tidak dicentang tidak terkirim sama sekali, jadi nilai
    // "off" tidak boleh dipaksa di sini.
    claimAnalysisEnabled: formData.get("claimAnalysisEnabled"),
    forumModerationFailClosed: formData.get("forumModerationFailClosed"),
    maxClaimTextLength: formData.get("maxClaimTextLength"),
  });
  if (!parsed.success) return { error: message(locale, "Periksa pengaturan.", "Check the settings.") };
  const admin = getSupabaseAdmin();
  const entries = Object.entries(parsed.data);
  for (const [field, value] of entries) {
    const key = SETTING_KEYS[field as SettingField];
    const result = await admin.schema("private").from("system_settings").upsert(
      { key, value: String(value), updated_by: auth.session.userId, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    if (result.error) return { error: fail(locale, "saveSettings", result.error) };
  }
  await audit(auth.session.userId, "update_settings", "system_settings", null, parsed.data);
  revalidatePath(`/${locale}/admin/pengaturan`);
  return { ok: true };
}

export async function checkServiceStatusAction(locale: Locale) {
  const auth = await requireAdmin(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  try {
    return { services: await probeServices() };
  } catch (error) {
    return { error: fail(locale, "serviceStatus", error) };
  }
}
