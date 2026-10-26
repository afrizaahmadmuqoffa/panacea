"use client";

import { Languages } from "lucide-react";
import { useI18n, useLocaleSwitch } from "@/components/providers/i18n-provider";
import { Select } from "@/components/ui/input";
import { locales, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, tr } = useI18n();
  const switchLocale = useLocaleSwitch();

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Languages
        className="pointer-events-none absolute left-3 size-4 text-bark-500"
        aria-hidden="true"
      />
      <Select
        value={locale}
        onChange={(event) => switchLocale(event.target.value as Locale)}
        aria-label={tr("Pilih bahasa", "Choose language")}
        className="h-11 w-auto min-w-20 pl-9 text-xs font-extrabold uppercase tracking-wide"
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>
    </div>
  );
}