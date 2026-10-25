import {
  Skeleton,
  SkeletonAvatar,
  SkeletonFilterBar,
  SkeletonListCards,
  SkeletonMemberHero,
  SkeletonMemberPageHeader,
  SkeletonPanel,
  SkeletonRoot,
  SkeletonStatGrid,
  SkeletonTable,
} from "./primitives";

export function DashboardSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonMemberHero mascot />
      <SkeletonStatGrid count={4} columns="sm:grid-cols-2 xl:grid-cols-4" />
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <SkeletonPanel rows={4} />
        <SkeletonPanel rows={3} />
      </div>
      <SkeletonPanel rows={3} />
    </SkeletonRoot>
  );
}

export function ClaimComposerSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonMemberPageHeader actions={false} />
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow sm:p-6">
          <Skeleton className="h-[52px] w-full rounded-full sm:w-72" />
          <div className="mt-5 space-y-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-44 w-full rounded-lg" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
          <Skeleton className="mt-5 h-12 w-56 rounded-[14px]" />
        </section>

        <aside className="space-y-4 rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
          <Skeleton className="h-4 w-32" />
          <ul className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <li key={index}>
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="mt-1.5 h-2.5 w-3/4" />
                <div className="mt-2 flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </SkeletonRoot>
  );
}

export function ClaimResultSkeleton() {
  return (
    <SkeletonRoot>
      <div className="space-y-2">
        <Skeleton className="h-2.5 w-28" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-[14px]" />
            <Skeleton className="h-9 w-32 rounded-[14px]" />
          </div>
        </div>
      </div>

      <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-7">
        <Skeleton className="h-2.5 w-36" />
        <div className="mt-2.5 space-y-2">
          <Skeleton className="h-6 w-full max-w-3xl rounded-[10px]" />
          <Skeleton className="h-6 w-2/3 max-w-xl rounded-[10px]" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-2.5 w-12" />
        </div>
      </section>

      <section className="rounded-[22px] border border-butter-300 bg-[#fff7de] p-6 cozy-shadow-butter sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Skeleton className="size-14 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="mt-2 h-5 w-3/4" />
            <Skeleton className="mt-2 h-2.5 w-full max-w-lg" />
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <SkeletonListCards cards={3} />
      </div>
    </SkeletonRoot>
  );
}

export function ClaimHistorySkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonMemberPageHeader />
      <SkeletonFilterBar columns="md:grid-cols-[1fr_auto_auto]" inputs={3} />
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <SkeletonTable rows={6} columns={6} />
    </SkeletonRoot>
  );
}

export function BadgeGallerySkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonMemberHero mascot />
      {[0, 1].map((section) => (
        <section key={section} className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-1.5 h-2.5 w-56" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <article
                key={index}
                className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="size-14 shrink-0 rounded-[18px]" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-3.5 w-2/3" />
                <Skeleton className="mt-1.5 h-2.5 w-full" />
                <Skeleton className="mt-1.5 h-2.5 w-5/6" />
                <Skeleton className="mt-4 h-2.5 w-full rounded-full" />
              </article>
            ))}
          </div>
        </section>
      ))}
      <div className="flex items-start gap-2 rounded-[18px] border border-dashed border-[#d9e3d2] bg-[#fffdf8]/70 p-4">
        <Skeleton className="size-4 shrink-0 rounded" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-4/5" />
        </div>
      </div>
    </SkeletonRoot>
  );
}

export function GameLobbySkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonMemberHero mascot />
      <SkeletonStatGrid count={4} columns="sm:grid-cols-2 xl:grid-cols-4" />
      <div className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SkeletonPanel rows={3} />
        <SkeletonPanel rows={2} accent />
      </div>
    </SkeletonRoot>
  );
}

