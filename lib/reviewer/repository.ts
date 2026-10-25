import "server-only";
import { getAdminKbSources } from "@/lib/admin/repository";
import { mapEvidenceRow } from "@/lib/data/repository";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { asNumber, asRow, asRows, asString, localized } from "@/lib/data/row";
import type { KBSource, KBSuggestion, ReviewerTask, Verdict } from "@/lib/types";

type Row = Record<string, unknown>;

function asVerdict(value: unknown): Verdict {
  return value === "supported" || value === "partly_supported" || value === "contradicted"
    ? value
    : "insufficient_evidence";
}

export async function getReviewerTasks(reviewerId: string): Promise<ReviewerTask[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("claim_review_assignments")
    .select("*, expert_reviews(id, verdict), claim_reports!inner(*, claims!inner(*, categories(slug), claim_analyses(*, claim_evidence(*))))")
    .eq("reviewer_id", reviewerId)
    .order("assigned_at", { ascending: false });
  if (error) throw new Error(error.message);

  return asRows(data).map((row) => {
    const report = asRow(row.claim_reports);
    const claim = asRow(report.claims);
    const analyses = asRows(claim.claim_analyses).sort((a, b) =>
      String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")),
    );
    const analysis = analyses[0] ?? {};
    const category = asRow(claim.categories);
    const reviews = asRows(row.expert_reviews);
    const review = reviews[0] ?? {};
    const claimText = asString(claim.original_text);
    const rawStatus = asString(row.status);
    const status: ReviewerTask["status"] =
      rawStatus === "opened" ||
      rawStatus === "submitted_primary" ||
      rawStatus === "submitted_supplemental" ||
      rawStatus === "conflict"
        ? rawStatus
        : "assigned";
    return {
      id: asString(row.id),
      reportId: asString(row.report_id),
      claimTitle: claimText.length > 100 ? `${claimText.slice(0, 97)}...` : claimText,
      claimText,
      categorySlug: asString(category.slug),
      priority: "normal",
      assignedAt: asString(row.assigned_at),
      status,
      reporterReason: asString(report.reason),
      aiVerdict: asVerdict(analysis.verdict),
      aiSummary: localized(analysis.summary_id, analysis.summary_en),
      evidence: asRows(analysis.claim_evidence).map(mapEvidenceRow),
      publicDraft: { id: claimText, en: claimText },
      limitations: localized(analysis.limitations_id, analysis.limitations_en),
      alreadyReviewed: Boolean(review.id),
    };
  });
}

export async function getReviewerSuggestions(reviewerId: string): Promise<KBSuggestion[]> {
  const admin = getSupabaseAdmin();
  const [suggestions, chunks, categories] = await Promise.all([
    admin.schema("private").from("kb_suggestions").select("*").eq("reviewer_id", reviewerId).order("created_at", { ascending: false }),
    admin.schema("private").from("kb_suggestion_chunks").select("*").order("chunk_index"),
    admin.from("categories").select("id, slug"),
  ]);
  if (suggestions.error) throw new Error(suggestions.error.message);
  const slugById = new Map(
    asRows(categories.data).map((row) => [asString(row.id), asString(row.slug)]),
  );
  const chunksById = new Map<string, Row[]>();
  for (const row of asRows(chunks.data)) {
    const id = asString(row.suggestion_id);
    const list = chunksById.get(id) ?? [];
    list.push(row);
    chunksById.set(id, list);
  }
  return asRows(suggestions.data).map((row) => ({
    id: asString(row.id),
    reviewerAlias: "Saya",
    title: asString(row.title),
    note: asString(row.note),
    targetSourceId: asString(row.target_source_id) || undefined,
    categorySlug: slugById.get(asString(row.category_id)) || undefined,
    author: asString(row.author) || undefined,
    year: typeof row.year === "number" ? row.year : undefined,
    sourceUrl: asString(row.source_url) || undefined,
    status:
      row.status === "approved" || row.status === "rejected" || row.status === "needs_changes"
        ? row.status
        : "pending",
    createdAt: asString(row.created_at),
    adminNote: asString(row.admin_note) || undefined,
    chunks: (chunksById.get(asString(row.id)) ?? []).map((chunk, index) => ({
      id: asString(chunk.id),
      sourceId: asString(row.id),
      index,
      content: asString(chunk.content),
      tokenCount: asNumber(chunk.token_count, 1),
      status:
        chunk.status === "approved" || chunk.status === "rejected" || chunk.status === "ingested"
          ? chunk.status
          : "draft",
    })),
  }));
}

export async function getReviewerDashboardStats(reviewerId: string): Promise<{
  totalTasks: number;
  published: number;
  approvedSuggestions: number;
}> {
  const admin = getSupabaseAdmin();
  const [tasks, canonicalReviews, suggestions] = await Promise.all([
    admin.from("claim_review_assignments").select("id", { count: "exact", head: true }).eq("reviewer_id", reviewerId),
    admin.from("expert_reviews").select("id").eq("reviewer_id", reviewerId).eq("is_canonical", true),
    admin.schema("private").from("kb_suggestions").select("id", { count: "exact", head: true }).eq("reviewer_id", reviewerId).eq("status", "approved"),
  ]);
  if (tasks.error) throw new Error(tasks.error.message);
  if (suggestions.error) throw new Error(suggestions.error.message);

  const reviewIds = asRows(canonicalReviews.data).map((row) => asString(row.id)).filter(Boolean);
  let published = 0;
  if (reviewIds.length > 0) {
    const { count, error } = await admin
      .from("verified_feed")
      .select("id", { count: "exact", head: true })
      .in("canonical_review_id", reviewIds);
    if (error) throw new Error(error.message);
    published = count ?? 0;
  }

  return {
    totalTasks: tasks.count ?? 0,
    published,
    approvedSuggestions: suggestions.count ?? 0,
  };
}

export async function getReviewerRecentSuggestions(
  reviewerId: string,
  limit = 5,
): Promise<Array<{ id: string; title: string; status: KBSuggestion["status"]; createdAt: string }>> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .schema("private")
    .from("kb_suggestions")
    .select("id, title, status, created_at")
    .eq("reviewer_id", reviewerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return asRows(data).map((row) => ({
    id: asString(row.id),
    title: asString(row.title),
    status:
      row.status === "approved" || row.status === "rejected" || row.status === "needs_changes"
        ? row.status
        : "pending",
    createdAt: asString(row.created_at),
  }));
}

export async function getReviewerCategorySlugs(reviewerId: string): Promise<string[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("reviewer_categories")
    .select("categories(slug)")
    .eq("reviewer_id", reviewerId);
  if (error) throw new Error(error.message);
  return asRows(data).map((row) => asString(asRow(row.categories).slug)).filter(Boolean);
}

export async function getKbSourceOptions(): Promise<Array<{ id: string; title: string }>> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.schema("private").from("kb_sources").select("id, title").order("title");
  if (error) throw new Error(error.message);
  return asRows(data).map((row) => ({ id: asString(row.id), title: asString(row.title) }));
}

// Reviewer hanya boleh membaca sumber yang sudah ter-ingest: hanya chunk ter-ingest
// yang dipakai pipeline verifikasi, jadi sumber lain tidak relevan sebagai rujukan.
export async function getReviewerKbSources(): Promise<KBSource[]> {
  return (await getAdminKbSources()).filter((source) => source.status === "ingested");
}

export async function getReviewerKbSource(sourceId: string): Promise<KBSource | null> {
  const source = (await getAdminKbSources()).find((item) => item.id === sourceId);
  return source && source.status === "ingested" ? source : null;
}
