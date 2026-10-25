import type { Verdict } from "@/lib/types";

export type InsufficientOutput = {
  verdict: "insufficient_evidence";
  confidence: "low";
  summaryId: string;
  summaryEn: string;
  limitationsId: string;
  limitationsEn: string;
  usedEvidenceIds: [];
};

export const insufficientOutput: InsufficientOutput = {
  verdict: "insufficient_evidence",
  confidence: "low",
  summaryId:
    "Belum ada bukti yang cukup untuk memutuskan klaim ini. Diperlukan sumber yang lebih spesifik dan relevan.",
  summaryEn:
    "There is not enough evidence to decide this claim. More specific and relevant sources are needed.",
  limitationsId:
    "Pencarian tidak menemukan bukti yang cukup kuat. Hasil ini bukan penilaian bahwa klaim benar atau salah.",
  limitationsEn:
    "The search did not find sufficiently strong evidence. This is not a judgment that the claim is true or false.",
  usedEvidenceIds: [],
};

export function assertKnownEvidenceIds(usedIds: string[], knownIds: Set<string>) {
  const unknown = usedIds.filter((id) => !knownIds.has(id));
  if (unknown.length > 0) {
    throw new Error(`Model cited unknown evidence: ${unknown.join(", ")}`);
  }
}

export function hasVerdictWithoutEvidence(verdict: Verdict, usedCount: number) {
  return verdict !== "insufficient_evidence" && usedCount === 0;
}

export function buildInsufficientOutput(): InsufficientOutput {
  return {
    verdict: insufficientOutput.verdict,
    confidence: insufficientOutput.confidence,
    summaryId: insufficientOutput.summaryId,
    summaryEn: insufficientOutput.summaryEn,
    limitationsId: insufficientOutput.limitationsId,
    limitationsEn: insufficientOutput.limitationsEn,
    usedEvidenceIds: [],
  };
}
