"use client";

import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type PageItem = number | "ellipsis";

function buildPages(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) items.push("ellipsis");
  for (let value = start; value <= end; value += 1) items.push(value);
  if (end < pageCount - 1) items.push("ellipsis");
  items.push(pageCount);
  return items;
}

export function usePagination(total: number, options?: { pageSize?: number }) {
  const pageSize = options?.pageSize ?? 10;
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;

  return useMemo(
    () => ({ page: current, setPage, pageCount, start, end: start + pageSize, pageSize }),
    [current, pageSize, pageCount, start],
  );
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  tone = "cozy",
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  tone?: "cozy" | "plain";
  className?: string;
}) {
  const { tr } = useI18n();
  if (pageCount <= 1) return null;

  const items = buildPages(page, pageCount);
  const base =
    tone === "cozy"
      ? "grid size-8 place-items-center rounded-[10px] text-xs font-extrabold transition-colors sm:size-10 sm:rounded-[12px] sm:text-sm"
      : "button button-small";

  const go = (next: number) => {
    if (next < 1 || next > pageCount || next === page) return;
    onPageChange(next);
  };

  return (
    <nav
      className={cn("mt-6 flex justify-center", className)}
      aria-label={tr("Navigasi halaman", "Pagination")}
    >
      <div
        className={
          tone === "cozy"
            ? "flex items-center gap-0.5 rounded-[14px] border border-[#eae5d9] bg-[#fffdf8] p-1 cozy-shadow sm:gap-1 sm:rounded-[16px]"
            : "pager"
        }
      >
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label={tr("Halaman sebelumnya", "Previous page")}
          className={cn(base, tone === "cozy" ? "text-bark-700 hover:bg-sage-100 disabled:opacity-40 disabled:hover:bg-transparent" : "pager-arrow")}
        >
          <ChevronLeft className="size-3.5 sm:size-4" aria-hidden="true" />
        </button>

        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className={cn(base, tone === "cozy" ? "text-bark-500" : "pager-gap")}
              aria-hidden="true"
            >
              <Ellipsis className="size-3.5 sm:size-4" />
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => go(item)}
              aria-label={tr(`Halaman ${item}`, `Page ${item}`)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                base,
                tone === "cozy"
                  ? item === page
                    ? "bg-[#65936f] text-white"
                    : "text-bark-700 hover:bg-sage-100"
                  : item === page
                    ? "pager-current"
                    : "pager-number",
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page >= pageCount}
          aria-label={tr("Halaman berikutnya", "Next page")}
          className={cn(base, tone === "cozy" ? "text-bark-700 hover:bg-sage-100 disabled:opacity-40 disabled:hover:bg-transparent" : "pager-arrow")}
        >
          <ChevronRight className="size-3.5 sm:size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
