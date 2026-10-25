import "server-only";
import { z } from "zod";
import { MAX_IMAGE_UPLOAD_BYTES, MAX_KB_DOCUMENT_BYTES } from "@/lib/limits";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const optionalText = z.preprocess(emptyToUndefined, z.string().optional());

const numberFromEnv = (fallback: number, min = 0) =>
  z.preprocess(emptyToUndefined, z.coerce.number().min(min)).default(fallback);

const booleanFromEnv = (fallback: boolean) =>
  z.preprocess(
    emptyToUndefined,
    z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  )
  .default(fallback);

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["id", "en"]).default("id"),
  APP_TIMEZONE: z.preprocess(emptyToUndefined, z.string().default("Asia/Jakarta")),
  ALLOW_OPEN_REGISTRATION: booleanFromEnv(true),

  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalText,
  SUPABASE_SECRET_KEY: optionalText,
  SUPABASE_DB_URL: optionalText,

  SUPABASE_STORAGE_BUCKET_CLAIM_IMAGES: z.preprocess(
    emptyToUndefined,
    z.string().default("claim-images"),
  ),
  SUPABASE_STORAGE_BUCKET_REPORT_ATTACHMENTS: z.preprocess(
    emptyToUndefined,
    z.string().default("report-attachments"),
  ),
  SUPABASE_STORAGE_BUCKET_KB_DOCUMENTS: z.preprocess(
    emptyToUndefined,
    z.string().default("kb-documents"),
  ),

  GEMINI_API_KEY: optionalText,
  GEMINI_MODEL_GENERATION: optionalText,
  GEMINI_MODEL_MODERATION: optionalText,
  GEMINI_MODEL_EMBEDDING: optionalText,
  GEMINI_EMBEDDING_DIMENSION: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().default(768),
  ),
  GEMINI_TIMEOUT_MS: numberFromEnv(45000, 1000),
  GEMINI_MAX_RETRIES: numberFromEnv(2, 0),

  // Penyedia teks+vision aktif. Embedding tetap memakai Gemini.
  AI_PROVIDER: z.enum(["gemini", "groq"]).default("gemini"),
  GROQ_API_KEY: optionalText,
  GROQ_MODEL_GENERATION: optionalText,
  GROQ_MODEL_MODERATION: optionalText,
  GROQ_TIMEOUT_MS: numberFromEnv(45000, 1000),
  GROQ_MAX_RETRIES: numberFromEnv(2, 0),
  GROQ_MAX_OUTPUT_TOKENS: numberFromEnv(8192, 256),

  EUROPE_PMC_BASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("https://www.ebi.ac.uk/europepmc/webservices/rest"),
  ),
  EUROPE_PMC_CONTACT_EMAIL: optionalText,
  EUROPE_PMC_PAGE_SIZE: numberFromEnv(10, 1),
  EUROPE_PMC_TIMEOUT_MS: numberFromEnv(15000, 1000),
  EUROPE_PMC_CACHE_TTL_SECONDS: numberFromEnv(604800, 60),

  KB_CHUNK_TARGET_TOKENS: numberFromEnv(600, 100),
  KB_CHUNK_OVERLAP_TOKENS: numberFromEnv(80, 0),
  KB_TOP_K: numberFromEnv(8, 1),
  // Baseline kemiripan tak-relevan embedding Gemini berada di kisaran 0.53-0.61,
  // jadi ambang di bawah itu tidak menyaring apa pun.
  KB_MIN_SCORE: numberFromEnv(0.7, 0),
  KB_MIN_EVIDENCE_COUNT: numberFromEnv(3, 1),
  RRF_K: numberFromEnv(60, 1),

  CLAIM_RATE_LIMIT_PER_HOUR: numberFromEnv(20, 1),
  // Nilai game dijalankan di SQL (start_game_session). Env ini hanya dokumentasi
  // dan dipakai UI sebagai cadangan bila ringkasan progres belum tersedia.
  GAME_SESSIONS_PER_DAY: numberFromEnv(2, 1),
  GAME_QUESTIONS_PER_SESSION: numberFromEnv(10, 1),
  RATE_LIMIT_WINDOW_SECONDS: numberFromEnv(3600, 60),

  UPLOAD_MAX_IMAGE_BYTES: numberFromEnv(MAX_IMAGE_UPLOAD_BYTES, 1024),
  UPLOAD_MAX_KB_DOCUMENT_BYTES: numberFromEnv(MAX_KB_DOCUMENT_BYTES, 1024),

  JOB_MAX_ATTEMPTS: numberFromEnv(3, 1),
  JOB_LEASE_SECONDS: numberFromEnv(120, 30),
  JOB_BACKOFF_SECONDS: numberFromEnv(30, 1),

  CRON_SECRET: optionalText,
  INTERNAL_WORKER_SECRET: optionalText,

  BOOTSTRAP_ADMIN_EMAIL: optionalText,
  BOOTSTRAP_ADMIN_PASSWORD: optionalText,
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function requireSupabaseEnv() {
  const env = getServerEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase URL and publishable key are required.");
  }
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function requireSupabaseAdminEnv() {
  const env = getServerEnv();
  const base = requireSupabaseEnv();
  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error("Supabase secret key is required for server administration.");
  }
  return { ...base, secretKey: env.SUPABASE_SECRET_KEY };
}

