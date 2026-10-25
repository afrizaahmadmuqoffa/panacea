import "server-only";
import {
  mapCategory,
  mapClaim,
  mapFeed,
  mapThread,
} from "@/lib/data/repository";
import type { Session } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { probeServices } from "@/lib/admin/health";
import { asBoolean, asNumber, asRow, asRows, asString, localized } from "@/lib/data/row";
import type {
  AdminUser,
  AuditLog,
  Badge,
  Category,
  Claim,
  ClaimStatus,
  CommentStatus,
  FeedItem,
  ForumThread,
  GameStatement,
  KBIngestJob,
  KBSource,
  KBSuggestion,
  Report,
  ReviewerProfile,
  SystemService,
  UserRole,
  Verdict,
} from "@/lib/types";

type Row = Record<string, unknown>;

function asRole(value: unknown): UserRole {
  return value === "reviewer" || value === "admin" ? value : "user";
}

function profileMap(rows: Row[]) {
  return new Map(rows.map((row) => [asString(row.id), row]));
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const admin = getSupabaseAdmin();
  const users = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (users.error) throw new Error(users.error.message);
  const profiles = await admin.from("profiles").select("*");
  const roles = await admin.schema("private").from("user_roles").select("*");
  const profileById = profileMap(asRows(profiles.data));
  const roleById = new Map(asRows(roles.data).map((row) => [asString(row.user_id), asRole(row.role)]));

  return users.data.users
    .filter((user) => profileById.get(user.id)?.is_bot !== true)
    .map((user) => {
    const profile = profileById.get(user.id) ?? {};
    const bannedUntil = user.banned_until ? new Date(user.banned_until) : null;
    const isActive = !bannedUntil || bannedUntil.getTime() <= Date.now();
    return {
      id: user.id,
      fullName: asString(profile.full_name, user.email?.split("@")[0] ?? "User"),
      email: user.email ?? "",
      role: roleById.get(user.id) ?? "user",
      isActive,
      joinedAt: user.created_at,
      lastActiveAt: asString(profile.last_active_at, user.last_sign_in_at ?? user.created_at),
      xp: asNumber(profile.xp),
    };
  });
}

