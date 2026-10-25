"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { PathHistory } from "@/components/panacea/path-history";
import type { Locale } from "@/lib/i18n/config";
import { I18nProvider } from "./i18n-provider";
import { PanaceaProvider } from "./panacea-provider";

export function AppProviders({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <I18nProvider locale={locale}>
      <PanaceaProvider>
        <PathHistory />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "14px",
              border: "1px solid #e8e2d5",
              background: "#fffefa",
              color: "#3d493f",
              fontFamily: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif",
            },
          }}
        />
      </PanaceaProvider>
    </I18nProvider>
  );
}
