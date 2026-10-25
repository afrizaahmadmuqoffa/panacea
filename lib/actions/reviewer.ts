"use server";

import { revalidatePath } from "next/cache";
import mammoth from "mammoth";
import { extractText } from "unpdf";
import { getSession } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { ingestFeedToKb } from "@/lib/kb/feed";
import { chunkText, estimateTokens } from "@/lib/kb/ingest";
import { enqueueJob } from "@/lib/jobs/queue";
import { runJobs } from "@/lib/jobs/runner";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";
import { expertReviewSchema, kbSuggestionSchema, suggestionChunksSchema } from "@/lib/validators/domain";
import { fail, message } from "@/lib/i18n/message";

type ReviewInput = {
  reportId: string;
  verdict: "supported" | "partly_supported" | "contradicted" | "insufficient_evidence";
  summaryId: string;
  summaryEn: string;
  limitationsId: string;
  limitationsEn: string;
  expertNoteId: string;
  expertNoteEn: string;
  publicTitleId: string;
  publicTitleEn: string;
  evidence: Array<{
    title: string;
    source: string;
    year: number;
    identifier?: string;
    url?: string;
  }>;
  confirmPublish: boolean;
};

async function requireReviewer(locale: Locale) {
  const session = await getSession();
  if (!session) return { session: null, error: message(locale, "Sesi tidak ditemukan.", "Session not found.") };
  if (session.role !== "reviewer" && session.role !== "admin") {
    return { session: null, error: message(locale, "Akses reviewer diperlukan.", "Reviewer access is required.") };
  }
  return { session, error: null };
}

export async function submitReviewAction(locale: Locale, input: ReviewInput) {
  const auth = await requireReviewer(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };

  const parsed = expertReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: message(
        locale,
        "Periksa putusan, ringkasan, batasan, dan bukti. Semua wajib diisi.",
        "Check the verdict, summaries, limitations, and evidence. All are required.",
      ),
    };
  }

  const supabase = await createSupabaseServerClient();
  const result = await supabase.rpc("submit_expert_review", {
    p_report_id: parsed.data.reportId,
    p_verdict: parsed.data.verdict,
    p_summary_id: parsed.data.summaryId,
    p_summary_en: parsed.data.summaryEn,
    p_limitations_id: parsed.data.limitationsId,
    p_limitations_en: parsed.data.limitationsEn,
    p_expert_note_id: parsed.data.expertNoteId,
    p_expert_note_en: parsed.data.expertNoteEn,
    p_evidence: parsed.data.evidence,
    p_public_title_id: parsed.data.publicTitleId,
    p_public_title_en: parsed.data.publicTitleEn,
    p_confirm: true,
  });

  if (result.error) return { error: fail(locale, "reviewer", result.error) };
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  const feedId = (row?.feed_id as string | null | undefined) ?? null;
  const canonical = Boolean(row?.canonical);

  // Feed yang sudah jadi rujukan utama langsung diserap ke knowledge base supaya
  // analisis klaim berikutnya bisa memakainya sebagai bukti. Kegagalan ingest
  // tidak boleh membatalkan publikasi yang sudah tersimpan, jadi cukup dicatat.
  if (feedId && canonical) {
    const actorId = auth.session.userId;
    try {
      const ingested = await ingestFeedToKb(feedId, actorId);
      if (ingested) {
        const jobId = await enqueueJob("embed_kb", { sourceId: ingested.sourceId });
        await runJobs(1, jobId);
      }
    } catch (error) {
      console.error("ingestFeedToKb failed", error);
    }
  }

  revalidatePath(`/${locale}/reviewer/tugas`);
  revalidatePath(`/${locale}/reviewer/tugas/${parsed.data.reportId}`);
  revalidatePath(`/${locale}/feed-terverifikasi`);
  revalidatePath(`/${locale}/admin/feed`);
  revalidatePath(`/${locale}/admin/knowledge-base`);
  return {
    feedId,
    canonical,
    conflict: Boolean(row?.conflict),
    kb: Boolean(feedId && canonical),
  };
}

