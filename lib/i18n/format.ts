import type { Locale } from "./config";

export function formatDate(value: string | Date, locale: Locale, withTime = false) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-GB").format(value);
}

export function formatRelative(value: string, locale: Locale) {
  const date = new Date(value);
  const now = new Date();
  const diff = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat(locale === "id" ? "id" : "en", { numeric: "auto" });
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds || unit === "minute") {
      return rtf.format(Math.round(diff / seconds), unit);
    }
  }
  return rtf.format(diff, "second");
}