export async function getAdminReviewers(): Promise<ReviewerProfile[]> {
  const admin = getSupabaseAdmin();
  const reviewers = await admin.from("reviewers").select("*");
  if (reviewers.error) throw new Error(reviewers.error.message);
  const ids = asRows(reviewers.data).map((row) => asString(row.id));
  if (ids.length === 0) return [];

  const [profiles, categories, assignments, users] = await Promise.all([
    admin.from("profiles").select("*").in("id", ids),
    admin.from("reviewer_categories").select("reviewer_id, categories(slug)").in("reviewer_id", ids),
    admin.from("claim_review_assignments").select("reviewer_id, status").in("reviewer_id", ids),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  if (users.error) throw new Error(users.error.message);
  const emailById = new Map(asRows(users.data.users).map((user) => [asString(user.id), asString(user.email)]));
  const profileById = profileMap(asRows(profiles.data));
  const activeById = new Map<string, number>();
  const completedById = new Map<string, number>();
  for (const row of asRows(assignments.data)) {
    const id = asString(row.reviewer_id);
    if (row.status === "assigned" || row.status === "opened") {
      activeById.set(id, (activeById.get(id) ?? 0) + 1);
    }
    if (row.status === "submitted") {
      completedById.set(id, (completedById.get(id) ?? 0) + 1);
    }
  }

  const categoryById = new Map<string, string[]>();
  for (const row of asRows(categories.data)) {
    const id = asString(row.reviewer_id);
    const slug = asString(asRow(row.categories).slug);
    if (!slug) continue;
    const current = categoryById.get(id) ?? [];
    current.push(slug);
    categoryById.set(id, current);
  }

  return asRows(reviewers.data).map((row) => {
    const id = asString(row.id);
    const profile = profileById.get(id) ?? {};
    return {
      id,
      fullName: asString(profile.full_name, "Reviewer"),
      email: emailById.get(id) ?? "",
      categorySlugs: categoryById.get(id) ?? [],
      isAvailable: asBoolean(row.is_available, true),
      activeTasks: activeById.get(id) ?? 0,
      completedTasks: completedById.get(id) ?? 0,
      joinedAt: asString(profile.created_at, asString(row.created_at)),
    };
  });
}

export async function getAdminCategories(): Promise<Category[]> {
  const admin = getSupabaseAdmin();
  const [categories, claims, feed, sources, statements] = await Promise.all([
    admin.from("categories").select("*").order("name_id"),
    admin.from("claims").select("category_id"),
    admin.from("verified_feed").select("category_id"),
    admin.schema("private").from("kb_sources").select("category_id"),
    admin.from("game_statements").select("category_id"),
  ]);
  if (categories.error) throw new Error(categories.error.message);
  const usage = new Map<string, number>();
  for (const result of [claims, feed, sources, statements]) {
    for (const row of asRows(result.data)) {
      const id = asString(row.category_id);
      if (id) usage.set(id, (usage.get(id) ?? 0) + 1);
    }
  }
  return asRows(categories.data).map((row) => ({
    ...mapCategory(row),
    usage: usage.get(asString(row.id)) ?? 0,
  }));
}

function mapChunk(row: Row): {
  id: string;
  sourceId: string;
  index: number;
  content: string;
  tokenCount: number;
  status: "draft" | "approved" | "rejected" | "ingested";
} {
  return {
    id: asString(row.id),
    sourceId: asString(row.source_id),
    index: asNumber(row.chunk_index),
    content: asString(row.content),
    tokenCount: asNumber(row.token_count),
    status: row.status === "approved" || row.status === "rejected" || row.status === "ingested"
      ? row.status
      : "draft",
  };
}

export async function getAdminKbSources(): Promise<KBSource[]> {
  const admin = getSupabaseAdmin();
  const [sources, chunks, categories, jobs] = await Promise.all([
    admin.schema("private").from("kb_sources").select("*").order("created_at", { ascending: false }),
    admin.schema("private").from("kb_chunks").select("*").order("chunk_index"),
    admin.from("categories").select("id, slug"),
    admin
      .schema("private")
      .from("ai_jobs")
      .select("id, payload, status, attempts, max_attempts, last_error, run_after, created_at, updated_at")
      .eq("type", "embed_kb")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (sources.error) throw new Error(sources.error.message);
  if (jobs.error) throw new Error(jobs.error.message);
  const categoryById = new Map(asRows(categories.data).map((row) => [asString(row.id), asString(row.slug)]));
  const chunksBySource = new Map<string, ReturnType<typeof mapChunk>[]>();
  for (const row of asRows(chunks.data)) {
    const id = asString(row.source_id);
    const current = chunksBySource.get(id) ?? [];
    current.push(mapChunk(row));
    chunksBySource.set(id, current);
  }
  const latestJobBySource = new Map<string, KBIngestJob>();
  for (const row of asRows(jobs.data)) {
    const job = mapIngestJob(row);
    if (job && !latestJobBySource.has(job.sourceId)) latestJobBySource.set(job.sourceId, job);
  }

  return asRows(sources.data).map((row) => ({
    id: asString(row.id),
    type: row.type === "document" ? "document" : "article",
    title: asString(row.title),
    author: asString(row.author),
    year: asNumber(row.year),
    categorySlug: categoryById.get(asString(row.category_id)) ?? "",
    status: sourceStatus(row.status),
    fileType: asString(row.file_type) || undefined,
    sourceUrl: asString(row.source_url) || undefined,
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    chunks: chunksBySource.get(asString(row.id)) ?? [],
    latestIngestJob: latestJobBySource.get(asString(row.id)),
  }));
}

function mapIngestJob(row: Row): KBIngestJob | null {
  const payload = asRow(row.payload);
  const sourceId = asString(payload.sourceId);
  if (!sourceId) return null;
  return {
    id: asString(row.id),
    sourceId,
    status:
      row.status === "running" || row.status === "succeeded" || row.status === "failed"
        ? row.status
        : "queued",
    attempts: asNumber(row.attempts),
    maxAttempts: asNumber(row.max_attempts, 3),
    lastError: asString(row.last_error) || undefined,
    runAfter: asString(row.run_after),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
  };
}

function sourceStatus(value: unknown): KBSource["status"] {
  return value === "chunked" || value === "ingested" || value === "failed" || value === "archived"
    ? value
    : "draft";
}

export async function getAdminKbSource(sourceId: string): Promise<KBSource | null> {
  const sources = await getAdminKbSources();
  return sources.find((source) => source.id === sourceId) ?? null;
}

export async function getAdminSuggestions(): Promise<KBSuggestion[]> {
  const admin = getSupabaseAdmin();
  const [suggestions, chunks, profiles, categories] = await Promise.all([
    admin.schema("private").from("kb_suggestions").select("*").order("created_at", { ascending: false }),
    admin.schema("private").from("kb_suggestion_chunks").select("*").order("chunk_index"),
    admin.from("profiles").select("id, full_name"),
    admin.from("categories").select("id, slug"),
  ]);
  if (suggestions.error) throw new Error(suggestions.error.message);
  const slugById = new Map(
    asRows(categories.data).map((row) => [asString(row.id), asString(row.slug)]),
  );
  const profileById = profileMap(asRows(profiles.data));
  const chunksBySuggestion = new Map<string, ReturnType<typeof mapChunk>[]>();
  for (const row of asRows(chunks.data)) {
    const id = asString(row.suggestion_id);
    const current = chunksBySuggestion.get(id) ?? [];
    current.push(mapChunk(row));
    chunksBySuggestion.set(id, current);
  }
  const now = Date.now();
  return asRows(suggestions.data).map((row) => {
    const createdAt = asString(row.created_at);
    return {
      id: asString(row.id),
      reviewerAlias: asString(profileById.get(asString(row.reviewer_id))?.full_name, "Reviewer"),
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
      createdAt,
      ageDays: createdAt ? Math.floor((now - new Date(createdAt).getTime()) / 86400000) : 0,
      adminNote: asString(row.admin_note) || undefined,
      chunks: chunksBySuggestion.get(asString(row.id)) ?? [],
    };
  });
}

export async function getAdminThreads(): Promise<ForumThread[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("forum_threads")
    .select("*, categories(slug), forum_comments(*, verified_feed(slug))")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return asRows(data).map((row) => mapThread(row));
}

export async function getAdminClaims(): Promise<Claim[]> {
  const admin = getSupabaseAdmin();
  const [claims, reports] = await Promise.all([
    admin
      .from("claims")
      .select("*, categories(slug), claim_analyses(*, claim_evidence(*))")
      .order("created_at", { ascending: false }),
    admin.from("claim_reports").select("*"),
  ]);
  if (claims.error) throw new Error(claims.error.message);
  const mappedReports: Report[] = asRows(reports.data).map((row) => ({
    id: asString(row.id),
    claimId: asString(row.claim_id),
    reason: asString(row.reason),
    status: "waiting_assignment",
    createdAt: asString(row.created_at),
    reviewerCount: 0,
  }));
  return asRows(claims.data).map((row) => mapClaim(row, mappedReports));
}

export async function getAdminThreadsSafe() {
  return getAdminThreads();
}

export async function getAdminGameStatements(): Promise<GameStatement[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("game_statements")
    .select("*, categories(slug)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return asRows(data).map((row) => ({
    id: asString(row.id),
    statement: localized(row.statement_id, row.statement_en),
    isFact: asBoolean(row.is_fact),
    explanation: localized(row.explanation_id, row.explanation_en),
    sourceUrl: asString(row.source_url),
    categorySlug: asString(asRow(row.categories).slug),
    isActive: asBoolean(row.is_active),
  }));
}

export async function getAdminBadges(): Promise<Badge[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("badges").select("*").order("threshold");
  if (error) throw new Error(error.message);
  return asRows(data).map((row) => ({
    code: asString(row.code),
    name: localized(row.name_id, row.name_en),
    description: localized(row.description_id, row.description_en),
    type: row.type === "streak" ? "streak" : "verification_count",
    threshold: asNumber(row.threshold, 1),
    iconKey:
      row.icon_key === "leaf" || row.icon_key === "tree" || row.icon_key === "flame" || row.icon_key === "star" || row.icon_key === "shield"
        ? row.icon_key
        : "sprout",
    earned: false,
    progress: 0,
    isActive: asBoolean(row.is_active, true),
  }));
}

export async function getAdminFeed(): Promise<FeedItem[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("verified_feed")
    .select("*, categories(slug)")
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return asRows(data).map(mapFeed);
}

export async function getAdminSettings(): Promise<Record<string, unknown>> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.schema("private").from("system_settings").select("key, value");
  if (error) throw new Error(error.message);
  return Object.fromEntries(asRows(data).map((row) => [asString(row.key), row.value]));
}

export async function getAdminAudit(limit = 200): Promise<AuditLog[]> {
  const admin = getSupabaseAdmin();
  const [logs, profiles] = await Promise.all([
    admin.schema("private").from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit),
    admin.from("profiles").select("id, full_name"),
  ]);
  if (logs.error) throw new Error(logs.error.message);
  const profileById = profileMap(asRows(profiles.data));
  return asRows(logs.data).map((row) => ({
    id: asString(row.id),
    actor: asString(profileById.get(asString(row.actor_id))?.full_name, "Sistem"),
    action: asString(row.action),
    target: `${asString(row.target_type)}${asString(row.target_id) ? `:${asString(row.target_id)}` : ""}`,
    createdAt: asString(row.created_at),
    requestId: asString(row.request_id, "-"),
  }));
}

