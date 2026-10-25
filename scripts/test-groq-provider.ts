import http from "node:http";
import { groqGenerateJson } from "@/lib/ai/groq";
import { moderationSchema } from "@/lib/ai/schemas";

type Received = { url: string; body: Record<string, unknown> };

const received: Received[] = [];
let mode: "ok" | "reject400" | "rate429" = "ok";
let phaseCalls = 0;

const server = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (chunk) => {
    raw += chunk;
  });
  req.on("end", () => {
    phaseCalls += 1;
    received.push({ url: req.url ?? "", body: JSON.parse(raw) });
    if (mode === "reject400" && phaseCalls === 1) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "unsupported schema keyword" } }));
      return;
    }
    if (mode === "rate429" && phaseCalls === 1) {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "rate limit" } }));
      return;
    }
    const format = (received[received.length - 1].body.response_format as { type: string }).type;
    const content =
      format === "json_schema"
        ? JSON.stringify({ decision: "visible", reasonId: "aman", reasonEn: "safe" })
        : JSON.stringify({ decision: "held", reasonId: "ditahan", reasonEn: "held" });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content } }] }));
  });
});

async function main() {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  process.env.GROQ_BASE_URL = `http://127.0.0.1:${port}/chat/completions`;

  const options = {
    apiKey: "test-key",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    system: "You moderate one forum comment.",
    contents: "Komentar singkat.",
    timeoutMs: 5000,
    maxRetries: 2,
    maxOutputTokens: 512,
  };

  const ok = await groqGenerateJson(moderationSchema, options);
  console.log("strict ok:", JSON.stringify(ok));
  const first = received[0].body;
  console.log("response_format:", (first.response_format as { type: string }).type);
  console.log(
    "messages roles:",
    (first.messages as { role: string }[]).map((m) => m.role).join(","),
  );
  console.log("schema required:", JSON.stringify(
    ((first.response_format as { json_schema: { schema: { required: string[] } } }).json_schema.schema).required,
  ));

  mode = "ok";
  phaseCalls = 0;
  const imageCall = await groqGenerateJson(moderationSchema, {
    ...options,
    contents: [
      {
        role: "user",
        parts: [
          { text: "Baca klaim pada gambar." },
          { inlineData: { mimeType: "image/webp", data: "AAAB" } },
        ],
      },
    ],
  });
  console.log("vision ok:", JSON.stringify(imageCall));
  const imageBody = received[received.length - 1].body;
  const imageParts = (imageBody.messages as { content: { type: string; image_url?: { url: string } }[] }[])[1].content;
  console.log(
    "image part:",
    imageParts.map((part) => part.type).join(","),
    imageParts[1]?.image_url?.url?.slice(0, 24),
  );

  mode = "reject400";
  phaseCalls = 0;
  const fallback = await groqGenerateJson(moderationSchema, options);
  console.log("fallback ok:", JSON.stringify(fallback));
  console.log(
    "second call format:",
    (received[received.length - 1].body.response_format as { type: string }).type,
  );
  console.log(
    "fallback system contains schema:",
    String(
      (received[received.length - 1].body.messages as { content: string }[])[0].content,
    ).includes("additionalProperties"),
  );

  mode = "rate429";
  phaseCalls = 0;
  const before = received.length;
  const retried = await groqGenerateJson(moderationSchema, options);
  console.log("retry ok:", JSON.stringify(retried), "calls in phase:", received.length - before);

  server.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