export function GameArenaSkeleton() {
  return (
    <div className="mx-auto max-w-3xl" role="status" aria-busy="true" aria-label="Memuat permainan / Loading game">
      <span className="sr-only">Memuat permainan / Loading game</span>
      <div className="flex items-center justify-between gap-3" aria-hidden="true">
        <Skeleton className="h-2.5 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>
      <div className="mt-5" aria-hidden="true">
        <div className="flex items-center justify-between">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <Skeleton className="mt-2 h-2 w-full rounded-full" />
      </div>
      <div className="mt-6" aria-hidden="true">
        <div className="mx-auto max-w-[490px] overflow-hidden rounded-[26px] border border-[#eae5d9] bg-[#fffdf8] p-6 shadow-[0_15px_34px_rgb(92_113_65/0.1)]">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <div className="mt-5 space-y-2">
            <Skeleton className="h-6 w-full rounded-[10px]" />
            <Skeleton className="h-6 w-4/5 rounded-[10px]" />
            <Skeleton className="h-6 w-2/3 rounded-[10px]" />
          </div>
          <Skeleton className="mt-6 h-3 w-40" />
          <div className="mt-6 flex items-center justify-between gap-3">
            <Skeleton className="h-12 w-32 rounded-[16px]" />
            <Skeleton className="h-12 w-32 rounded-[16px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GameResultSkeleton() {
  return (
    <SkeletonRoot>
      <Skeleton className="h-2.5 w-28" />
      <SkeletonMemberHero mascot />
      <SkeletonStatGrid count={4} columns="sm:grid-cols-2 xl:grid-cols-4" />
      <SkeletonPanel rows={4} />
    </SkeletonRoot>
  );
}

export function LeaderboardSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonMemberHero mascot />
      <div className="space-y-5">
        <Skeleton className="h-[52px] w-64 rounded-full" />
        <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="mt-5 grid grid-cols-3 items-end gap-2 sm:gap-4">
            {["h-32", "h-44", "h-24"].map((height) => (
              <div key={height} className="flex flex-col items-center">
                <Skeleton className="size-12 rounded-full" />
                <Skeleton className="mt-2 h-2.5 w-16" />
                <Skeleton className="mt-1 h-2 w-12" />
                <Skeleton className={`mt-3 w-full rounded-t-[14px] ${height}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow">
          <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#e8e2d5] px-5 py-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <ul className="divide-y divide-[#e8e2d5]">
            {Array.from({ length: 6 }, (_, index) => (
              <li key={index} className="flex items-center gap-3 px-5 py-3">
                <Skeleton className="h-3 w-7" />
                <Skeleton className="size-8 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-2.5 w-32" />
                  <Skeleton className="mt-1.5 h-2 w-20" />
                </div>
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="size-6 rounded-full" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SkeletonRoot>
  );
}

export function ProfileSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonMemberPageHeader actions={false} />
      <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Skeleton className="mx-auto size-20 shrink-0 rounded-full sm:mx-0" />
          <div className="min-w-0 flex-1">
            <Skeleton className="mx-auto h-5 w-40 sm:mx-0" />
            <Skeleton className="mx-auto mt-2 h-2.5 w-48 sm:mx-0" />
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-dashed border-[#e8e2d5] pt-4 sm:w-[260px] sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-2 w-14" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-6">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-6">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-2.5 w-32" />
                  <Skeleton className="mt-1.5 h-2 w-48" />
                </div>
                <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </SkeletonRoot>
  );
}

export function NotificationSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonMemberPageHeader />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-[52px] w-64 rounded-full" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <ul className="space-y-2.5">
        {Array.from({ length: 5 }, (_, index) => (
          <li
            key={index}
            className="flex items-start gap-3 rounded-[18px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow"
          >
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="mt-1.5 h-2.5 w-full" />
              <Skeleton className="mt-1.5 h-2 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </SkeletonRoot>
  );
}

export function ForumListSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonMemberPageHeader />
      <SkeletonFilterBar columns="md:grid-cols-[1fr_auto_auto]" inputs={3} />
      <SkeletonListCards cards={4} />
    </SkeletonRoot>
  );
}

export function ThreadDetailSkeleton() {
  return (
    <SkeletonRoot>
      <Skeleton className="h-2.5 w-32" />
      <article className="rounded-[24px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-7 w-full max-w-xl rounded-[10px]" />
          <Skeleton className="h-7 w-2/3 max-w-md rounded-[10px]" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-dashed border-[#e8e2d5] pb-4">
          <SkeletonAvatar className="size-8" />
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-2.5 w-12" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-4/5" />
        </div>
      </article>
      <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-28 w-full rounded-lg" />
        <Skeleton className="mt-3 h-10 w-32 rounded-[14px]" />
      </section>
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <article key={index} className="rounded-[18px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow">
            <div className="flex items-center gap-2.5">
              <SkeletonAvatar className="size-8" />
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="ml-auto h-2 w-16" />
            </div>
            <div className="mt-3 space-y-1.5">
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-3/4" />
            </div>
          </article>
        ))}
      </div>
    </SkeletonRoot>
  );
}
