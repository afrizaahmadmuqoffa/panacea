import "server-only";

export function redactPii(value: string) {
  return value
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/\b(?:\+?62|0)8\d{7,12}\b/g, "[phone]")
    .replace(/\b\d{16}\b/g, "[number]")
    .replace(/\b(?:NIK|KTP|MRN|rekam medis)\s*[:#-]?\s*\w+/gi, "[id]");
}
