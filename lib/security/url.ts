import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
]);

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("ff")
  );
}

function isPrivateAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

export async function assertSafeHttpUrl(input: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("URL tidak valid.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Hanya URL HTTP atau HTTPS yang diizinkan.");
  }
  if (url.username || url.password) {
    throw new Error("URL dengan kredensial tidak diizinkan.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new Error("Port URL tidak diizinkan.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith(".internal") || hostname.endsWith(".local")) {
    throw new Error("Host tidak diizinkan.");
  }

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("Alamat IP privat tidak diizinkan.");
    return url;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0) throw new Error("Host tidak dapat ditemukan.");
  if (addresses.some((item) => isPrivateAddress(item.address))) {
    throw new Error("Host mengarah ke jaringan privat.");
  }

  return url;
}

export async function safeFetch(
  input: string,
  options: { maxBytes: number; timeoutMs: number; maxRedirects?: number },
): Promise<{ response: Response; body: Uint8Array; finalUrl: string }> {
  let current = input;
  const maxRedirects = options.maxRedirects ?? 3;

  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const safeUrl = await assertSafeHttpUrl(current);
    const response = await fetch(safeUrl, {
      redirect: "manual",
      headers: {
        "user-agent": "PANACEA claim checker (+https://panacea.example)",
        accept: "text/html,application/pdf;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(options.timeoutMs),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect tanpa tujuan.");
      current = new URL(location, safeUrl).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error(`Sumber menolak permintaan (${response.status}).`);
    }

    if (!response.body) throw new Error("Sumber tidak mengembalikan isi.");

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > options.maxBytes) {
        await reader.cancel();
        throw new Error("Isi sumber terlalu besar.");
      }
      chunks.push(value);
    }

    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return { response, body, finalUrl: safeUrl.toString() };
  }

  throw new Error("Terlalu banyak redirect.");
}
