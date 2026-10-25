import {
  Skeleton,
  SkeletonCardGrid,
  SkeletonDetailLayout,
  SkeletonField,
  SkeletonFilterBar,
  SkeletonFormSection,
  SkeletonListCards,
  SkeletonMemberHero,
  SkeletonPageHeader,
  SkeletonPanel,
  SkeletonRoot,
  SkeletonStatGrid,
  SkeletonTable,
} from "./primitives";

export function AdminDashboardSkeleton() {
  return (
    <SkeletonRoot className="space-y-5">
      <SkeletonMemberHero mascot={false} />
      <SkeletonStatGrid count={4} columns="sm:grid-cols-2 xl:grid-cols-4" />
      <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow">
        <div className="flex items-center justify-between gap-3 border-b border-[#e8e2d5] px-5 py-3.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <ul className="grid gap-2.5 p-5 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="rounded-md border border-[#e8e2d5] p-3">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="mt-2 h-4 w-16" />
            </li>
          ))}
        </ul>
      </section>
      <div className="grid gap-5 lg:grid-cols-2 lg:auto-rows-fr">
        {Array.from({ length: 4 }, (_, index) => (
          <section key={index} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow">
            <div className="flex items-center justify-between gap-3 border-b border-[#e8e2d5] px-5 py-3.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <ul className="divide-y divide-[#e8e2d5]">
              {Array.from({ length: 4 }, (_, row) => (
                <li key={row} className="flex items-start gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-2.5 w-full" />
                    <Skeleton className="mt-1.5 h-2 w-2/3" />
                  </div>
                  <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow">
        <div className="flex items-center justify-between gap-3 border-b border-[#e8e2d5] px-5 py-3.5">
          <div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1.5 h-2.5 w-48" />
          </div>
          <Skeleton className="h-2.5 w-24" />
        </div>
        <SkeletonTable rows={5} columns={5} mobileCards={false} />
      </section>
    </SkeletonRoot>
  );
}

/** PageHeader + optional filter card + data table, the shape shared by most admin lists. */
export function AdminTablePageSkeleton({
  columns = 6,
  rows = 6,
  filters = true,
  filterColumns = "md:grid-cols-[1fr_auto_auto]",
  filterInputs = 3,
  mobileCards = true,
  note = true,
  stats = 0,
}: {
  columns?: number;
  rows?: number;
  filters?: boolean;
  filterColumns?: string;
  filterInputs?: number;
  mobileCards?: boolean;
  note?: boolean;
  stats?: number;
}) {
  return (
    <SkeletonRoot>
      <SkeletonPageHeader />
      {stats > 0 ? <SkeletonStatGrid count={stats} columns="sm:grid-cols-2" /> : null}
      {filters ? <SkeletonFilterBar columns={filterColumns} inputs={filterInputs} /> : null}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <SkeletonTable rows={rows} columns={columns} mobileCards={mobileCards} />
      {note ? (
        <div className="flex gap-2.5 rounded-lg border border-cream-200 bg-cream-100 p-4">
          <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-4/5" />
          </div>
        </div>
      ) : null}
    </SkeletonRoot>
  );
}

export function AdminBadgesSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonPageHeader />
      <div className="flex gap-2.5 rounded-lg border border-butter-300 bg-[#fff7de] p-4">
        <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-2/3" />
        </div>
      </div>
      <SkeletonCardGrid cards={6} columns="md:grid-cols-2 xl:grid-cols-3" height="h-12" />
    </SkeletonRoot>
  );
}

export function AdminModerationSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonPageHeader />
      <div className="space-y-4">
        <Skeleton className="h-[52px] w-full max-w-md rounded-full" />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <article key={index} className="rounded-[22px] border border-rose-100 bg-[#fffdf8] p-4 cozy-shadow">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="ml-auto h-2.5 w-24" />
              </div>
              <Skeleton className="mt-2 h-2.5 w-28" />
              <Skeleton className="mt-2 h-16 w-full rounded-md" />
              <Skeleton className="mt-2 h-10 w-full rounded-md" />
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-cream-200 pt-3">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-cream-200 bg-cream-100 p-4">
        <Skeleton className="h-2.5 w-full" />
      </div>
    </SkeletonRoot>
  );
}

export function AdminSettingsSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonPageHeader />
      <div className="space-y-5">
        <SkeletonFormSection fields={2} columns="sm:grid-cols-2" />
        <SkeletonFormSection fields={3} columns="sm:grid-cols-3" />
        <SkeletonFormSection fields={2} columns="sm:grid-cols-2" />
      </div>
    </SkeletonRoot>
  );
}

export function SourceChunksSkeleton() {
  return (
    <SkeletonRoot>
      <Skeleton className="h-2.5 w-40" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-6 w-full max-w-2xl rounded-[10px]" />
          <Skeleton className="mt-2 h-2.5 w-56" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-32 rounded-[14px]" />
          <Skeleton className="h-10 w-36 rounded-[14px]" />
        </div>
      </div>
      <SkeletonDetailLayout blocks={2} aside={3} />
    </SkeletonRoot>
  );
}

export function ArticleEditorSkeleton() {
  return (
    <SkeletonRoot>
      <Skeleton className="h-2.5 w-40" />
      <SkeletonPageHeader />
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonField key={index} />
            ))}
          </div>
          <div className="mt-4">
            <SkeletonField />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-2.5 w-full max-w-md" />
              <Skeleton className="h-2.5 w-2/3 max-w-sm" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-[14px]" />
              <Skeleton className="h-10 w-28 rounded-[14px]" />
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
              <Skeleton className="h-3.5 w-32" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 4 }, (_, row) => (
                  <Skeleton key={row} className="h-2.5 w-full" />
                ))}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </SkeletonRoot>
  );
}

export function AdminSuggestionsSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonPageHeader />
      <SkeletonFilterBar columns="md:grid-cols-[1fr_auto]" inputs={2} />
      <Skeleton className="h-3.5 w-24" />
      <SkeletonListCards cards={4} />
    </SkeletonRoot>
  );
}

/** Used by admin pages that pair a member-style hero with two panels. */
export function AdminPanelsSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonMemberHero />
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <SkeletonPanel rows={4} />
        <SkeletonPanel rows={3} />
      </div>
    </SkeletonRoot>
  );
}
