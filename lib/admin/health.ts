import "server-only";
import { probeAiProvider } from "@/lib/ai/provider";
import { localized } from "@/lib/data/row";
import { getServerEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Localized, SystemService } from "@/lib/types";

type Probe = {
  status: "healthy" | "attention";
  detail: Localized;
  latency: string;
};

function elapsed(start: number) {
  return `${Math.max(1, Math.round(performance.now() - start))} ms`;
}

function shortError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 120) || "tidak diketahui";
}

async function probeDatabase(): Promise<Probe> {
  const start = performance.now();
  try {
    const admin = getSupabaseAdmin();
    const { error, count } = await admin.from("categories").select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return {
      status: "healthy",
      detail: localized(
        `Supabase terhubung. ${count ?? 0} kategori terbaca.`,
        `Supabase reachable. ${count ?? 0} categories read.`,
      ),
      latency: elapsed(start),
    };
  } catch (error) {
    return {
      status: "attention",
      detail: localized(
        `Database tidak terjangkau: ${shortError(error)}`,
        `Database unreachable: ${shortError(error)}`,
      ),
      latency: elapsed(start),
    };
  }
}

async function probeAi(): Promise<Probe> {
  const start = performance.now();
  const provider = getServerEnv().AI_PROVIDER === "groq" ? "Groq" : "Gemini";
  try {
    const info = await probeAiProvider();
    if (!info.embeddingReady) {
      return {
        status: "attention",
        detail: localized(
          `${provider} ${info.model} aktif, tetapi kunci embedding Gemini belum diisi.`,
          `${provider} ${info.model} is live, but the Gemini embedding key is missing.`,
        ),
        latency: elapsed(start),
      };
    }
    return {
      status: "healthy",
      detail: localized(
        `${provider} ${info.model} aktif. Embedding siap.`,
        `${provider} ${info.model} is live. Embeddings ready.`,
      ),
      latency: elapsed(start),
    };
  } catch (error) {
    return {
      status: "attention",
      detail: localized(
        `${provider} tidak dapat dipakai: ${shortError(error)}`,
        `${provider} unusable: ${shortError(error)}`,
      ),
      latency: elapsed(start),
    };
  }
}

async function probeEuropePmc(): Promise<Probe> {
  const start = performance.now();
  const env = getServerEnv();
  try {
    const url = new URL(`${env.EUROPE_PMC_BASE_URL.replace(/\/$/, "")}/search`);
    url.searchParams.set("query", "aspirin");
    url.searchParams.set("format", "json");
    url.searchParams.set("pageSize", "1");
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(Math.min(env.EUROPE_PMC_TIMEOUT_MS, 8000)),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = (await response.json()) as { hitCount?: number };
    return {
      status: "healthy",
      detail: localized(
        `Pencarian uji berhasil. ${payload.hitCount ?? 0} hit.`,
        `Test search succeeded. ${payload.hitCount ?? 0} hits.`,
      ),
      latency: elapsed(start),
    };
  } catch (error) {
    return {
      status: "attention",
      detail: localized(
        `Europe PMC tidak dapat dihubungi: ${shortError(error)}`,
        `Europe PMC unreachable: ${shortError(error)}`,
      ),
      latency: elapsed(start),
    };
  }
}

/**
 * Status nyata tiga layanan inti. Tiap probe menangkap error sendiri supaya
 * halaman admin tetap tampil meski satu layanan mati.
 */
export async function probeServices(): Promise<SystemService[]> {
  const [database, ai, europePmc] = await Promise.all([
    probeDatabase(),
    probeAi(),
    probeEuropePmc(),
  ]);
  return [
    { name: "Database", status: database.status, detail: database.detail, latency: database.latency },
    { name: "AI", status: ai.status, detail: ai.detail, latency: ai.latency },
    { name: "Europe PMC", status: europePmc.status, detail: europePmc.detail, latency: europePmc.latency },
  ];
}