/**
 * Ringkasan dashboard admin: status layanan nyata, angka antrean, serta
 * daftar terbaru (klaim, feed, saran KB, moderasi forum).
 */
export async function getAdminOverview() {
  const admin = getSupabaseAdmin();
  const [users, reviewers, pendingSuggestions, held, claims, feed, suggestions, moderation, audit, services] =
    await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from("reviewers").select("is_available"),
      admin
        .schema("private")
        .from("kb_suggestions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("forum_comments")
        .select("id", { count: "exact", head: true })
        .in("status", ["held", "pending_moderation"]),
      admin
        .from("claims")
        .select("id, original_text, status, created_at, categories(slug)")
        .order("created_at", { ascending: false })
        .limit(3),
      admin
        .from("verified_feed")
        .select("id, slug, title_id, title_en, verdict, published_at")
        .order("published_at", { ascending: false })
        .limit(3),
      admin
        .schema("private")
        .from("kb_suggestions")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      admin
        .from("forum_comments")
        .select("id, body, status, created_at, forum_threads(title)")
        .in("status", ["held", "pending_moderation"])
        .order("created_at", { ascending: false })
        .limit(3),
      getAdminAudit(5),
      probeServices(),
    ]);

  const now = Date.now();
  const userList = users.data?.users ?? [];
  const activeUsers = userList.filter((user) => {
    const bannedUntil = user.banned_until ? new Date(user.banned_until).getTime() : null;
    return bannedUntil === null || bannedUntil <= now;
  }).length;
  const reviewerRows = asRows(reviewers.data);

  return {
    stats: {
      users: userList.length,
      activeUsers,
      reviewers: reviewerRows.length,
      availableReviewers: reviewerRows.filter((row) => asBoolean(row.is_available, true)).length,
      pendingSuggestions: pendingSuggestions.count ?? 0,
      heldComments: held.count ?? 0,
    },
    recentClaims: asRows(claims.data).map((row) => ({
      id: asString(row.id),
      text: asString(row.original_text),
      status: asString(row.status) as ClaimStatus,
      categorySlug: asString(asRow(row.categories).slug),
      createdAt: asString(row.created_at),
    })),
    recentFeed: asRows(feed.data).map((row) => ({
      id: asString(row.id),
      slug: asString(row.slug),
      title: localized(row.title_id, row.title_en),
      verdict: asString(row.verdict) as Verdict,
      publishedAt: asString(row.published_at),
    })),
    recentSuggestions: asRows(suggestions.data).map((row) => ({
      id: asString(row.id),
      title: asString(row.title),
      status: asString(row.status) as KBSuggestion["status"],
      createdAt: asString(row.created_at),
    })),
    recentModeration: asRows(moderation.data).map((row) => ({
      id: asString(row.id),
      body: asString(row.body),
      status: asString(row.status) as CommentStatus,
      threadTitle: asString(asRow(row.forum_threads).title),
      createdAt: asString(row.created_at),
    })),
    audit,
    services,
  };
}

