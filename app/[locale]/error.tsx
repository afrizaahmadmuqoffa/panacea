"use client";

import Link from "next/link";
import { CircleAlert, RefreshCw } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button, buttonVariants } from "@/components/ui/button";

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale, tr } = useI18n();
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-rose-100 text-rose-700">
        <CircleAlert className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-4 font-heading text-3xl font-extrabold text-bark-900">
        {tr("Ada masalah internal yang harus diperbaiki.", "There is an internal issue that needs to be fixed.")}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-bark-700">
        {tr(
          "Muat ulang halaman untuk mencoba lagi. Tidak ada data pribadi yang ditampilkan pada pesan kesalahan ini.",
          "Reload the page to try again. No personal data is displayed in this error message.",
        )}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <RefreshCw className="size-4" aria-hidden="true" />
          {tr("Coba lagi", "Try again")}
        </Button>
        <Link href={`/${locale}`} className={buttonVariants({ variant: "secondary" })}>
          {tr("Kembali ke beranda", "Back to home")}
        </Link>
      </div>
    </div>
  );
}
