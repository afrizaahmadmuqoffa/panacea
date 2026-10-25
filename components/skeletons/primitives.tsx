import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-[10px]", className)} aria-hidden="true" />;
}

const blockWidths = ["w-full", "w-11/12", "w-4/5", "w-2/3"];

export function SkeletonText({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-2.5", blockWidths[index % blockWidths.length])} />
      ))}
    </div>
  );
}

export function SkeletonPill({ className }: { className?: string }) {
  return <Skeleton className={cn("h-6 w-24 rounded-full", className)} />;
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn("size-9 shrink-0 rounded-full", className)} />;
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-32 rounded-[14px]", className)} />;
}

export function SkeletonField({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="h-12 w-full rounded-md" />
    </div>
  );
}

/** Mirrors components/ui/page-header.tsx */
export function SkeletonPageHeader({ actions = true }: { actions?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" aria-hidden="true">
      <div className="w-full max-w-xl">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="mt-2.5 h-9 w-full max-w-md rounded-[12px]" />
        <div className="mt-2.5 space-y-1.5">
          <Skeleton className="h-2.5 w-full max-w-lg" />
          <Skeleton className="h-2.5 w-2/3 max-w-sm" />
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">
          <SkeletonButton className="w-24" />
        </div>
      ) : null}
    </div>
  );
}

/** Mirrors components/member/member-page-header.tsx */
export function SkeletonMemberPageHeader({ actions = true }: { actions?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" aria-hidden="true">
      <div className="flex min-w-0 items-start gap-3">
        <Skeleton className="mt-0.5 size-11 shrink-0 rounded-[15px]" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-8 w-full max-w-md rounded-[10px]" />
          <div className="mt-2 space-y-1.5">
            <Skeleton className="h-2.5 w-full max-w-xl" />
            <Skeleton className="h-2.5 w-3/4 max-w-sm" />
          </div>
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">
          <SkeletonButton className="w-40" />
        </div>
      ) : null}
    </div>
  );
}

