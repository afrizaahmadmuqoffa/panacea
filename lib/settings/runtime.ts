import "server-only";
import { getServerEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { MAX_CLAIM_TEXT_LENGTH } from "@/lib/limits";
import { SETTING_KEYS } from "./keys";

type Row = Record<string, unknown>;

export type RuntimeSettings = {
  /** Ambang similarity minimum untuk hit vektor dari knowledge base. */
  ragMinScore: number;
  /** Jumlah kandidat chunk yang diambil dari knowledge base. */
  ragChunkCount: number;
  /** Jumlah bukti KB minimum sebelum mencari Europe PMC. */
  kbMinEvidenceCount: number;
  /**whether anggota boleh mengirim klaim baru. */
  claimAnalysisEnabled: boolean;
  /** Saat moderasi AI gagal, komentar ditahan (true) atau ditunggu admin (false). */
  forumModerationFailClosed: boolean;
  /** Panjang maksimum teks klaim yang diterima. */
  maxClaimTextLength: number;
};

function boundedNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function booleanSetting(value: unknown, fallback: boolean) {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

/**
 * Parameter retrieval dari Pengaturan admin, dengan fallback ke environment.
 * Dipakai pipeline analisis klaim supaya perubahan di UI benar-benar berlaku.
 */
export async function getRuntimeSettings(): Promise<RuntimeSettings> {
  const env = getServerEnv();
  const fallback: RuntimeSettings = {
    ragMinScore: env.KB_MIN_SCORE,
    ragChunkCount: env.KB_TOP_K,
    kbMinEvidenceCount: env.KB_MIN_EVIDENCE_COUNT,
    claimAnalysisEnabled: true,
    forumModerationFailClosed: true,
    maxClaimTextLength: MAX_CLAIM_TEXT_LENGTH,
  };

  try {
    const { data } = await getSupabaseAdmin()
      .schema("private")
      .from("system_settings")
      .select("key, value");
    const rows: Row[] = Array.isArray(data) ? (data as Row[]) : [];
    const map = new Map(
      rows.map((row) => [
        typeof row.key === "string" ? row.key : "",
        row.value,
      ]),
    );

    return {
      ragMinScore: boundedNumber(map.get(SETTING_KEYS.ragMinScore), fallback.ragMinScore, 0, 1),
      ragChunkCount: boundedNumber(map.get(SETTING_KEYS.ragChunkCount), fallback.ragChunkCount, 1, 20),
      kbMinEvidenceCount: boundedNumber(
        map.get(SETTING_KEYS.kbMinEvidenceCount),
        fallback.kbMinEvidenceCount,
        1,
        10,
      ),
      claimAnalysisEnabled: booleanSetting(
        map.get(SETTING_KEYS.claimAnalysisEnabled),
        fallback.claimAnalysisEnabled,
      ),
      forumModerationFailClosed: booleanSetting(
        map.get(SETTING_KEYS.forumModerationFailClosed),
        fallback.forumModerationFailClosed,
      ),
      maxClaimTextLength: boundedNumber(
        map.get(SETTING_KEYS.maxClaimTextLength),
        fallback.maxClaimTextLength,
        100,
        10000,
      ),
    };
  } catch {
    // Pengaturan bersifat opsi; kegagalan membaca tidak boleh menggagalkan analisis.
    return fallback;
  }
}