export type AiProvider = "gemini" | "groq";

/**
 * Embedding selalu Gemini: vektor KB 768 dimensi dan ambang KB_MIN_SCORE
 * dikalibrasi untuk model itu.
 */
export function requireGeminiEmbeddingEnv() {
  const env = getServerEnv();
  if (!env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is required for embeddings.");
  }
  return {
    apiKey: env.GEMINI_API_KEY,
    embeddingModel: env.GEMINI_MODEL_EMBEDDING ?? "gemini-embedding-2",
    embeddingDimension: env.GEMINI_EMBEDDING_DIMENSION,
    timeoutMs: env.GEMINI_TIMEOUT_MS,
    maxRetries: env.GEMINI_MAX_RETRIES,
  };
}

export function requireGroqTextEnv() {
  const env = getServerEnv();
  if (!env.GROQ_API_KEY || !env.GROQ_MODEL_GENERATION) {
    throw new Error("Groq API key and generation model are required.");
  }
  return {
    provider: "groq" as const,
    apiKey: env.GROQ_API_KEY,
    generationModel: env.GROQ_MODEL_GENERATION,
    moderationModel: env.GROQ_MODEL_MODERATION ?? env.GROQ_MODEL_GENERATION,
    timeoutMs: env.GROQ_TIMEOUT_MS,
    maxRetries: env.GROQ_MAX_RETRIES,
    maxOutputTokens: env.GROQ_MAX_OUTPUT_TOKENS,
  };
}

export function requireGeminiGenerationEnv() {
  const env = getServerEnv();
  if (!env.GEMINI_API_KEY || !env.GEMINI_MODEL_GENERATION) {
    throw new Error("Gemini API key and generation model are required.");
  }
  return {
    provider: "gemini" as const,
    apiKey: env.GEMINI_API_KEY,
    generationModel: env.GEMINI_MODEL_GENERATION,
    moderationModel: env.GEMINI_MODEL_MODERATION ?? env.GEMINI_MODEL_GENERATION,
    timeoutMs: env.GEMINI_TIMEOUT_MS,
    maxRetries: env.GEMINI_MAX_RETRIES,
    maxOutputTokens: undefined,
  };
}

/**
 * Konfigurasi teks+vision untuk provider aktif (Gemini atau Groq).
 */
export function requireAiTextEnv() {
  return getServerEnv().AI_PROVIDER === "groq" ? requireGroqTextEnv() : requireGeminiGenerationEnv();
}