/** Mirrors components/member/member-hero.tsx */
export function SkeletonMemberHero({ mascot = true }: { mascot?: boolean }) {
  return (
    <section
      className="relative isolate overflow-hidden rounded-[28px] border border-sage-200 bg-[linear-gradient(110deg,#eaf3e2_0%,#eff4e5_53%,#f9efd9_100%)] p-5 sm:p-7 lg:p-8"
      aria-hidden="true"
    >
      <div className={cn("relative grid items-center gap-5", mascot && "lg:grid-cols-[1.2fr_0.8fr]")}>
        <div className="min-w-0">
          <Skeleton className="h-8 w-32 rounded-full" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-9 w-full max-w-lg rounded-[12px]" />
            <Skeleton className="h-9 w-3/5 max-w-sm rounded-[12px]" />
          </div>
          <div className="mt-3 space-y-1.5">
            <Skeleton className="h-2.5 w-full max-w-md" />
            <Skeleton className="h-2.5 w-4/5 max-w-sm" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <SkeletonButton className="w-36" />
            <SkeletonButton className="w-28" />
          </div>
        </div>
        {mascot ? (
          <div className="relative hidden w-full max-w-[260px] sm:block lg:max-w-[300px]">
            <Skeleton className="aspect-[4/3] w-full rounded-[24px]" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Mirrors components/ui/stat-tile.tsx inside the usual stat grid. */
export function SkeletonStatGrid({
  count = 4,
  columns = "sm:grid-cols-2 xl:grid-cols-4",
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <section className={cn("grid gap-3", columns)} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="mt-0.5 h-3 w-24" />
            <Skeleton className="size-10 shrink-0 rounded-[13px]" />
          </div>
          <Skeleton className="mt-3 h-8 w-20 rounded-[10px]" />
          <Skeleton className="mt-2 h-2.5 w-28" />
        </div>
      ))}
    </section>
  );
}

/** Mirrors components/member/cozy-panel.tsx (CozyPanel + CozyPanelHeader). */
export function SkeletonPanel({
  rows = 3,
  header = true,
  accent = false,
  padded = true,
  className,
}: {
  rows?: number;
  header?: boolean;
  accent?: boolean;
  padded?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow",
        className,
      )}
      aria-hidden="true"
    >
      {accent ? <Skeleton className="absolute inset-x-5 top-0 h-[3px] rounded-b-[5px]" /> : null}
      {header ? (
        <div className="flex items-start justify-between gap-3 border-b border-dashed border-[#e8e2d5] px-5 py-4">
          <div className="flex min-w-0 items-start gap-2.5">
            <Skeleton className="size-9 shrink-0 rounded-[12px]" />
            <div className="min-w-0">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-1.5 h-2.5 w-48" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </div>
      ) : null}
      <ul className={cn("divide-y divide-[#e8e2d5]", padded && !header && "p-5 sm:p-6")}>
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="flex items-start gap-3 px-5 py-4">
            <Skeleton className="size-9 shrink-0 rounded-[12px]" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-2.5 w-2/3" />
              <Skeleton className="mt-1.5 h-2.5 w-full" />
              <Skeleton className="mt-1.5 h-2 w-20" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Mirrors the rounded-[22px] p-4 filter card with an inline grid of controls. */
export function SkeletonFilterBar({
  columns = "md:grid-cols-[1fr_auto_auto]",
  inputs = 3,
}: {
  columns?: string;
  inputs?: number;
}) {
  return (
    <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow" aria-hidden="true">
      <div className={cn("grid gap-3", columns)}>
        {Array.from({ length: inputs }, (_, index) => (
          <Skeleton
            key={index}
            className={cn("h-12 w-full rounded-md", index > 0 && "md:w-48")}
          />
        ))}
      </div>
    </div>
  );
}

/** Mirrors components/ui/table.tsx with its mobile card fallback. */
export function SkeletonTable({
  rows = 6,
  columns = 5,
  mobileCards = true,
}: {
  rows?: number;
  columns?: number;
  mobileCards?: boolean;
}) {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="hidden w-full overflow-x-auto rounded-lg border border-border-soft bg-white shadow-soft lg:block">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-cream-100">
            <tr>
              {Array.from({ length: columns }, (_, index) => (
                <th key={index} className="px-4 py-3 text-left">
                  <Skeleton className="h-2.5 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }, (_, columnIndex) => (
                  <td key={columnIndex} className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      {columnIndex === 0 ? <SkeletonAvatar className="size-8" /> : null}
                      <Skeleton
                        className={cn(
                          "h-2.5",
                          columnIndex === 0 ? "w-32" : columnIndex === columns - 1 ? "w-16" : "w-24",
                        )}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mobileCards ? (
        <div className="grid gap-3 lg:hidden">
          {Array.from({ length: Math.min(rows, 4) }, (_, index) => (
            <article key={index} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow">
              <div className="flex items-start gap-3">
                <SkeletonAvatar className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="mt-1.5 h-2.5 w-1/2" />
                  <div className="mt-2 flex gap-1.5">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Mirrors the rounded-[22px] cards used in badge / category / moderation grids. */
export function SkeletonCardGrid({
  cards = 6,
  columns = "sm:grid-cols-2 xl:grid-cols-3",
  height = "h-36",
}: {
  cards?: number;
  columns?: string;
  height?: string;
}) {
  return (
    <div className={cn("grid gap-4", columns)} aria-hidden="true">
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-3 w-2/3" />
          <Skeleton className="mt-1.5 h-2.5 w-full" />
          <Skeleton className={cn("mt-3 w-full rounded-md", height)} />
        </div>
      ))}
    </div>
  );
}

/** Mirrors the stacked content cards used by forum threads, task lists and suggestions. */
export function SkeletonListCards({
  cards = 4,
  columns = "",
  className,
}: {
  cards?: number;
  columns?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", columns, className)} aria-hidden="true">
      {Array.from({ length: cards }, (_, index) => (
        <article key={index} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="ml-auto h-2.5 w-24" />
          </div>
          <Skeleton className="mt-3 h-4 w-3/4" />
          <div className="mt-2 space-y-1.5">
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-5/6" />
          </div>
          <div className="mt-3 flex items-center gap-3 border-t border-dashed border-[#e8e2d5] pt-3">
            <SkeletonAvatar className="size-6" />
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="ml-auto h-2.5 w-20" />
          </div>
        </article>
      ))}
    </div>
  );
}

/** Mirrors the rounded-[22px] section cards used inside forms. */
export function SkeletonFormSection({
  fields = 2,
  columns = "sm:grid-cols-2",
  className,
}: {
  fields?: number;
  columns?: string;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-6", className)}
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-40" />
      <div className={cn("mt-4 grid gap-4", columns)}>
        {Array.from({ length: fields }, (_, index) => (
          <SkeletonField key={index} />
        ))}
      </div>
    </section>
  );
}

/** Mirrors the main column + aside layout used by detail pages. */
export function SkeletonDetailLayout({
  columns = "xl:grid-cols-[1.35fr_0.65fr]",
  blocks = 3,
  aside = 3,
}: {
  columns?: string;
  blocks?: number;
  aside?: number;
}) {
  return (
    <div className={cn("grid gap-5", columns)} aria-hidden="true">
      <div className="space-y-5">
        {Array.from({ length: blocks }, (_, index) => (
          <SkeletonFormSection key={index} fields={0} />
        ))}
      </div>
      <aside className="space-y-4">
        {Array.from({ length: aside }, (_, index) => (
          <div key={index} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
            <Skeleton className="h-3.5 w-28" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-5/6" />
              <Skeleton className="h-2.5 w-3/4" />
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}

/** Shared status wrapper so every skeleton announces a busy page. */
export function SkeletonRoot({
  children,
  className,
  label = "Memuat halaman / Loading page",
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      className={cn("space-y-6", className)}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