export async function getAdminDashboard(session: Session) {
  const admin = getSupabaseAdmin();
  const [users, reviewers, suggestions, held, assignments, sources, failed, audit, queue, buckets] =
    await Promise.all([
      getAdminUsers(),
      getAdminReviewers(),
      getAdminSuggestions(),
      admin.from("forum_comments").select("id", { count: "exact", head: true }).in("status", ["held", "pending_moderation"]),
      admin.from("claim_review_assignments").select("id", { count: "exact", head: true }).in("status", ["assigned", "opened"]),
      getAdminKbSources(),
      admin.from("claims").select("id", { count: "exact", head: true }).eq("status", "analysis_failed"),
      getAdminAudit(),
      admin.schema("private").from("ai_jobs").select("id", { count: "exact", head: true }).eq("status", "queued"),
      admin.storage.listBuckets(),
    ]);

  const env = getServerEnv();
  const services: SystemService[] = [
    {
      name: "Database",
      status: "healthy",
      detail: localized("Terhubung ke Supabase.", "Connected to Supabase."),
      latency: undefined,
    },
    {
      name: env.AI_PROVIDER === "groq" ? "Groq" : "Gemini",
      status:
        env.AI_PROVIDER === "groq"
          ? env.GROQ_API_KEY
            ? "attention"
            : "degraded"
          : env.GEMINI_API_KEY
            ? "attention"
            : "degraded",
      detail:
        env.AI_PROVIDER === "groq"
          ? env.GROQ_API_KEY
            ? localized(
                `Kunci terpasang. Model ${env.GROQ_MODEL_GENERATION ?? "belum diisi"}. Embedding tetap Gemini.`,
                `Key configured. Model ${env.GROQ_MODEL_GENERATION ?? "not set"}. Embeddings still use Gemini.`,
              )
            : localized("Kunci API Groq belum diisi.", "Groq API key is missing.")
          : env.GEMINI_API_KEY
            ? localized(
                "Kunci terpasang. Akses model belum diverifikasi.",
                "Key configured. Model access is not verified.",
              )
            : localized("Kunci API belum diisi.", "API key is missing."),
    },
    {
      name: "Europe PMC",
      status: "healthy",
      detail: localized("Klien siap dipanggil.", "Client ready."),
    },
    {
      name: "Storage",
      status: buckets.error ? "degraded" : "healthy",
      detail: buckets.error
        ? localized("Bucket tidak dapat dibaca.", "Buckets could not be read.")
        : localized(`${buckets.data?.length ?? 0} bucket privat terdeteksi.`, `${buckets.data?.length ?? 0} private buckets found.`),
    },
    {
      name: "Queue",
      status: "healthy",
      detail: localized(`${queue.count ?? 0} job menunggu.`, `${queue.count ?? 0} jobs queued.`),
    },
  ];

  return {
    viewer: session,
    users,
    reviewers,
    suggestions,
    heldCount: held.count ?? 0,
    activeAssignments: assignments.count ?? 0,
    sources,
    failedCount: failed.count ?? 0,
    audit,
    services,
  };
}
