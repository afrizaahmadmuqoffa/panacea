import { Skeleton } from "./primitives";

/** Mirrors components/auth/auth-shell.tsx for both /masuk and /daftar. */
export function AuthSkeleton() {
  return (
    <div className="relative isolate" role="status" aria-busy="true" aria-label="Memuat halaman akun / Loading account page">
      <span className="sr-only">Memuat halaman akun / Loading account page</span>
      <span className="ambient ambient-one" aria-hidden="true" />
      <span className="ambient ambient-two" aria-hidden="true" />

      <header className="relative z-[3] mx-auto flex h-[82px] max-w-[1320px] items-center justify-between px-[42px] lt-760:h-[70px] lt-760:px-5 lt-390:px-[14px]">
        <div className="flex items-center gap-3" aria-hidden="true">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
        <Skeleton className="h-9 w-24 rounded-full" aria-hidden="true" />
      </header>

      <main className="mx-auto grid min-h-[calc(100vh_-_82px)] w-[min(1240px,calc(100%_-_56px))] grid-cols-[minmax(0,1.03fr)_minmax(420px,0.97fr)] items-center gap-[clamp(36px,6vw,92px)] pt-3.5 pb-7 lt-1000:w-[calc(100%_-_36px)] lt-1000:grid-cols-[minmax(0,0.9fr)_minmax(390px,1.1fr)] lt-1000:gap-7 lt-760:flex lt-760:min-h-0 lt-760:w-[min(100%_-_28px,490px)] lt-760:flex-col lt-760:gap-[15px] lt-760:px-0 lt-760:pt-2.5 lt-760:pb-[25px] lt-390:w-[calc(100%_-_20px)]">
        <section
          className="relative flex flex-col justify-between overflow-hidden rounded-[34px] bg-[linear-gradient(155deg,#e8efdc_0%,#f7f2df_53%,#dce9d7_100%)] p-9"
          aria-hidden="true"
        >
          <div>
            <Skeleton className="h-[26px] w-40 rounded-full" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-8 w-full max-w-sm rounded-[12px]" />
              <Skeleton className="h-8 w-3/4 max-w-xs rounded-[12px]" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-full max-w-sm" />
              <Skeleton className="h-3 w-5/6 max-w-xs" />
            </div>
          </div>
          <Skeleton className="mt-8 aspect-[4/3] w-full max-w-[300px] rounded-[28px]" />
        </section>

        <section
          className="relative rounded-[26px] border border-[#e7e5d5] bg-[#fffdf8] p-6 sm:p-8"
          aria-hidden="true"
        >
          <Skeleton className="h-7 w-3/5 rounded-[10px]" />
          <Skeleton className="mt-2.5 h-3 w-full max-w-sm" />
          <Skeleton className="mt-4 h-[46px] w-full rounded-[14px]" />

          <div className="mt-5 space-y-3">
            {[0, 1].map((field) => (
              <div key={field}>
                <Skeleton className="mb-[7px] h-2.5 w-20" />
                <Skeleton className="h-[47px] w-full rounded-[13px]" />
              </div>
            ))}
          </div>

          <Skeleton className="mt-[9px] min-h-[48px] w-full rounded-[14px]" />
          <Skeleton className="mx-auto mt-[19px] h-2.5 w-48" />
        </section>
      </main>
    </div>
  );
}
