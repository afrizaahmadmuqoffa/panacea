// Kunci kanonik untuk private.system_settings.
//
// Nilai di database memakai snake_case. saveSettingsAction memetakan field
// schema ke kunci ini agar reader (Pengaturan dan runtime pipeline) memakai satu
// nama yang sama.
export const SETTING_KEYS = {
  siteName: "site_name",
  defaultDescription: "default_description",
  defaultLocale: "default_locale",
  ragMinScore: "rag_min_score",
  ragChunkCount: "rag_chunk_count",
  kbMinEvidenceCount: "kb_min_evidence_count",
  claimAnalysisEnabled: "claim_analysis_enabled",
  forumModerationFailClosed: "forum_moderation_fail_closed",
  maxClaimTextLength: "max_claim_text_length",
  methodologyVersion: "methodology_version",
} as const;

export type SettingField = keyof typeof SETTING_KEYS;