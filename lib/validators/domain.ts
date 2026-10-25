import { z } from "zod";
import { MAX_CLAIM_TEXT_LENGTH } from "@/lib/limits";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const checkbox = z.preprocess((value) => value === "on" || value === true, z.literal(true));

export const claimInputSchema = z.object({
  inputType: z.enum(["text", "url", "image"]),
  text: z.string().trim().max(MAX_CLAIM_TEXT_LENGTH).default(""),
  url: optionalText(2048),
  language: z.enum(["auto", "id", "en"]).default("auto"),
  categorySlug: optionalText(80),
  idempotencyKey: z.string().trim().min(8).max(100),
});

export const reportSchema = z.object({
  claimId: z.string().uuid(),
  reason: z.string().trim().min(30).max(3000),
  referenceUrls: z.array(z.string().url()).max(10).default([]),
  publicationAck: checkbox,
});

export const threadSchema = z.object({
  title: z.string().trim().min(10).max(180),
  body: z.string().trim().min(40).max(8000),
  categorySlug: z.string().trim().min(1).max(80),
});

export const commentSchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().trim().min(3).max(4000),
  linkedFeedSlug: optionalText(200),
  parentId: optionalText(36),
});

export const updateCommentSchema = z.object({
  commentId: z.string().uuid(),
  body: z.string().trim().min(3).max(4000),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  alias: z.string().trim().min(2).max(40),
  showOnLeaderboard: z.preprocess((value) => value === "on" || value === true, z.boolean()),
  uiLanguage: z.enum(["id", "en"]),
});

const reviewEvidenceSchema = z.object({
  title: z.string().trim().min(3).max(300),
  source: z.string().trim().min(2).max(200),
  year: z.coerce.number().int().min(1800).max(2200),
  identifier: z.string().trim().max(120).optional(),
  url: z.string().trim().url().optional(),
});

export const expertReviewSchema = z.object({
  reportId: z.string().uuid(),
  verdict: z.enum(["supported", "partly_supported", "contradicted", "insufficient_evidence"]),
  summaryId: z.string().trim().min(30).max(6000),
  summaryEn: z.string().trim().min(30).max(6000),
  limitationsId: z.string().trim().min(10).max(2000),
  limitationsEn: z.string().trim().min(10).max(2000),
  expertNoteId: z.string().trim().min(10).max(2000),
  expertNoteEn: z.string().trim().min(10).max(2000),
  publicTitleId: z.string().trim().min(10).max(200),
  publicTitleEn: z.string().trim().min(10).max(200),
  evidence: z.array(reviewEvidenceSchema).min(1).max(20),
  confirmPublish: checkbox,
});

export const kbSuggestionSchema = z.object({
  title: z.string().trim().min(5).max(200),
  note: z.string().trim().min(20).max(4000),
  author: z.string().trim().min(2).max(200),
  year: z.coerce.number().int().min(1800).max(2200),
  categorySlug: z.string().trim().min(1).max(80),
  sourceUrl: z.string().trim().url().optional(),
  targetSourceId: z.string().uuid().optional(),
  content: z.string().trim().min(100).max(100000),
});

export const kbArticleSchema = z.object({
  sourceId: z.string().uuid().optional(),
  title: z.string().trim().min(5).max(200),
  author: z.string().trim().min(2).max(200),
  year: z.coerce.number().int().min(1800).max(2200),
  categorySlug: z.string().trim().min(1).max(80),
  sourceUrl: z.string().trim().url().optional(),
  content: z.string().trim().min(100).max(100000),
});

export const adminUserSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["activate", "deactivate", "revoke_sessions"]),
});

export const reviewerSchema = z.object({
  reviewerId: z.string().uuid().optional(),
  fullName: z.string().trim().min(3).max(120),
  email: z.string().trim().email().optional(),
  password: z.string().min(8).max(72).optional(),
  categorySlugs: z.array(z.string().trim().min(1).max(80)).min(1),
  isAvailable: z.preprocess((value) => value === "on" || value === true, z.boolean()),
});

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2).max(80),
  nameId: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120),
  descriptionId: z.string().trim().min(5).max(500),
  descriptionEn: z.string().trim().min(5).max(500),
  isActive: z.preprocess((value) => value === "on" || value === true, z.boolean()),
});

export const gameStatementSchema = z.object({
  id: z.string().uuid().optional(),
  statementId: z.string().trim().min(5).max(2000),
  statementEn: z.string().trim().min(5).max(2000),
  isFact: z.preprocess((value) => value === "true" || value === true, z.boolean()),
  explanationId: z.string().trim().min(10).max(4000),
  explanationEn: z.string().trim().min(10).max(4000),
  sourceUrl: z.string().trim().url(),
  categorySlug: z.string().trim().min(1).max(80),
  isActive: z.preprocess((value) => value === "on" || value === true, z.boolean()),
});

export const badgeSchema = z.object({
  code: z.string().trim().min(2).max(80),
  threshold: z.coerce.number().int().min(1).max(100000),
});

export const feedVisibilitySchema = z.object({
  feedId: z.string().uuid(),
  status: z.enum(["visible", "hidden"]),
  revisionNote: z.string().trim().min(5).max(1000),
});

export const moderationSchema = z.object({
  commentId: z.string().uuid(),
  action: z.enum(["visible", "held", "hidden", "removed"]),
  reason: z.string().trim().max(1000).optional(),
});

export const settingsSchema = z.object({
  siteName: z.string().trim().min(2).max(120),
  defaultDescription: z.string().trim().min(10).max(500),
  defaultLocale: z.enum(["id", "en"]),
  ragMinScore: z.coerce.number().min(0).max(1),
  ragChunkCount: z.coerce.number().int().min(1).max(20),
  kbMinEvidenceCount: z.coerce.number().int().min(1).max(10),
  claimAnalysisEnabled: z.preprocess((value) => value === "on" || value === true, z.boolean()),
  forumModerationFailClosed: z.preprocess((value) => value === "on" || value === true, z.boolean()),
  maxClaimTextLength: z.coerce.number().int().min(100).max(10000),
});

export const kbChunkStatusSchema = z.enum(["draft", "approved", "rejected"]);

export const kbChunksSchema = z.object({
  content: z.string().trim().min(10).max(20000),
  status: kbChunkStatusSchema,
});

export const suggestionChunksSchema = z.object({
  content: z.string().trim().min(20).max(20000),
});

export const suggestionDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected", "needs_changes"]),
  adminNote: z.string().trim().max(1000),
});
