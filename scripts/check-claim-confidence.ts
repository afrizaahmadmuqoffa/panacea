import assert from "node:assert/strict";
import { calibrateConfidence } from "@/lib/claims/confidence";
import { assertKnownEvidenceIds, buildInsufficientOutput, hasVerdictWithoutEvidence } from "@/lib/claims/guard";

function main() {
  const insufficient = buildInsufficientOutput();
  assert.equal(insufficient.verdict, "insufficient_evidence");
  assert.equal(insufficient.confidence, "low");
  assert.equal(insufficient.usedEvidenceIds.length, 0);

  const c0 = calibrateConfidence({ modelConfidence: "high", verdict: "supported", usedEvidence: [] });
  assert.equal(c0.confidence, "low");
  assert.equal(c0.reason, "no_evidence");

  const c1 = calibrateConfidence({ modelConfidence: "high", verdict: "supported", usedEvidence: [{ sourceType: "kb" }] });
  assert.equal(c1.confidence, "low");
  assert.equal(c1.reason, "single_source");

  const c2 = calibrateConfidence({ modelConfidence: "high", verdict: "partly_supported", usedEvidence: [{ sourceType: "kb" }, { sourceType: "europe_pmc" }] });
  assert.equal(c2.confidence, "medium");
  assert.equal(c2.reason, "two_sources");

  const c3 = calibrateConfidence({ modelConfidence: "high", verdict: "supported", usedEvidence: [{ sourceType: "kb" }, { sourceType: "europe_pmc" }, { sourceType: "kb" }] });
  assert.equal(c3.confidence, "high");
  assert.equal(c3.reason, "within_model_estimate");

  const c4 = calibrateConfidence({ modelConfidence: "high", verdict: "supported", usedEvidence: [{ sourceType: "europe_pmc" }, { sourceType: "europe_pmc" }, { sourceType: "europe_pmc" }] });
  assert.equal(c4.confidence, "medium");
  assert.equal(c4.reason, "uncurated_only");

  const ci = calibrateConfidence({ modelConfidence: "high", verdict: "insufficient_evidence", usedEvidence: [] });
  assert.equal(ci.confidence, "low");
  assert.equal(ci.reason, "insufficient_evidence");

  assert.throws(() => assertKnownEvidenceIds(["x"], new Set(["y"])), /Model cited unknown evidence/);
  assert.equal(hasVerdictWithoutEvidence("supported", 0), true);
  assert.equal(hasVerdictWithoutEvidence("insufficient_evidence", 0), false);
  assert.doesNotThrow(() => assertKnownEvidenceIds(["y"], new Set(["y"])));

  console.log("ok");
}

main();
