import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { createTr, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";
import type { Localized } from "@/lib/types";

type Section = {
  id: string;
  title: Localized;
  paragraphs: Localized[];
  list?: Localized[];
};

export function LegalPage({
  locale,
  title,
  intro,
  updatedAt,
  sections,
}: {
  locale: Locale;
  title: Localized;
  intro: Localized;
  updatedAt: string;
  sections: Section[];
}) {
  const tr = createTr(locale);
  return (
    <div className="bg-cream-50">
      <header className="border-b border-cream-200 bg-cream-100">
        <div className="container-article py-10 sm:py-14">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-bark-500 transition hover:text-sage-700"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {tr("Kembali ke beranda", "Back to home")}
          </Link>
          <div className="mt-5 flex items-center gap-2 text-xs font-bold text-sage-700">
            <FileText className="size-4" aria-hidden="true" />
            {tr("Dokumen legal", "Legal document")}
          </div>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-bark-900 sm:text-4xl">
            {title[locale]}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bark-700">{intro[locale]}</p>
          <p className="mt-4 text-xs font-semibold text-bark-500">
            {tr("Terakhir diperbarui", "Last updated")}: {formatDate(updatedAt, locale)}
          </p>
        </div>
      </header>

      <div className="container-article grid gap-10 py-10 lg:grid-cols-[220px_1fr] lg:py-14">
        <aside className="hidden lg:block">
          <nav aria-label={tr("Daftar isi", "Table of contents")} className="sticky top-24">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-bark-500">
              {tr("Daftar isi", "Contents")}
            </p>
            <ol className="mt-3 space-y-2">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-2 text-xs font-semibold leading-snug text-bark-700 transition hover:text-sage-700"
                  >
                    <span className="text-bark-500">{String(index + 1).padStart(2, "0")}</span>
                    {section.title[locale]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="max-w-[760px] space-y-9">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-heading text-xl font-extrabold text-bark-900">
                {index + 1}. {section.title[locale]}
              </h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className="mt-3 text-sm leading-relaxed text-bark-700">
                  {paragraph[locale]}
                </p>
              ))}
              {section.list ? (
                <ul className="mt-3 space-y-2">
                  {section.list.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex gap-2 text-sm leading-relaxed text-bark-700">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sage-600" aria-hidden="true" />
                      {item[locale]}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