export async function updateSuggestionChunksAction(
  locale: Locale,
  suggestionId: string,
  chunks: Array<{ content: string; tokenCount?: number }>,
) {
  const auth = await requireReviewer(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };
  const parsed = suggestionChunksSchema.array().safeParse(chunks);
  if (!parsed.success || parsed.data.length === 0) {
    return { error: message(locale, "Setiap chunk minimal 20 karakter.", "Each chunk must be at least 20 characters.") };
  }
  const admin = getSupabaseAdmin();
  const suggestion = await admin
    .schema("private")
    .from("kb_suggestions")
    .select("id, reviewer_id, status")
    .eq("id", suggestionId)
    .maybeSingle();
  if (!suggestion.data || suggestion.data.reviewer_id !== auth.session.userId) {
    return { error: message(locale, "Saran tidak ditemukan.", "Suggestion not found.") };
  }
  if (suggestion.data.status === "approved" || suggestion.data.status === "rejected") {
    return { error: message(locale, "Saran ini sudah ditinjau admin.", "This suggestion has already been reviewed.") };
  }
  // RPC dipakai supaya chunk lama dan baru tidak pernah hidup bersamaan.
  const replaced = await admin.rpc("replace_kb_suggestion_chunks", {
    p_suggestion_id: suggestionId,
    p_chunks: parsed.data.map((chunk, index) => ({
      index,
      content: chunk.content.trim(),
      tokenCount: estimateTokens(chunk.content),
    })),
  });
  if (replaced.error) return { error: fail(locale, "updateSuggestionChunks", replaced.error) };
  revalidatePath(`/${locale}/reviewer/knowledge-base/saran/${suggestionId}/chunks`);
  return { ok: true };
}

export async function createSuggestionAction(locale: Locale, formData: FormData) {
  const auth = await requireReviewer(locale);
  if (!auth.session) return { error: auth.error ?? "Unauthorized" };

  const env = getServerEnv();
  let content = String(formData.get("content") ?? "").trim();
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > env.UPLOAD_MAX_KB_DOCUMENT_BYTES) {
      return { error: message(locale, "Dokumen terlalu besar.", "The document is too large.") };
    }
    const name = file.name.toLowerCase();
    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      if (name.endsWith(".pdf") || file.type === "application/pdf") {
        content = (await extractText(bytes, { mergePages: true })).text;
      } else if (name.endsWith(".docx")) {
        content = (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value;
      } else if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
        content = new TextDecoder().decode(bytes);
      } else {
        return { error: message(locale, "Format harus PDF, DOCX, TXT, atau MD.", "The format must be PDF, DOCX, TXT, or MD.") };
      }
    } catch {
      return { error: message(locale, "Dokumen tidak dapat diekstrak.", "The document could not be extracted.") };
    }
  }

  const parsed = kbSuggestionSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    note: String(formData.get("note") ?? ""),
    author: String(formData.get("author") ?? ""),
    year: String(formData.get("year") ?? ""),
    categorySlug: String(formData.get("categorySlug") ?? ""),
    sourceUrl: String(formData.get("sourceUrl") ?? "") || undefined,
    targetSourceId: String(formData.get("targetSourceId") ?? "") || undefined,
    content,
  });
  if (!parsed.success) {
    return {
      error: message(
        locale,
        "Periksa judul, catatan, kategori, penulis, tahun, dan isi bukti minimal 100 karakter.",
        "Check the title, note, category, author, year, and evidence content of at least 100 characters.",
      ),
    };
  }

  const admin = getSupabaseAdmin();
  const category = await admin.from("categories").select("id").eq("slug", parsed.data.categorySlug).maybeSingle();
  if (!category.data) {
    return { error: message(locale, "Kategori tidak ditemukan.", "The category was not found.") };
  }
  if (parsed.data.targetSourceId) {
    const target = await admin
      .schema("private")
      .from("kb_sources")
      .select("id")
      .eq("id", parsed.data.targetSourceId)
      .maybeSingle();
    if (!target.data) {
      return { error: message(locale, "Sumber KB tujuan tidak ditemukan.", "The target KB source was not found.") };
    }
  }
  const suggestion = await admin
    .schema("private")
    .from("kb_suggestions")
    .insert({
      reviewer_id: auth.session.userId,
      title: parsed.data.title,
      note: parsed.data.note,
      target_source_id: parsed.data.targetSourceId ?? null,
      category_id: category.data.id,
      author: parsed.data.author,
      year: parsed.data.year,
      source_url: parsed.data.sourceUrl ?? null,
      status: "pending",
    })
    .select("id")
    .single();
  if (suggestion.error || !suggestion.data) {
    return { error: fail(locale, "createSuggestion", suggestion.error) };
  }

  const chunks = chunkText(parsed.data.content, env.KB_CHUNK_TARGET_TOKENS, env.KB_CHUNK_OVERLAP_TOKENS);
  const inserted = await admin.rpc("replace_kb_suggestion_chunks", {
    p_suggestion_id: suggestion.data.id,
    p_chunks: chunks.map((chunk, index) => ({
      index,
      content: chunk.content,
      tokenCount: chunk.tokenCount,
    })),
  });
  if (inserted.error) {
    await admin.schema("private").from("kb_suggestions").delete().eq("id", suggestion.data.id);
    return { error: fail(locale, "createSuggestion", inserted.error) };
  }

  revalidatePath(`/${locale}/reviewer/knowledge-base/saran`);
  revalidatePath(`/${locale}/admin/saran-kb`);
  return { suggestionId: suggestion.data.id as string, chunkCount: chunks.length };
}
