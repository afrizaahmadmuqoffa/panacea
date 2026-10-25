import "server-only";
import type { Session } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublic } from "@/lib/supabase/public";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { asBoolean, asNumber, asRow, asRows, asString, localized as asLocalized } from "@/lib/data/row";
import type {
  Badge,
  Category,
  Claim,
  ClaimAnalysis,
  ClaimStatus,
  CommentStatus,
  Confidence,
  EvidenceRef,
  FeedItem,
  ForumComment,
  ForumThread,
  GameAnswer,
  GameSession,
  GameStatement,
  GameProgressSummary,
  LeaderboardEntry,
  Notification,
  Profile,
  Report,
  ReportStatus,
  UserRole,
  Verdict,
} from "@/lib/types";

type Row = Record<string, unknown>;

function asLocale(value: unknown): Locale {
  return value === "en" ? "en" : "id";
}

function asVerdict(value: unknown): Verdict {
  return value === "supported" ||
    value === "partly_supported" ||
    value === "contradicted" ||
    value === "insufficient_evidence"
    ? value
    : "insufficient_evidence";
}

function asClaimStatus(value: unknown): ClaimStatus {
  return value === "queued" ||
    value === "analyzing" ||
    value === "analyzed" ||
    value === "analysis_failed" ||
    value === "reported" ||
    value === "finalized" ||
    value === "archived"
    ? value
    : "queued";
}

function asReportStatus(value: unknown): ReportStatus | undefined {
  return value === "waiting_assignment" ||
    value === "assigned" ||
    value === "finalized" ||
    value === "needs_admin_review" ||
    value === "closed"
    ? value
    : undefined;
}

function asCommentStatus(value: unknown): CommentStatus {
  return value === "pending_moderation" ||
    value === "visible" ||
    value === "held" ||
    value === "hidden" ||
    value === "removed"
    ? value
    : "pending_moderation";
}

