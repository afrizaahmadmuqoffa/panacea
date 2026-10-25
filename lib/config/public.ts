import { isLocale, type Locale } from "@/lib/i18n/config";

const configuredLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
const defaultLocale: Locale = configuredLocale && isLocale(configuredLocale) ? configuredLocale : "id";

export const publicConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  defaultLocale,
  isProduction: process.env.NODE_ENV === "production",
};
