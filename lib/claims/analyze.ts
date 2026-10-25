import "server-only";
import { embedTexts, generateJson } from "@/lib/ai/provider";
import {
  extractionSchema,
  verificationSchema,
  type ExtractionOutput,
  type VerificationOutput,
} from "@/lib/ai/schemas";
import {
  extractionPrompt,
  imageExtractionContent,
  PROMPT_VERSIONS,
  verificationPrompt,
  extractionSystem,
  verificationSystem,
} from "@/lib/ai/prompts";
import { redactPii } from "@/lib/ai/redact";
import { requireAiTextEnv, getServerEnv } from "@/lib/env";
import { searchEuropePmc } from "@/lib/external/europe-pmc";
import { getRuntimeSettings } from "@/lib/settings/runtime";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { asNumber, asRows, asString } from "@/lib/data/row";
import { assertKnownEvidenceIds, buildInsufficientOutput, hasVerdictWithoutEvidence } from "./guard";
import { calibrateConfidence } from "./confidence";

type Row = Record<string, unknown>;

type EvidenceCandidate = {
  id: string;
  title: string;
  publisher: string;
  year: number;
  identifier: string;
  url: string | null;
  snippetId: string;
  snippetEn: string;
  sourceType: "kb" | "europe_pmc";
  sourceRecordId: string;
};

async function extractClaim(claim: Row, categorySlugs: string[]): Promise<ExtractionOutput> {
  const env = requireAiTextEnv();
  const admin = getSupabaseAdmin();
  const imagePath = asString(claim.image_path);

  if (imagePath) {
    const download = await admin.storage
      .from(getServerEnv().SUPABASE_STORAGE_BUCKET_CLAIM_IMAGES)
      .download(imagePath);
    if (download.error || !download.data) {
      throw new Error(download.error?.message ?? "Gambar klaim tidak dapat diunduh.");
    }
    const base64 = Buffer.from(await download.data.arrayBuffer()).toString("base64");
    const contents = imageExtractionContent({
      text: "Read the health claim in this image.",
      language: "unknown",
      categorySlugs,
      mimeType: download.data.type || "image/webp",
      base64,
    });
    return generateJson(extractionSchema, {
      // Groq (gpt-oss) belum punya model vision di akun ini, jadi gambar tetap Gemini.
      provider: "gemini",
      system: extractionSystem,
      contents,
    });
  }

  return generateJson(extractionSchema, {
    model: env.generationModel,
    system: extractionSystem,
    contents: extractionPrompt({
      text: redactPii(asString(claim.original_text)),
      language: asString(claim.language, "unknown"),
      categorySlugs,
    }),
  });
}

