"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createTr, type Locale, type Tr } from "@/lib/i18n/config";

type I18nContextValue = {
  locale: Locale;
  tr: Tr;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, tr: createTr(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
