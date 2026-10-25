import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  getServerEnv,
  requireAiTextEnv,
  requireGeminiEmbeddingEnv,
  requireGeminiGenerationEnv,
  requireGroqTextEnv,
} from "@/lib/env";
import { groqGenerateJson, listGroqModels } from "./groq";

export type AiProvider = "gemini" | "groq";

export type AiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type AiContent = {
  role: "user";
  parts: AiPart[];
};

let client: GoogleGenAI | null = null;
let embeddingClient: GoogleGenAI | null = null;

function getClient() {
  if (client) return client;
  const env = requireGeminiGenerationEnv();
  client = new GoogleGenAI({
    apiKey: env.apiKey,
    httpOptions: { timeout: env.timeoutMs },
  });
  return client;
}

function getEmbeddingClient() {
  if (embeddingClient) return embeddingClient;
  const env = requireGeminiEmbeddingEnv();
  embeddingClient = new GoogleGenAI({
    apiKey: env.apiKey,
    httpOptions: { timeout: env.timeoutMs },
  });
  return embeddingClient;
}

function schemaFor(schema: z.ZodType) {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

function isRetryable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /429|500|502|503|504|timeout|deadline|unavailable/i.test(message);
}

async function withRetry<T>(operation: () => Promise<T>, attempts: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isRetryable(error)) break;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function generateJson<T>(
  schema: z.ZodType<T>,
  options: {
    model?: string;
    /** Paksa provider tertentu, misalnya gambar tetap ke Gemini saat provider aktif Groq. */
    provider?: AiProvider;
    system: string;
    contents: string | AiContent[];
    temperature?: number;
  },
): Promise<T> {
  const active = requireAiTextEnv();
  const provider = options.provider ?? active.provider;
  const env = provider === active.provider
    ? active
    : provider === "groq"
      ? requireGroqTextEnv()
      : requireGeminiGenerationEnv();
  const model = options.model ?? env.generationModel;

  if (provider === "groq") {
    return groqGenerateJson(schema, {
      apiKey: env.apiKey,
      model,
      system: options.system,
      contents: options.contents,
      temperature: options.temperature,
      timeoutMs: env.timeoutMs,
      maxRetries: env.maxRetries,
      maxOutputTokens: env.maxOutputTokens ?? 8192,
    });
  }

  const ai = getClient();
  const response = await withRetry(
    () =>
      ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.system,
          responseMimeType: "application/json",
          responseJsonSchema: schemaFor(schema),
          temperature: options.temperature ?? 0.2,
        },
      }),
    env.maxRetries,
  );

  const text = response.text;
  if (!text) throw new Error("Model tidak mengembalikan JSON.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Output model bukan JSON yang valid.");
  }
  return schema.parse(parsed);
}

/**
 * Cek konektivitas provider AI tanpa biaya generasi: daftar model Groq atau
 * hitung token Gemini. Melempar error bila kunci/model tidak bisa dipakai.
 */
export async function probeAiProvider() {
  const env = requireAiTextEnv();
  if (env.provider === "groq") {
    const models = await listGroqModels(env.apiKey, Math.min(env.timeoutMs, 8000));
    if (!models.includes(env.generationModel)) {
      throw new Error(`Model ${env.generationModel} tidak tersedia di Groq.`);
    }
  } else {
    const ai = getClient();
    await ai.models.countTokens({ model: env.generationModel, contents: "ping" });
  }
  return {
    provider: env.provider,
    model: env.generationModel,
    // Embedding selalu Gemini, walau provider teks aktif Groq.
    embeddingReady: Boolean(getServerEnv().GEMINI_API_KEY),
  };
}

export async function embedTexts(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
): Promise<number[][]> {
  const env = requireGeminiEmbeddingEnv();
  const ai = getEmbeddingClient();
  const response = await withRetry(
    () =>
      ai.models.embedContent({
        model: env.embeddingModel,
        // Array string dijawab batchEmbedContents sebagai satu embedding untuk
        // gemini-embedding-2; bentuk Content eksplisit dipakai agar satu embedding per teks.
        contents: texts.map((text) => ({ parts: [{ text }] })),
        config: {
          outputDimensionality: env.embeddingDimension,
          taskType,
        },
      }),
    env.maxRetries,
  );

  const embeddings = response.embeddings ?? [];
  if (embeddings.length !== texts.length) {
    throw new Error("Jumlah embedding tidak sesuai.");
  }
  return embeddings.map((embedding) => {
    const values = embedding.values ?? [];
    if (values.length !== env.embeddingDimension) {
      throw new Error(
        `Dimensi embedding ${values.length}, seharusnya ${env.embeddingDimension}.`,
      );
    }
    return values;
  });
}
