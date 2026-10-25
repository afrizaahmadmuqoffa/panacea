import type { Locale } from "@/lib/i18n/config";

/** Pesan dua bahasa untuk server action dan RPC. */
export function message(locale: Locale, id: string, en: string) {
  return locale === "id" ? id : en;
}

/**
 * Balas error server tanpa membocorkan pesan database ke pengguna.
 * Detail asli hanya masuk ke log server.
 */
export function fail(locale: Locale, scope: string, error: unknown): string {
  console.error(`[${scope}]`, error);
  return message(
    locale,
    "Terjadi kesalahan di server. Coba lagi beberapa saat.",
    "The server ran into a problem. Please try again in a moment.",
  );
}
