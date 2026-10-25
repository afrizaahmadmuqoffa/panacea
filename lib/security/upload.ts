import "server-only";
import sharp from "sharp";
import { getServerEnv } from "@/lib/env";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PDF_TYPE = "application/pdf";

export type ValidatedImage = {
  buffer: Uint8Array;
  mime: "image/webp";
  extension: "webp";
  width: number;
  height: number;
};

export async function validateImage(file: File): Promise<ValidatedImage> {
  const env = getServerEnv();
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("Gunakan gambar JPG, PNG, atau WEBP.");
  }
  if (file.size > env.UPLOAD_MAX_IMAGE_BYTES) {
    throw new Error("Ukuran gambar terlalu besar.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const image = sharp(input, { failOn: "error" }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Gambar tidak dapat dibaca.");
  }
  if (metadata.width > 12000 || metadata.height > 12000) {
    throw new Error("Dimensi gambar terlalu besar.");
  }

  const buffer = await image.webp({ quality: 82 }).toBuffer();
  return {
    buffer: new Uint8Array(buffer),
    mime: "image/webp",
    extension: "webp",
    width: metadata.width,
    height: metadata.height,
  };
}

export async function readPdf(file: File): Promise<Uint8Array> {
  const env = getServerEnv();
  if (file.type !== PDF_TYPE) {
    throw new Error("Lampiran harus berupa PDF.");
  }
  if (file.size > env.UPLOAD_MAX_IMAGE_BYTES) {
    throw new Error("Ukuran lampiran terlalu besar.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  // file.type berasal dari browser dan bisa dipalsukan; cek magic byte PDF.
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
    throw new Error("Berkas bukan PDF yang valid.");
  }
  return bytes;
}
