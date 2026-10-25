/**
 * Batas yang dipakai bersama oleh UI dan server supaya angka tidak berbeda
 * antara teks yang tampil dan validasi di backend.
 */

/** Panjang maksimum teks klaim yang boleh dikirim anggota. */
export const MAX_CLAIM_TEXT_LENGTH = 4000;

/** Batas unggahan gambar klaim dan lampiran laporan. */
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Batas unggahan dokumen knowledge base. */
export const MAX_KB_DOCUMENT_BYTES = 15 * 1024 * 1024;
