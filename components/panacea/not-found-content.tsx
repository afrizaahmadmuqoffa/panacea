"use client";

import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";

export function NotFoundContent() {
  const { locale, tr } = useI18n();
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-sage-100 text-sage-700">
        <CircleAlert className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 font-heading text-3xl font-extrabold text-bark-900 sm:text-4xl">
        {tr("404 Halaman tidak ditemukan", "404 Page not found")}
      </h1>
      <div className="mt-6">
        <Link href={`/${locale}`} className={buttonVariants()}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          {tr("Kembali ke beranda", "Back to home")}
        </Link>
      </div>
    </div>
  );
}