function basename(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

export function mapEvidenceRow(row: Row): EvidenceRef {
  return {
    id: asString(row.id),
    title: asString(row.title),
    publisher: asString(row.publisher),
    year: asNumber(row.year),
    identifier: asString(row.identifier) || undefined,
    url: asString(row.url),
    snippet: asLocalized(row.snippet_id, row.snippet_en),
    sourceType: row.source_type === "kb" ? "kb" : "europe_pmc",
    relevance:
      row.relevance === "high" || row.relevance === "medium" || row.relevance === "low"
        ? row.relevance
        : "medium",
  };
}

function mapEvidenceJson(value: unknown, index: number): EvidenceRef {
  const row = asRow(value);
  const snippet = asRow(row.snippet);
  return {
    id: asString(row.id, `evidence-${index + 1}`),
    title: asString(row.title),
    publisher: asString(row.publisher, asString(row.source)),
    year: asNumber(row.year, new Date().getFullYear()),
    identifier: asString(row.identifier) || undefined,
    url: asString(row.url),
    snippet: snippet.id
      ? asLocalized(snippet.id, snippet.en)
      : asLocalized(row.snippetId ?? row.snippet_id, row.snippetEn ?? row.snippet_en),
    sourceType: row.sourceType === "kb" || row.source_type === "kb" ? "kb" : "europe_pmc",
    relevance:
      row.relevance === "high" || row.relevance === "medium" || row.relevance === "low"
        ? row.relevance
        : "medium",
  };
}

function mapRetrievalMetadata(value: unknown): ClaimAnalysis["retrieval"] {
  const row = asRow(value);
  if (!Object.keys(row).length) return undefined;
  return {
    kbCandidates: asNumber(row.kbCandidates),
    pmcCandidates: asNumber(row.pmcCandidates),
    selectedEvidence: asNumber(row.selectedEvidence),
    searchQuery: asString(row.searchQuery),
    minScore: asNumber(row.minScore),
    maxKbSimilarity: asNumber(row.maxKbSimilarity),
  };
}

function mapAnalysis(row: Row, claimId: string): ClaimAnalysis {
  const evidence = asRows(row.claim_evidence).map(mapEvidenceRow);
  return {
    id: asString(row.id),
    claimId,
    status:
      row.status === "queued" || row.status === "running" || row.status === "succeeded" || row.status === "failed"
        ? row.status
        : "queued",
    verdict: row.verdict ? asVerdict(row.verdict) : undefined,
    confidence:
      row.confidence === "low" || row.confidence === "medium" || row.confidence === "high"
        ? (row.confidence as Confidence)
        : undefined,
    summary: asLocalized(row.summary_id, row.summary_en),
    limitations: asLocalized(row.limitations_id, row.limitations_en),
    evidence,
    usedKb: asBoolean(row.used_kb),
    usedEuropePmc: asBoolean(row.used_europe_pmc),
    retrieval: mapRetrievalMetadata(row.retrieval_metadata),
    modelName: asString(row.model_name),
    promptVersion: asString(row.prompt_version),
    analyzedAt: asString(row.analyzed_at) || undefined,
    errorCode: asString(row.error_code) || undefined,
  };
}

export function mapClaim(row: Row, reports: Report[], reviewerFeedSlug?: string): Claim {
  const analysisRows = asRows(row.claim_analyses).sort((a, b) =>
    String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")),
  );
  const report = reports.find((item) => item.claimId === asString(row.id));
  const category = asRow(row.categories);
  const inputType =
    row.input_type === "url" || row.input_type === "image" ? row.input_type : "text";
  const language = row.language === "id" || row.language === "en" ? row.language : "unknown";
  return {
    id: asString(row.id),
    inputType,
    originalText: asString(row.original_text),
    sourceUrl: asString(row.source_url) || undefined,
    imageName: row.image_path ? basename(asString(row.image_path)) : undefined,
    language,
    categorySlug: asString(category.slug),
    status: asClaimStatus(row.status),
    createdAt: asString(row.created_at),
    reportStatus: report?.status,
    reviewerFeedSlug,
    analysis: analysisRows[0] ? mapAnalysis(analysisRows[0], asString(row.id)) : undefined,
  };
}

function mapReport(row: Row): Report {
  return {
    id: asString(row.id),
    claimId: asString(row.claim_id),
    reason: asString(row.reason),
    status: asReportStatus(row.status) ?? "waiting_assignment",
    createdAt: asString(row.created_at),
    reviewerCount: 0,
  };
}

export function mapFeed(row: Row): FeedItem {
  const category = asRow(row.categories);
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    title: asLocalized(row.title_id, row.title_en),
    publicClaimText: asLocalized(row.public_claim_text_id, row.public_claim_text_en),
    verdict: asVerdict(row.verdict),
    summary: asLocalized(row.summary_id, row.summary_en),
    expertNote: asLocalized(row.expert_note_id, row.expert_note_en),
    limitations: asLocalized(row.limitations_id, row.limitations_en),
    evidence: asRows(row.evidence).map(mapEvidenceJson),
    categorySlug: asString(category.slug),
    methodologyVersion: asString(row.methodology_version),
    publishedAt: asString(row.published_at),
    status: row.status === "hidden" ? "hidden" : "visible",
    reviewerCount: asNumber(row.reviewer_count, 1),
    reviewerName: asString(row.reviewer_name) || undefined,
  };
}

function mapComment(row: Row, reviewerIds?: ReadonlySet<string>, viewerId?: string): ForumComment {
  const feed = asRow(row.verified_feed);
  const createdAt = asString(row.created_at);
  const updatedAt = asString(row.updated_at);
  return {
    id: asString(row.id),
    threadId: asString(row.thread_id),
    parentId: asString(row.parent_id) || undefined,
    authorAlias: asString(row.author_alias),
    authorIsReviewer: reviewerIds?.has(asString(row.author_id)) ?? false,
    isOwn: Boolean(viewerId) && asString(row.author_id) === viewerId,
    isEdited: Boolean(updatedAt) && updatedAt !== createdAt,
    isAi: Boolean(row.ai_reply_to),
    body: asString(row.body),
    status: asCommentStatus(row.status),
    createdAt,
    linkedFeedSlug: asString(feed.slug) || undefined,
    moderationNote:
      row.moderation_note_id || row.moderation_note_en
        ? asLocalized(row.moderation_note_id, row.moderation_note_en)
        : undefined,
  };
}

