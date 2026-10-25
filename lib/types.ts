import type { Locale } from "./i18n/config";

export type Localized = Record<Locale, string>;

export type UserRole = "user" | "reviewer" | "admin";

export type Verdict = "supported" | "partly_supported" | "contradicted" | "insufficient_evidence";

export type ClaimStatus =
  | "queued"
  | "analyzing"
  | "analyzed"
  | "analysis_failed"
  | "reported"
  | "finalized"
  | "archived";

export type AnalysisStatus = "queued" | "running" | "succeeded" | "failed";

export type InputType = "text" | "url" | "image";

export type ReportStatus =
  | "waiting_assignment"
  | "assigned"
  | "finalized"
  | "needs_admin_review"
  | "closed";

export type Confidence = "low" | "medium" | "high";

export type Profile = {
  fullName: string;
  alias: string;
  email: string;
  xp: number;
  streak: number;
  showOnLeaderboard: boolean;
  uiLanguage: Locale;
};

export type Category = {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  isActive: boolean;
  usage: number;
};

export type EvidenceRef = {
  id: string;
  title: string;
  publisher: string;
  year: number;
  identifier?: string;
  url: string;
  snippet: Localized;
  sourceType: "kb" | "europe_pmc";
  relevance: "high" | "medium" | "low";
};

export type ClaimAnalysis = {
  id: string;
  claimId: string;
  status: AnalysisStatus;
  verdict?: Verdict;
  confidence?: Confidence;
  summary: Localized;
  limitations: Localized;
  evidence: EvidenceRef[];
  usedKb: boolean;
  usedEuropePmc: boolean;
  retrieval?: {
    kbCandidates: number;
    pmcCandidates: number;
    selectedEvidence: number;
    searchQuery: string;
    minScore: number;
    maxKbSimilarity: number;
  };
  modelName: string;
  promptVersion: string;
  analyzedAt?: string;
  errorCode?: string;
};

export type Claim = {
  id: string;
  inputType: InputType;
  originalText: string;
  sourceUrl?: string;
  imageName?: string;
  language: Locale | "unknown";
  categorySlug: string;
  status: ClaimStatus;
  createdAt: string;
  reportStatus?: ReportStatus;
  /** Slug feed terverifikasi bila klaim ini sudah punya putusan reviewer. */
  reviewerFeedSlug?: string;
  analysis?: ClaimAnalysis;
};

export type FeedItem = {
  id: string;
  slug: string;
  title: Localized;
  publicClaimText: Localized;
  verdict: Verdict;
  summary: Localized;
  expertNote: Localized;
  limitations: Localized;
  evidence: EvidenceRef[];
  categorySlug: string;
  methodologyVersion: string;
  publishedAt: string;
  status: "visible" | "hidden";
  reviewerCount: number;
  reviewerName?: string;
};

export type CommentStatus = "pending_moderation" | "visible" | "held" | "hidden" | "removed";

export type ForumComment = {
  id: string;
  threadId: string;
  parentId?: string;
  authorAlias: string;
  authorIsReviewer: boolean;
  isOwn: boolean;
  isEdited: boolean;
  isAi: boolean;
  body: string;
  status: CommentStatus;
  createdAt: string;
  linkedFeedSlug?: string;
  moderationNote?: Localized;
};

export type ForumThread = {
  id: string;
  title: string;
  body: string;
  authorAlias: string;
  authorIsReviewer: boolean;
  categorySlug: string;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;
  views: number;
  comments: ForumComment[];
};

export type GameStatement = {
  id: string;
  statement: Localized;
  isFact: boolean;
  explanation: Localized;
  sourceUrl: string;
  categorySlug: string;
  isActive: boolean;
  imageUrl?: string | null;
};

export type GameAnswer = {
  statementId: string;
  answerIsFact: boolean;
  isCorrect: boolean;
  xpAwarded: number;
  /** true bila soal ini sudah pernah dimainkan sebelumnya (review). */
  isReview: boolean;
};

export type GameProgressSummary = {
  sessionsToday: number;
  sessionsPerDay: number;
  questionsPerSession: number;
  newAvailable: number;
  dueReviews: number;
  nextReviewAt: string | null;
};

export type GameSession = {
  id: string;
  answers: GameAnswer[];
  correctCount: number;
  xpEarned: number;
  startedAt: string;
  finishedAt: string;
};

export type Badge = {
  code: string;
  name: Localized;
  description: Localized;
  type: "verification_count" | "streak";
  threshold: number;
  iconKey: "sprout" | "leaf" | "tree" | "flame" | "star" | "shield";
  earned: boolean;
  progress: number;
  earnedAt?: string;
  isActive?: boolean;
};

export type Notification = {
  id: string;
  type:
    | "analysis"
    | "report"
    | "expert_result"
    | "moderation"
    | "badge"
    | "suggestion"
    | "mention"
    | "system";
  title: Localized;
  body: Localized;
  href?: string;
  isRead: boolean;
  createdAt: string;
};

export type LeaderboardEntry = {
  rank: number;
  alias: string;
  xp: number;
  streak: number;
  isCurrentUser: boolean;
  inactive: boolean;
  trend: "up" | "down" | "same";
};

export type ReviewerTask = {
  id: string;
  reportId: string;
  claimTitle: string;
  claimText: string;
  categorySlug: string;
  priority: "high" | "normal";
  assignedAt: string;
  status: "assigned" | "opened" | "submitted_primary" | "submitted_supplemental" | "conflict";
  reporterReason: string;
  aiVerdict: Verdict;
  aiSummary: Localized;
  evidence: EvidenceRef[];
  publicDraft: Localized;
  limitations: Localized;
  alreadyReviewed?: boolean;
};

export type KBChunk = {
  id: string;
  sourceId: string;
  index: number;
  content: string;
  tokenCount: number;
  status: "draft" | "approved" | "rejected" | "ingested";
};

export type KBIngestJob = {
  id: string;
  sourceId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  runAfter: string;
  createdAt: string;
  updatedAt: string;
};

export type KBSource = {
  id: string;
  type: "article" | "document";
  title: string;
  author: string;
  year: number;
  categorySlug: string;
  status: "draft" | "chunked" | "ingested" | "failed" | "archived";
  fileType?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  chunks: KBChunk[];
  latestIngestJob?: KBIngestJob;
};

export type KBSuggestion = {
  id: string;
  reviewerAlias: string;
  title: string;
  note: string;
  targetSourceId?: string;
  categorySlug?: string;
  author?: string;
  year?: number;
  sourceUrl?: string;
  status: "pending" | "approved" | "rejected" | "needs_changes";
  createdAt: string;
  ageDays?: number;
  adminNote?: string;
  chunks: KBChunk[];
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  joinedAt: string;
  lastActiveAt: string;
  xp: number;
};

export type ReviewerProfile = {
  id: string;
  fullName: string;
  email: string;
  categorySlugs: string[];
  isAvailable: boolean;
  activeTasks: number;
  completedTasks: number;
  joinedAt: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
  requestId: string;
};

export type SystemService = {
  name: string;
  status: "healthy" | "degraded" | "attention";
  detail: Localized;
  latency?: string;
};

export type Report = {
  id: string;
  claimId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reviewerCount: number;
};
