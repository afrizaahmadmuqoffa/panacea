"use client";

import { ArrowUpRight, BookOpen, ChevronDown, FileText } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import type { EvidenceRef } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EvidenceList({
  evidence,
  compact,
}: {
  evidence: EvidenceRef[];
  compact?: boolean;
}) {
  const { locale, tr } = useI18n();
  return (
    <ul className={cn("space-y-3", compact && "space-y-2")}>
      {evidence.map((item) => (
        <li key={item.id} className="overflow-hidden rounded-lg border border-border-soft bg-white shadow-soft">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-sky-100 text-[#526d79]">
                {item.sourceType === "kb" ? (
                  <BookOpen className="size-4" aria-hidden="true" />
                ) : (
                  <FileText className="size-4" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold leading-snug text-bark-900">{item.title}</span>
                <span className="mt-1 block truncate text-xs text-bark-500">
                  {item.publisher} · {item.year}
                  {item.identifier ? ` · ${item.identifier}` : ""}
                </span>
              </span>
              <Badge variant={item.sourceType === "kb" ? "sage" : "sky"} className="shrink-0">
                {item.sourceType === "kb" ? tr("KB internal", "Internal KB") : "Europe PMC"}
              </Badge>
              <ChevronDown
                className="mt-0.5 size-4 shrink-0 text-bark-500 transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="border-t border-cream-200 bg-cream-50/70 px-4 pb-4 pt-3">
              <p className="whitespace-pre-line text-sm leading-relaxed text-bark-700">{item.snippet[locale]}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-bark-500">
                  {tr("Relevansi", "Relevance")}:{" "}
                  {item.relevance === "high" ? tr("tinggi", "high") : item.relevance === "medium" ? tr("sedang", "medium") : tr("rendah", "low")}
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline"
                >
                  {tr("Buka sumber", "Open source")}
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