export function mapThread(row: Row, reviewerIds?: ReadonlySet<string>, viewerId?: string): ForumThread {
  const category = asRow(row.categories);
  return {
    id: asString(row.id),
    title: asString(row.title),
    body: asString(row.body),
    authorAlias: asString(row.author_alias),
    authorIsReviewer: reviewerIds?.has(asString(row.author_id)) ?? false,
    categorySlug: asString(category.slug),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    isLocked: asBoolean(row.is_locked),
    views: asNumber(row.views),
    comments: asRows(row.forum_comments).map((comment) => mapComment(comment, reviewerIds, viewerId)),
  };
}

function mapNotification(row: Row): Notification {
  const type =
    row.type === "analysis" ||
    row.type === "report" ||
    row.type === "expert_result" ||
    row.type === "moderation" ||
    row.type === "badge" ||
    row.type === "suggestion" ||
    row.type === "mention" ||
    row.type === "system"
      ? row.type
      : "system";
  return {
    id: asString(row.id),
    type,
    title: asLocalized(row.title_id, row.title_en),
    body: asLocalized(row.body_id, row.body_en),
    href: asString(row.href) || undefined,
    isRead: asBoolean(row.is_read),
    createdAt: asString(row.created_at),
  };
}

function mapProfile(row: Row, session: Session): Profile {
  return {
    fullName: asString(row.full_name, session.fullName),
    alias: asString(row.alias, session.alias),
    email: session.email,
    xp: asNumber(row.xp),
    streak: asNumber(row.streak),
    showOnLeaderboard: asBoolean(row.show_on_leaderboard, true),
    uiLanguage: asLocale(row.ui_language),
  };
}

export function mapCategory(row: Row): Category {
  return {
    id: asString(row.id),
    slug: asString(row.slug),
    name: asLocalized(row.name_id, row.name_en),
    description: asLocalized(row.description_id, row.description_en),
    isActive: asBoolean(row.is_active),
    usage: 0,
  };
}

export function mapGameSession(row: Row): GameSession {
  const answers: GameAnswer[] = asRows(row.game_answers).map((answer) => ({
    statementId: asString(answer.statement_id),
    answerIsFact: asBoolean(answer.answer_is_fact),
    isCorrect: asBoolean(answer.is_correct),
    xpAwarded: asNumber(answer.xp_awarded),
    isReview: asBoolean(answer.is_review),
  }));
  return {
    id: asString(row.id),
    answers,
    correctCount: asNumber(row.correct_count),
    xpEarned: asNumber(row.xp_earned),
    startedAt: asString(row.started_at),
    finishedAt: asString(row.finished_at, asString(row.started_at)),
  };
}

function mapBadge(row: Row, earnedAt: string | undefined, progress: number): Badge {
  const type = row.type === "streak" ? "streak" : "verification_count";
  const iconKey =
    row.icon_key === "leaf" ||
    row.icon_key === "tree" ||
    row.icon_key === "flame" ||
    row.icon_key === "star" ||
    row.icon_key === "shield"
      ? row.icon_key
      : "sprout";
  return {
    code: asString(row.code),
    name: asLocalized(row.name_id, row.name_en),
    description: asLocalized(row.description_id, row.description_en),
    type,
    threshold: asNumber(row.threshold, 1),
    iconKey,
    earned: Boolean(earnedAt),
    progress,
    earnedAt,
  };
}

