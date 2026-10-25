import "server-only";
import { z } from "zod";
import type { AiContent } from "./provider";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type GroqContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type GroqMessage = {
  role: "system" | "user";
  content: string | GroqContentPart[];
};

type GroqOptions = {
  apiKey: string;
  model: string;
  system: string;
  contents: string | AiContent[];
  temperature?: number;
  timeoutMs: number;
  maxRetries: number;
  maxOutputTokens: number;
};

type JsonSchema = Record<string, unknown>;

function isRetryableStatus(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * Strict structured output menuntut seluruh properti wajib dan additionalProperties false.
 */
// Keyword yang tidak didukung constrained decoding Groq; Zod tetap memvalidasinya.
const UNSUPPORTED_KEYWORDS = new Set([
  "additionalProperties",
  "default",
  "format",
  "maxItems",
  "maxLength",
  "maxProperties",
  "minItems",
  "minLength",
  "minProperties",
  "pattern",
  "uniqueItems",
]);

function strictify(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strictify);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (UNSUPPORTED_KEYWORDS.has(key)) continue;
    out[key] = strictify(value);
  }
  if (out.type === "object" && out.properties && typeof out.properties === "object") {
    out.required = Object.keys(out.properties as Record<string, unknown>);
    out.additionalProperties = false;
  }
  return out;
}

export function buildJsonSchema(schema: z.ZodType): JsonSchema {
  const json = z.toJSONSchema(schema) as JsonSchema;
  delete json.$schema;
  return strictify(json) as JsonSchema;
}

function toMessages(system: string, contents: string | AiContent[]): GroqMessage[] {
  const messages: GroqMessage[] = [{ role: "system", content: system }];
  if (typeof contents === "string") {
    messages.push({ role: "user", content: contents });
    return messages;
  }
  for (const item of contents) {
    const parts: GroqContentPart[] = [];
    for (const part of item.parts) {
      if ("text" in part) {
        parts.push({ type: "text", text: part.text });
      } else {
        parts.push({
          type: "image_url",
          image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` },
        });
      }
    }
    messages.push({ role: "user", content: parts });
  }
  return messages;
}

async function request(body: Record<string, unknown>, options: GroqOptions) {
  const url = process.env.GROQ_BASE_URL ?? GROQ_URL;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(options.timeoutMs),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Groq ${response.status}: ${detail}`);
  }
  return (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
}

function contentOf(payload: { choices?: { message?: { content?: string | null } }[] }) {
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Model tidak mengembalikan JSON.");
  return content;
}

export async function groqGenerateJson<T>(
  schema: z.ZodType<T>,
  options: GroqOptions,
): Promise<T> {
  const jsonSchema = buildJsonSchema(schema);
  const base = {
    model: options.model,
    temperature: options.temperature ?? 0.2,
    max_completion_tokens: options.maxOutputTokens,
  };

  const strictBody: Record<string, unknown> = {
    ...base,
    messages: toMessages(options.system, options.contents),
    response_format: {
      type: "json_schema",
      json_schema: { name: "panacea_output", strict: true, schema: jsonSchema },
    },
  };

  // Fallback: sebagian model menolak constrained decoding, jadi schema dikirim di prompt.
  const looseBody: Record<string, unknown> = {
    ...base,
    messages: toMessages(
      `${options.system}\n\nReturn only JSON matching this schema:\n${JSON.stringify(jsonSchema)}`,
      options.contents,
    ),
    response_format: { type: "json_object" },
  };

  const call = async (body: Record<string, unknown>) => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
      try {
        const payload = await request(body, options);
        const text = contentOf(payload);
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error("Output model bukan JSON yang valid.");
        }
        return schema.parse(parsed);
      } catch (error) {
        lastError = error;
        const status = /Groq (\d{3})/.exec(error instanceof Error ? error.message : "");
        const retryable = status ? isRetryableStatus(Number(status[1])) : true;
        if (attempt === options.maxRetries || !retryable) break;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  };

  try {
    return await call(strictBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Groq 400/.test(message)) throw error;
    return await call(looseBody);
  }
}

export async function listGroqModels(apiKey: string, timeoutMs: number) {
  const response = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Groq ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const payload = (await response.json()) as { data?: { id: string }[] };
  return (payload.data ?? []).map((model) => model.id);
}
