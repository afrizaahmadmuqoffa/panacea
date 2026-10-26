"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
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

/** Navigates to the same path with the first URL segment swapped for another locale. */
export function useLocaleSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  return useCallback(
    (next: Locale) => {
      const segments = pathname.split("/");
      segments[1] = next;
      router.push(`${segments.join("/") || `/${next}`}${window.location.hash}`);
    },
    [pathname, router],
  );
}
