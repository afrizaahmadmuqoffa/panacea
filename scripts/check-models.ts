import { config } from "dotenv";
import { GoogleGenAI } from "@google/genai";

config({ path: ".env.local" });

const provider = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiGenerationModel = process.env.GEMINI_MODEL_GENERATION;
const embeddingModel = process.env.GEMINI_MODEL_EMBEDDING;
const embeddingDimension = Number(process.env.GEMINI_EMBEDDING_DIMENSION ?? 768);
const groqApiKey = process.env.GROQ_API_KEY;
const groqGenerationModel = process.env.GROQ_MODEL_GENERATION;
const groqModerationModel = process.env.GROQ_MODEL_MODERATION;
const timeoutMs = Number(process.env.GROQ_TIMEOUT_MS ?? 45000);

if (!geminiApiKey || !embeddingModel) {
  throw new Error("Gemini env tidak lengkap. Embedding selalu memakai Gemini.");
}

const jsonSchema = {
  type: "object",
  properties: { status: { type: "string" } },
  required: ["status"],
  additionalProperties: false,
} as const;

async function checkEmbeddings() {
  const ai = new GoogleGenAI({ apiKey: geminiApiKey! });
  const embedding = await ai.models.embedContent({
    model: embeddingModel!,
    contents: ["Vitamin C and the common cold."],
    config: {
      outputDimensionality: embeddingDimension,
      taskType: "RETRIEVAL_DOCUMENT",
    },
  });
  const values = embedding.embeddings?.[0]?.values ?? [];
  if (values.length !== embeddingDimension) {
    throw new Error(`Embedding dimension mismatch: ${values.length}/${embeddingDimension}`);
  }
  console.log(`OK ${embeddingModel} embeddings ${values.length} dimensions`);
}

async function checkGeminiGeneration() {
  if (!geminiApiKey || !geminiGenerationModel) {
    throw new Error("Gemini generation env tidak lengkap.");
  }
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const generation = await ai.models.generateContent({
    model: geminiGenerationModel,
    contents: 'Return the JSON object {"status":"ok"}.',
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema,
    },
  });
  if (!generation.text?.includes("ok")) {
    throw new Error("Structured generation returned an unexpected response.");
  }
  console.log(`OK ${geminiGenerationModel} structured output`);
}

async function checkGroq() {
  if (!groqApiKey || !groqGenerationModel) {
    throw new Error("Groq env tidak lengkap.");
  }
  const modelsResponse = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${groqApiKey}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!modelsResponse.ok) {
    throw new Error(`Groq ${modelsResponse.status}: ${(await modelsResponse.text()).slice(0, 300)}`);
  }
  const models = ((await modelsResponse.json()) as { data?: { id: string }[] }).data ?? [];
  const ids = models.map((model) => model.id);
  console.log(`OK Groq auth, ${ids.length} model tersedia`);
  for (const model of [groqGenerationModel, groqModerationModel]) {
    if (!model) continue;
    if (!ids.includes(model)) {
      throw new Error(`Model Groq tidak tersedia: ${model}`);
    }
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: groqGenerationModel,
      messages: [
        { role: "system", content: "Return only JSON matching the schema." },
        { role: "user", content: 'Return the JSON object {"status":"ok"}.' },
      ],
      temperature: 0.2,
      max_completion_tokens: 256,
      response_format: {
        type: "json_schema",
        json_schema: { name: "panacea_output", strict: true, schema: jsonSchema },
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Groq ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content?.includes("ok")) {
    throw new Error(`Structured output Groq tidak terduga: ${content ?? "(kosong)"}`);
  }
  console.log(`OK ${groqGenerationModel} structured output`);
}

async function main() {
  await checkEmbeddings();
  if (provider === "groq") {
    await checkGroq();
  } else {
    await checkGeminiGeneration();
  }
  console.log(`Provider aktif: ${provider}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
