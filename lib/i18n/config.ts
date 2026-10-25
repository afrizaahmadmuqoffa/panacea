export const locales = ["id", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "id";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function createTr(locale: Locale) {
  return (id: string, en: string) => (locale === "id" ? id : en);
}

export type Tr = ReturnType<typeof createTr>;
