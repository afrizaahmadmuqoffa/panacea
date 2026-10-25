import type { Confidence, Verdict } from "@/lib/types";

export type ConfidenceReason =
  | "insufficient_evidence"
  | "no_evidence"
  | "single_source"
  | "two_sources"
  | "uncurated_only"
  | "within_model_estimate";

export type ConfidenceCalibration = {
  confidence: Confidence;
  modelConfidence: Confidence;
  reason: ConfidenceReason;
};

const confidenceOrder: Confidence[] = ["low", "medium", "high"];

function capConfidence(value: Confidence, max: Confidence) {
  const valueIndex = confidenceOrder.indexOf(value);
  const maxIndex = confidenceOrder.indexOf(max);
  if (valueIndex <= maxIndex) return value;
  return max;
}

export function calibrateConfidence(input: {
  modelConfidence: Confidence;
  verdict: Verdict;
  usedEvidence: Array<{ sourceType: "kb" | "europe_pmc" }>;
}): ConfidenceCalibration {
  const { modelConfidence, verdict, usedEvidence } = input;

  if (verdict === "insufficient_evidence") {
    return { confidence: "low", modelConfidence, reason: "insufficient_evidence" };
  }
  if (usedEvidence.length === 0) {
    return { confidence: "low", modelConfidence, reason: "no_evidence" };
  }
  if (usedEvidence.length === 1) {
    return { confidence: "low", modelConfidence, reason: "single_source" };
  }
  if (usedEvidence.length === 2) {
    return { confidence: capConfidence(modelConfidence, "medium"), modelConfidence, reason: "two_sources" };
  }

  const hasKb = usedEvidence.some((item) => item.sourceType === "kb");
  if (!hasKb) {
    return { confidence: capConfidence(modelConfidence, "medium"), modelConfidence, reason: "uncurated_only" };
  }

  return { confidence: modelConfidence, modelConfidence, reason: "within_model_estimate" };
}