// Halaman hasil memakai fungsi ini untuk mencari penjelasan kartu yang sudah pernah
// dimainkan, jadi is_active tidak difilter: soal yang dinonaktifkan tetap perlu
// tampil pada hasil sesi lama.
export async function getGameSessionStatements(sessionId: string): Promise<GameStatement[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_finished_game_statements", {
    p_session_id: sessionId,
  });
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) => ({
    id: asString(row.id),
    statement: asLocalized(row.statement, row.statementEn),
    isFact: asBoolean(row.isFact),
    explanation: asLocalized(row.explanationId, row.explanationEn),
    sourceUrl: asString(row.sourceUrl),
    categorySlug: asString(row.categorySlug),
    isActive: row.isActive === undefined ? true : asBoolean(row.isActive),
    imageUrl: (row.imageUrl as string | null) ?? null,
  }));
}

export async function getGameStatements(): Promise<GameStatement[]> {
  return [];
}

export async function getPublicCategories(): Promise<Category[]> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name_id");
  if (error) throw new Error(error.message);
  return asRows(data).map(mapCategory);
}

export async function getPublicFeed(): Promise<FeedItem[]> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("verified_feed")
    .select("*, categories(slug)")
    .eq("status", "visible")
    .order("published_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return asRows(data).map(mapFeed);
}

export async function getPublicFeedItem(slug: string): Promise<FeedItem | null> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("verified_feed")
    .select("*, categories(slug)")
    .eq("slug", slug)
    .eq("status", "visible")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapFeed(asRow(data)) : null;
}

export async function getPublicFeedSlugs(): Promise<Array<{ slug: string; publishedAt: string }>> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("verified_feed")
    .select("slug, published_at")
    .eq("status", "visible")
    .order("published_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return asRows(data).map((row) => ({
    slug: asString(row.slug),
    publishedAt: asString(row.published_at),
  }));
}

export type MemberSnapshot = {
  userId: string;
  role: UserRole;
  profile: Profile;
  claims: Claim[];
  reports: Report[];
  feed: FeedItem[];
  threads: ForumThread[];
  notifications: Notification[];
  badges: Badge[];
  gameSessions: GameSession[];
  categories: Category[];
  gameProgress: GameProgressSummary;
};

