import { z } from "zod";

export const extractionSchema = z.object({
  language: z.enum(["id", "en", "unknown"]),
  normalizedClaim: z.string().min(5).max(2000),
  normalizedClaimEn: z.string().min(5).max(2000),
  searchQueryEn: z.string().min(3).max(300),
  categorySlug: z.string().min(1).max(80),
  riskFlags: z.array(z.string().max(200)).max(10).default([]),
});

export const verificationSchema = z.object({
  verdict: z.enum(["supported", "partly_supported", "contradicted", "insufficient_evidence"]),
  confidence: z.enum(["low", "medium", "high"]),
  summaryId: z.string().min(150).max(6000),
  summaryEn: z.string().min(150).max(6000),
  limitationsId: z.string().min(50).max(2000),
  limitationsEn: z.string().min(50).max(2000),
  usedEvidenceIds: z.array(z.string().min(1).max(200)).max(20),
});

export const moderationSchema = z.object({
  decision: z.enum(["visible", "held", "removed"]),
  reasonId: z.string().max(500).default(""),
  reasonEn: z.string().max(500).default(""),
});

export const clarificationSchema = z.object({
  language: z.enum(["id", "en"]),
  linkedFeedSlug: z.string().max(200).nullable(),
  noteId: z.string().max(400).default(""),
  noteEn: z.string().max(400).default(""),
});

export type ExtractionOutput = z.infer<typeof extractionSchema>;
export type VerificationOutput = z.infer<typeof verificationSchema>;
export type ModerationOutput = z.infer<typeof moderationSchema>;
export type ClarificationOutput = z.infer<typeof clarificationSchema>;
