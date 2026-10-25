import "server-only";
import * as cheerio from "cheerio";
import { extractText } from "unpdf";
import { safeFetch } from "@/lib/security/url";

export type ExtractedArticle = {
  title: string;
  text: string;
  url: string;
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const { response, body, finalUrl } = await safeFetch(url, {
    maxBytes: 2 * 1024 * 1024,
    timeoutMs: 12000,
  });
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/pdf")) {
    const { text } = await extractText(body, { mergePages: true });
    const normalized = normalizeText(text);
    if (normalized.length < 40) throw new Error("Teks PDF terlalu pendek untuk diperiksa.");
    return { title: "Dokumen PDF", text: normalized.slice(0, 20000), url: finalUrl };
  }

  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    throw new Error("Jenis sumber tidak didukung.");
  }

  const html = new TextDecoder().decode(body);
  if (contentType.includes("text/plain")) {
    return {
      title: "Teks dari tautan",
      text: normalizeText(html).slice(0, 20000),
      url: finalUrl,
    };
  }

  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, svg, nav, header, footer, aside, form").remove();
  const title = normalizeText($("h1").first().text() || $("title").first().text() || "Artikel");
  const container = $("article").first().length
    ? $("article").first()
    : $("main").first().length
      ? $("main").first()
      : $("body");
  const text = normalizeText(container.text());
  if (text.length < 80) {
    throw new Error("Teks artikel tidak dapat dibaca.");
  }
  return { title, text: text.slice(0, 20000), url: finalUrl };
}