export async function getMemberSnapshot(session: Session): Promise<MemberSnapshot> {
  const supabase = await createSupabaseServerClient();
  const admin = getSupabaseAdmin();
  const [
    profileRes,
    claimsRes,
    reportsRes,
    feedRes,
    threadsRes,
    notificationsRes,
    badgesRes,
    userBadgesRes,
    sessionsRes,
    categoriesRes,
    reviewerRolesRes,
  ] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", session.userId).maybeSingle(),
      supabase
        .from("claims")
        .select("*, categories(slug), claim_analyses(*, claim_evidence(*))")
        .order("created_at", { ascending: false }),
      supabase.from("claim_reports").select("*").eq("reporter_id", session.userId).order("created_at", { ascending: false }),
      supabase
        .from("verified_feed")
        .select("*, categories(slug)")
        .eq("status", "visible")
        .order("published_at", { ascending: false })
        .limit(100),
      supabase
        .from("forum_threads")
        .select("*, categories(slug), forum_comments(*, verified_feed(slug))")
        .order("updated_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("user_id", session.userId).order("created_at", { ascending: false }),
      supabase.from("badges").select("*").eq("is_active", true).order("threshold"),
      supabase.from("user_badges").select("*").eq("user_id", session.userId),
      supabase.from("game_sessions").select("*, game_answers(*)").eq("user_id", session.userId).order("started_at", { ascending: false }),
      supabase.from("categories").select("*").eq("is_active", true).order("name_id"),
      admin.schema("private").from("user_roles").select("user_id").eq("role", "reviewer"),
    ]);

  for (const result of [
    profileRes,
    claimsRes,
    reportsRes,
    feedRes,
    threadsRes,
    notificationsRes,
    badgesRes,
    userBadgesRes,
    sessionsRes,
    categoriesRes,
    reviewerRolesRes,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  const reviewerIds = new Set(asRows(reviewerRolesRes.data).map((row) => asString(row.user_id)));

  const profile = mapProfile(asRow(profileRes.data), session);
  const reports = asRows(reportsRes.data).map(mapReport);
  const claimRows = asRows(claimsRes.data);

  // Slug feed terverifikasi per klaim, supaya "Buka" membuka hasil reviewer, bukan analisis awal AI.
  const feedSlugByClaim = new Map<string, string>();
  const claimIds = claimRows.map((row) => asString(row.id)).filter(Boolean);
  if (claimIds.length > 0) {
    const links = await admin
      .schema("private")
      .from("feed_internal_links")
      .select("claim_id, feed_id")
      .in("claim_id", claimIds);
    const linkRows = asRows(links.data);
    if (linkRows.length > 0) {
      const feedIds = linkRows.map((row) => asString(row.feed_id)).filter(Boolean);
      const feeds = await admin
        .from("verified_feed")
        .select("id, slug, status")
        .in("id", feedIds);
      const slugById = new Map(
        asRows(feeds.data)
          .filter((row) => asString(row.status) === "visible")
          .map((row) => [asString(row.id), asString(row.slug)]),
      );
      for (const link of linkRows) {
        const slug = slugById.get(asString(link.feed_id));
        if (slug) feedSlugByClaim.set(asString(link.claim_id), slug);
      }
    }
  }

  const claims = claimRows.map((row) =>
    mapClaim(row, reports, feedSlugByClaim.get(asString(row.id))),
  );
  const gameSessions = asRows(sessionsRes.data).map(mapGameSession);
  // Badge memakai jumlah soal unik yang pernah dijawab benar, bukan jumlah jawaban.
  const masteredStatements = new Set(
    gameSessions.flatMap((session) =>
      session.answers.filter((answer) => answer.isCorrect).map((answer) => answer.statementId),
    ),
  ).size;
  const userBadges = asRows(userBadgesRes.data);
  const badges = asRows(badgesRes.data).map((row) => {
    const earned = userBadges.find((item) => asString(item.badge_code) === asString(row.code));
    const type = row.type === "streak" ? "streak" : "verification_count";
    const progress = earned
      ? asNumber(row.threshold)
      : type === "streak"
        ? profile.streak
        : masteredStatements;
    return mapBadge(row, earned ? asString(earned.earned_at) : undefined, progress);
  });

  const progressRes = await supabase.rpc("game_progress_summary");
  const progressData = asRow(progressRes.data);
  const gameProgress: GameProgressSummary = {
    sessionsToday: asNumber(progressData.sessionsToday),
    sessionsPerDay: asNumber(progressData.sessionsPerDay, 2),
    questionsPerSession: asNumber(progressData.questionsPerSession, 10),
    newAvailable: asNumber(progressData.newAvailable),
    dueReviews: asNumber(progressData.dueReviews),
    nextReviewAt: progressData.nextReviewAt ? asString(progressData.nextReviewAt) : null,
  };

  const feed = asRows(feedRes.data).map(mapFeed);
  return {
    userId: session.userId,
    role: session.role,
    profile,
    claims,
    reports,
    feed,
    threads: asRows(threadsRes.data).map((row) => mapThread(row, reviewerIds, session.userId)),
    notifications: asRows(notificationsRes.data).map(mapNotification),
    badges,
    gameSessions,
    categories: asRows(categoriesRes.data).map(mapCategory),
    gameProgress,
  };
}

export async function getLeaderboard(period: "weekly" | "global"): Promise<LeaderboardEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("leaderboard_entries", {
    p_period: period,
  });
  if (error) throw new Error(error.message);
  return asRows(data).map((row) => ({
    rank: asNumber(row.rank),
    alias: asString(row.alias),
    xp: asNumber(row.xp),
    streak: asNumber(row.streak),
    isCurrentUser: asBoolean(row.is_current_user),
    inactive: asBoolean(row.inactive),
    trend: "same",
  }));
}