export async function analyzeClaimJob(payload: Record<string, unknown>) {
  const ai = requireAiTextEnv();
  const admin = getSupabaseAdmin();
  const claimId = asString(payload.claimId);
  const analysisId = asString(payload.analysisId);
  if (!claimId || !analysisId) throw new Error("Payload analisis tidak lengkap.");

  try {
    const claimResult = await admin
      .from("claims")
      .select("*, categories(slug)")
      .eq("id", claimId)
      .maybeSingle();
    if (claimResult.error || !claimResult.data) {
      throw new Error(claimResult.error?.message ?? "Klaim tidak ditemukan.");
    }
    const claim = claimResult.data as Row;

    await Promise.all([
      admin.from("claims").update({ status: "analyzing" }).eq("id", claimId),
      admin.from("claim_analyses").update({ status: "running" }).eq("id", analysisId),
    ]);

    const categories = await admin.from("categories").select("id, slug").eq("is_active", true);
    const categoryRows = asRows(categories.data);
    const categorySlugs = categoryRows.map((row) => asString(row.slug));

    const extraction = await extractClaim(claim, categorySlugs);
    const resolvedCategory = categoryRows.find((row) => asString(row.slug) === extraction.categorySlug);
    const claimText = extraction.normalizedClaim;
    const englishClaim = extraction.normalizedClaimEn;

    await admin
      .from("claims")
      .update({
        original_text: asString(claim.image_path) ? claimText : asString(claim.original_text),
        language: extraction.language,
        category_id: resolvedCategory?.id ?? claim.category_id ?? null,
      })
      .eq("id", claimId);

    const [embedding] = await embedTexts([englishClaim], "RETRIEVAL_QUERY");
    const settings = await getRuntimeSettings();

    let kbChunks: Row[] = [];
    try {
      const kb = await admin.rpc("match_kb_chunks_array", {
        p_query_embedding: embedding,
        p_query_text: `${englishClaim} ${claimText}`,
        p_top_k: settings.ragChunkCount,
        p_min_score: settings.ragMinScore,
      });
      if (!kb.error) kbChunks = asRows(kb.data);
    } catch {
      kbChunks = [];
    }

    const kbSourceIds = [...new Set(kbChunks.map((row) => asString(row.source_id)).filter(Boolean))];
    const sources = kbSourceIds.length
      ? await admin
          .schema("private")
          .from("kb_sources")
          .select("id, title, author, year, source_url")
          .in("id", kbSourceIds)
      : { data: [] };
    const sourceMap = new Map(asRows(sources.data).map((row) => [asString(row.id), row]));

    const evidence: EvidenceCandidate[] = kbChunks.map((row) => {
      const source = sourceMap.get(asString(row.source_id)) ?? {};
      return {
        id: `kb:${asString(row.chunk_id)}`,
        title: asString(source.title, "Knowledge Base"),
        publisher: asString(source.author, "Knowledge Base"),
        year: asNumber(source.year, new Date().getFullYear()),
        identifier: `KB:${asString(row.source_id)}`,
        url: asString(source.source_url) || null,
        snippetId: asString(row.content),
        snippetEn: asString(row.content),
        sourceType: "kb",
        sourceRecordId: asString(row.chunk_id),
      };
    });

    if (evidence.length < settings.kbMinEvidenceCount) {
      try {
        const pmc = await searchEuropePmc(extraction.searchQueryEn, 10);
        for (const record of pmc) {
          if (!record.abstract) continue;
          evidence.push({
            id: `epmc:${record.id}`,
            title: record.title,
            publisher: record.publisher,
            year: record.year,
            identifier: record.identifier,
            url: record.url,
            snippetId: record.abstract,
            snippetEn: record.abstract,
            sourceType: "europe_pmc",
            sourceRecordId: record.id,
          });
        }
      } catch (error) {
        if (evidence.length === 0) throw error;
        console.error(
          `[analyze] Europe PMC gagal untuk kueri "${extraction.searchQueryEn}":`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    const selectedEvidence = evidence.slice(0, 10);
    let output: VerificationOutput;
    let usedEvidence = selectedEvidence;

    if (selectedEvidence.length === 0) {
      output = buildInsufficientOutput();
      usedEvidence = [];
    } else {
      output = await generateJson(verificationSchema, {
        model: ai.generationModel,
        system: verificationSystem,
        contents: verificationPrompt({
          claim: `Claim in source language: ${claimText}\nClaim in English: ${englishClaim}`,
          language: extraction.language,
          category: extraction.categorySlug,
          evidence: selectedEvidence.map((item) => ({
            id: item.id,
            title: item.title,
            publisher: item.publisher,
            year: item.year,
            text: item.snippetEn,
          })),
        }),
      });

      const known = new Set(selectedEvidence.map((item) => item.id));
      assertKnownEvidenceIds(output.usedEvidenceIds, known);
      const used = new Set(output.usedEvidenceIds);
      usedEvidence = selectedEvidence.filter((item) => used.has(item.id));
      if (hasVerdictWithoutEvidence(output.verdict, usedEvidence.length)) {
        throw new Error("Model returned a verdict without valid evidence.");
      }
    }

    // Bukti ditulis lewat RPC supaya delete+insert terjadi dalam satu transaksi.
    const evidenceInsert = await admin.rpc("replace_claim_evidence", {
      p_analysis_id: analysisId,
      p_evidence: usedEvidence.map((item) => ({
        title: item.title,
        publisher: item.publisher,
        year: item.year,
        identifier: item.identifier,
        url: item.url,
        snippetId: item.snippetId,
        snippetEn: item.snippetEn,
        sourceType: item.sourceType,
        relevance: "high",
        sourceRecordId: item.sourceRecordId,
      })),
    });
    if (evidenceInsert.error) throw new Error(evidenceInsert.error.message);

    const usedKb = usedEvidence.some((item) => item.sourceType === "kb");
    const usedPmc = usedEvidence.some((item) => item.sourceType === "europe_pmc");

    const calibration = calibrateConfidence({
      modelConfidence: output.confidence,
      verdict: output.verdict,
      usedEvidence,
    });

    const analysisUpdate = await admin
      .from("claim_analyses")
      .update({
        status: "succeeded",
        verdict: output.verdict,
        confidence: calibration.confidence,
        summary_id: output.summaryId,
        summary_en: output.summaryEn,
        limitations_id: output.limitationsId,
        limitations_en: output.limitationsEn,
        used_kb: usedKb,
        used_europe_pmc: usedPmc,
        model_name: selectedEvidence.length ? `${ai.provider}/${ai.generationModel}` : "system",
        prompt_version: selectedEvidence.length
          ? PROMPT_VERSIONS.verification
          : PROMPT_VERSIONS.extraction,
        retrieval_metadata: {
          provider: ai.provider,
          kbCandidates: kbChunks.length,
          pmcCandidates: evidence.filter((item) => item.sourceType === "europe_pmc").length,
          selectedEvidence: usedEvidence.length,
          searchQuery: extraction.searchQueryEn,
          minScore: settings.ragMinScore,
          maxKbSimilarity: Number(
            Math.max(0, ...kbChunks.map((row) => Number(row.similarity) || 0)).toFixed(3),
          ),
          confidenceModel: calibration.modelConfidence,
          confidenceFinal: calibration.confidence,
          confidenceReason: calibration.reason,
        },
        error_code: null,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", analysisId);
    if (analysisUpdate.error) throw new Error(analysisUpdate.error.message);

    await admin.from("claims").update({ status: "analyzed" }).eq("id", claimId);
    await admin.from("notifications").insert({
      user_id: asString(claim.user_id),
      type: "analysis",
      title_id: "Analisis awal selesai",
      title_en: "Initial analysis complete",
      body_id: "Buka hasil untuk melihat verdict dan bukti.",
      body_en: "Open the result to see the verdict and evidence.",
      href: `/cek-klaim/${claimId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "analysis_failed";
    await Promise.all([
      admin
        .from("claim_analyses")
        .update({ status: "failed", error_code: message.slice(0, 500) })
        .eq("id", analysisId),
      admin.from("claims").update({ status: "analysis_failed" }).eq("id", claimId),
    ]);
    throw error;
  }
}
