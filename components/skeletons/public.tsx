import { Skeleton } from "./primitives";

/** Mirrors the verified-feed route: intro + filters + 3-column card grid. */
export function FeedSkeleton() {
  return (
    <div className="panacea-feed" role="status" aria-busy="true" aria-label="Memuat feed / Loading feed">
      <span className="sr-only">Memuat feed / Loading feed</span>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <div className="feed-view">
        <div className="page-intro wrap" aria-hidden="true">
          <div className="intro-copy">
            <Skeleton className="h-[30px] w-44 rounded-full" />
            <div className="mt-[18px] mb-4 space-y-2.5">
              <Skeleton className="h-11 w-full max-w-[420px] rounded-[12px]" />
              <Skeleton className="h-11 w-3/4 max-w-[320px] rounded-[12px]" />
            </div>
            <div className="mb-[22px] space-y-2">
              <Skeleton className="h-3 w-full max-w-[500px]" />
              <Skeleton className="h-3 w-5/6 max-w-[440px]" />
            </div>
            <div className="flex max-w-[450px] items-center gap-[11px] rounded-[16px] border border-[#dce8d4] bg-white/70 px-[15px] py-[11px]">
              <Skeleton className="size-[34px] shrink-0 rounded-[12px]" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-2.5 w-32" />
                <Skeleton className="h-2 w-full max-w-[280px]" />
              </div>
            </div>
          </div>
          <div className="intro-illustration">
            <Skeleton className="absolute inset-x-10 bottom-10 top-10 rounded-[24px]" />
          </div>
        </div>

        <div className="feed-content wrap" aria-hidden="true">
          <div className="feed-heading-row">
            <div>
              <Skeleton className="h-7 w-64 rounded-[10px]" />
              <Skeleton className="mt-2 h-3 w-full max-w-[520px]" />
            </div>
            <div className="flex shrink-0 items-center gap-[10px] rounded-[16px] border border-border-soft bg-[#fffdf7] px-3.5 py-2.5">
              <Skeleton className="size-[34px] rounded-[12px]" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-2 w-20" />
              </div>
            </div>
          </div>

          <div className="filter-panel">
            <Skeleton className="h-[46px] w-full rounded-[13px]" />
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-[46px] w-full rounded-[13px]" />
          </div>

          <div className="verdict-tabs">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-[38px] w-28 shrink-0 rounded-full" />
            ))}
          </div>

          <div className="feed-grid">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="feed-card">
                <Skeleton className="h-6 w-28 rounded-full" />
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-5 w-full rounded-[8px]" />
                  <Skeleton className="h-5 w-4/5 rounded-[8px]" />
                </div>
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-2.5 w-2/3" />
                </div>
                <div className="mt-auto flex items-center gap-2 pt-4">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="ml-auto h-6 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mirrors the feed detail route: article column + 300px reference aside. */
export function FeedDetailSkeleton() {
  return (
    <div className="panacea-feed" role="status" aria-busy="true" aria-label="Memuat detail / Loading detail">
      <span className="sr-only">Memuat detail / Loading detail</span>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <div className="detail-view wrap">
        <div aria-hidden="true">
          <Skeleton className="h-10 w-40 rounded-[12px]" />
        </div>

        <div className="detail-layout" aria-hidden="true">
          <article className="detail-main">
            <div className="detail-meta">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="mb-4 space-y-2.5">
              <Skeleton className="h-10 w-full rounded-[12px]" />
              <Skeleton className="h-10 w-3/4 rounded-[12px]" />
            </div>
            <div className="mb-[23px] space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>

            <div className="flex flex-wrap items-center gap-[10px] border-y border-border-soft py-3.5">
              <Skeleton className="size-[35px] shrink-0 rounded-[12px]" />
              <div className="space-y-1.5">
                <Skeleton className="h-2 w-16" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="mx-1 h-7 w-px" />
              <Skeleton className="size-[35px] shrink-0 rounded-[12px]" />
              <div className="space-y-1.5">
                <Skeleton className="h-2 w-16" />
                <Skeleton className="h-2.5 w-28" />
              </div>
            </div>

            <div className="my-[22px] flex gap-[13px] rounded-[17px] border border-[#dce8d4] bg-[linear-gradient(120deg,#f1f7ec,#fffdf7)] p-[17px]">
              <Skeleton className="size-[34px] shrink-0 rounded-[12px]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-2.5 w-40" />
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-3/4" />
              </div>
            </div>

            {[0, 1, 2].map((section) => (
              <section key={section} className="detail-section mb-8">
                <div className="mb-3 flex items-center gap-2.5">
                  <Skeleton className="size-9 shrink-0 rounded-[12px]" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-2.5 w-4/5" />
                  <Skeleton className="h-2.5 w-2/3" />
                </div>
              </section>
            ))}
          </article>

          <aside className="space-y-4">
            <Skeleton className="h-4 w-40" />
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="rounded-[18px] border border-[#eae5d9] bg-white/80 p-4"
              >
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-1.5 h-3 w-4/5" />
                <div className="mt-3 flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-2 w-12" />
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Mirrors components/panacea/legal-page.tsx: header band + 220px contents column. */
export function LegalSkeleton() {
  return (
    <div className="bg-cream-50" role="status" aria-busy="true" aria-label="Memuat dokumen / Loading document">
      <span className="sr-only">Memuat dokumen / Loading document</span>
      <header className="border-b border-cream-200 bg-cream-100" aria-hidden="true">
        <div className="container-article py-10 sm:py-14">
          <Skeleton className="h-3 w-36" />
          <div className="mt-5 flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="mt-2 h-9 w-2/3 max-w-md rounded-[12px]" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-3 w-full max-w-2xl" />
            <Skeleton className="h-3 w-4/5 max-w-xl" />
          </div>
          <Skeleton className="mt-4 h-2.5 w-48" />
        </div>
      </header>

      <div className="container-article grid gap-10 py-10 lg:grid-cols-[220px_1fr] lg:py-14" aria-hidden="true">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Skeleton className="h-2.5 w-24" />
            <ol className="mt-3 space-y-2">
              {Array.from({ length: 6 }, (_, index) => (
                <li key={index} className="flex gap-2">
                  <Skeleton className="h-2.5 w-4 shrink-0" />
                  <Skeleton className="h-2.5 w-full" />
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="max-w-[760px] space-y-9">
          {Array.from({ length: 4 }, (_, section) => (
            <section key={section}>
              <Skeleton className="h-5 w-2/3" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-5/6" />
                <Skeleton className="h-2.5 w-3/4" />
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
