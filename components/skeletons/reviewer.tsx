import {
  Skeleton,
  SkeletonAvatar,
  SkeletonField,
  SkeletonFilterBar,
  SkeletonListCards,
  SkeletonMemberHero,
  SkeletonPageHeader,
  SkeletonRoot,
  SkeletonStatGrid,
} from "./primitives";
import { AdminTablePageSkeleton } from "./admin";

export function ReviewerDashboardSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonMemberHero mascot />
      <SkeletonStatGrid count={3} columns="sm:grid-cols-3" />
      <div className="grid items-start gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        {[0, 1].map((panel) => (
          <section key={panel} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow">
            <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#e8e2d5] px-5 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <ul className="divide-y divide-[#e8e2d5]">
              {Array.from({ length: 4 }, (_, index) => (
                <li key={index} className="flex items-start gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-2.5 w-full" />
                    <Skeleton className="mt-1.5 h-2.5 w-2/3" />
                    <Skeleton className="mt-1.5 h-2 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SkeletonRoot>
  );
}

export function TaskListSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonPageHeader actions={false} />
      <SkeletonFilterBar columns="md:grid-cols-[1fr_auto_auto]" inputs={3} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <SkeletonListCards cards={4} />
    </SkeletonRoot>
  );
}

export function ReviewCaseSkeleton() {
  return (
    <SkeletonRoot>
      <Skeleton className="h-3 w-40" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-8 w-full max-w-xl rounded-[10px]" />
          <Skeleton className="mt-2 h-2.5 w-40" />
        </div>
        <Skeleton className="h-6 w-40 rounded-full" />
      </div>
      <div className="space-y-5">
        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
          <Skeleton className="h-4 w-32" />
          <div className="mt-3 rounded-md border border-[#eae5d9] bg-[#fffdf8] p-3.5">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="mt-2 h-2.5 w-full" />
            <Skeleton className="mt-1.5 h-2.5 w-4/5" />
            <Skeleton className="mt-1.5 h-2.5 w-2/3" />
          </div>
          <div className="mt-3 rounded-md border border-[#eae5d9] bg-[#fffdf8] p-3.5">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="mt-2 h-2.5 w-full" />
            <Skeleton className="mt-1.5 h-2.5 w-4/5" />
          </div>
          <div className="mt-3 rounded-md border border-sage-300 bg-sage-100 p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-2.5 w-40" />
            </div>
            <Skeleton className="mt-2 h-5 w-20 rounded-full" />
            <Skeleton className="mt-2 h-2.5 w-full" />
            <Skeleton className="mt-1.5 h-2.5 w-3/4" />
          </div>
        </section>

        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 space-y-4">
            <SkeletonField />
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-56" />
              <Skeleton className="h-28 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-52" />
              <Skeleton className="h-28 w-full rounded-md" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SkeletonField />
              <SkeletonField />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SkeletonField />
              <SkeletonField />
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-start gap-3 rounded-md border border-border-soft bg-cream-50 p-3">
                <Skeleton className="mt-0.5 size-4 shrink-0 rounded-[4px]" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-2.5 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-border-soft bg-cream-50 p-4">
            <Skeleton className="h-2.5 w-48" />
            <div className="ml-auto flex gap-2">
              <Skeleton className="h-8 w-40 rounded-[12px]" />
              <Skeleton className="h-8 w-28 rounded-[12px]" />
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-2 h-2.5 w-full max-w-xl" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-28 w-full rounded-md" />
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-md border border-sage-300 bg-sage-100 p-3.5">
            <Skeleton className="mt-0.5 size-4 shrink-0 rounded-[4px]" />
            <Skeleton className="h-2.5 w-full max-w-lg" />
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Skeleton className="h-11 w-24 rounded-[15px]" />
          <Skeleton className="h-11 w-48 rounded-[15px]" />
        </div>
      </div>
    </SkeletonRoot>
  );
}
/** Knowledge base list, reviewer side. */
export function ReviewerKnowledgeBaseSkeleton() {
  return <AdminTablePageSkeleton columns={5} rows={6} filters={false} note={false} mobileCards />;
}

export function KnowledgeBaseDetailSkeleton() {
  return (
    <SkeletonRoot>
      <Skeleton className="h-2.5 w-40" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-6 w-full max-w-2xl rounded-[10px]" />
          <Skeleton className="mt-2 h-2.5 w-56" />
        </div>
        <Skeleton className="h-10 w-32 rounded-[14px]" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="space-y-4 rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow sm:p-6">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-[18px] border border-[#e8e2d5] p-4">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-5/6" />
                <Skeleton className="h-2.5 w-3/4" />
              </div>
            </div>
          ))}
        </section>
        <aside className="space-y-4">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
              <Skeleton className="h-3.5 w-32" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="flex justify-between gap-3">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </SkeletonRoot>
  );
}

export function SuggestionListSkeleton() {
  return (
    <SkeletonRoot>
      <SkeletonPageHeader />
      <SkeletonFilterBar columns="md:grid-cols-[1fr_auto_auto]" inputs={3} />
      <div className="hidden w-full overflow-x-auto rounded-lg border border-border-soft bg-white shadow-soft lg:block">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-cream-100">
            <tr>
              {Array.from({ length: 6 }, (_, index) => (
                <th key={index} className="px-4 py-3 text-left">
                  <Skeleton className="h-2.5 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {Array.from({ length: 6 }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: 6 }, (_, column) => (
                  <td key={column} className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      {column === 0 ? <SkeletonAvatar className="size-8" /> : null}
                      <Skeleton className={column === 0 ? "h-2.5 w-32" : "h-2.5 w-20"} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 lg:hidden">
        <SkeletonListCards cards={3} />
      </div>
    </SkeletonRoot>
  );
}

export function SuggestionChunksSkeleton() {
  return (
    <SkeletonRoot>
      <Skeleton className="h-2.5 w-40" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-6 w-full max-w-2xl rounded-[10px]" />
          <Skeleton className="mt-2 h-2.5 w-56" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-28 rounded-[14px]" />
          <Skeleton className="h-10 w-32 rounded-[14px]" />
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <section key={index} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-5/6" />
                <Skeleton className="h-2.5 w-3/4" />
              </div>
            </section>
          ))}
        </div>
        <aside className="space-y-4">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow">
              <Skeleton className="h-3.5 w-32" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="flex justify-between gap-3">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </SkeletonRoot>
  );
}
