import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ClipboardCheck, Megaphone, User } from "lucide-react";
import { LocaleSwitcher } from "@/components/panacea/locale-switcher";
import { Logo } from "@/components/panacea/logo";
import { PanaMascot } from "@/components/panacea/pana-mascot";
import { createTr, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function AuthShell({
  locale,
  title,
  description,
  children,
  variant = "masuk",
}: {
  locale: Locale;
  title: string;
  description: string;
  children: React.ReactNode;
  variant?: "masuk" | "daftar";
}) {
  const tr = createTr(locale);
  const isLogin = variant === "masuk";

  return (
    <div className="relative isolate">
      <span className="ambient ambient-one" aria-hidden="true" />
      <span className="ambient ambient-two" aria-hidden="true" />

      <header className="relative z-[3] mx-auto flex min-h-[82px] max-w-[1320px] items-center justify-between px-[42px] py-3 lt-760:min-h-[70px] lt-760:px-5 lt-760:py-2.5 lt-390:px-[14px]">
        <div className="flex flex-col items-start gap-0.5">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 rounded-md py-1 text-xs font-bold text-bark-600 transition-colors hover:text-sage-700 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            {tr("Kembali ke beranda", "Back to the homepage")}
          </Link>
        </div>
        <div>
          <LocaleSwitcher />
        </div>
      </header>

      <main
        className={cn(
          "mx-auto grid min-h-[calc(100vh_-_82px)] w-[min(1240px,calc(100%_-_56px))] grid-cols-[minmax(0,1.03fr)_minmax(420px,0.97fr)] items-center gap-[clamp(36px,6vw,92px)] pt-3.5 pb-7",
          !isLogin &&
            "grid-cols-[minmax(0,1fr)_minmax(430px,0.92fr)] items-start gap-[clamp(30px,4vw,65px)] pt-0",
          "lt-1000:w-[calc(100%_-_36px)] lt-1000:grid-cols-[minmax(0,0.9fr)_minmax(390px,1.1fr)] lt-1000:gap-7",
          "lt-760:flex lt-760:min-h-[calc(100vh_-_78px)] lt-760:w-[min(100%_-_28px,490px)] lt-760:flex-col lt-760:justify-center lt-760:gap-[15px] lt-760:px-0 lt-760:pt-2.5 lt-760:pb-[25px] lt-390:w-[calc(100%_-_20px)]",
        )}
      >
        <section
          className={cn(
            "relative flex flex-col justify-between overflow-hidden rounded-[34px] bg-[linear-gradient(155deg,#e8efdc_0%,#f7f2df_53%,#dce9d7_100%)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.6)] lt-760:hidden",
            isLogin
              ? "h-[min(760px,calc(100vh_-_130px))] min-h-[690px] lt-1000:min-h-[650px] lt-760:h-[230px] lt-760:min-h-[230px]"
              : "sticky top-[18px] h-[calc(100vh_-_100px)] min-h-[650px] lt-1000:min-h-[620px] lt-760:relative lt-760:top-auto lt-760:h-[190px] lt-760:min-h-[190px]",
            "lt-760:w-full lt-760:flex-none lt-760:rounded-[25px]",
          )}
          aria-label={tr("Ilustrasi taman PANACEA", "PANACEA garden illustration")}
        >
          <div className="relative z-[2] max-w-[590px] px-11 pt-12 lt-1000:px-7 lt-1000:pt-9 lt-760:max-w-[350px] lt-760:px-[22px] lt-760:pt-[22px] lt-390:pr-[14px] lt-390:pl-[17px]">
            <span className="inline-flex items-center lt-760:scale-90 lt-760:origin-left">
              <Logo />
            </span>
            <h1
              className={cn(
                "mt-[22px] mb-[15px] font-heading font-black leading-[1.13] tracking-[-0.045em] text-[#354b3d]",
                isLogin
                  ? "text-[clamp(34px,3.25vw,48px)] lt-1000:text-[37px] lt-760:text-[27px]"
                  : "text-[clamp(34px,3.25vw,48px)] lt-1000:text-[37px] lt-760:text-[25px]",
                "lt-760:mt-[13px] lt-760:mb-[7px] lt-390:text-[25px]",
                "leading-[1.13]",
              )}
            >
              {isLogin ? (
                <>
                  {tr("Cek Klaim Kesehatan,", "Check Health Claims,")}
                  <br />
                  <em className="relative not-italic whitespace-nowrap text-[#689475] after:absolute after:inset-x-0 after:-bottom-[3px] after:h-[7px] after:rotate-[-2deg] after:rounded-[50%] after:border-t-[3px] after:border-[#d3b967] after:content-['']">
                    {tr("Lebih Cepat", "More Quickly")}
                  </em>{" "}
                  {tr("dan Pasti.", "and with Confidence.")}
                </>
              ) : (
                <>
                  {tr("Biar Nggak Mudah", "Don't Be Easily")}
                  <br />
                  <em className="relative not-italic whitespace-nowrap text-[#689475] after:absolute after:inset-x-0 after:-bottom-[3px] after:h-[7px] after:rotate-[-2deg] after:rounded-[50%] after:border-t-[3px] after:border-[#d3b967] after:content-['']">
                    {tr("Termakan Rumor", "Misled by Health")}
                  </em>{" "}
                  {tr("Kesehatan.", "Rumors.")}
                </>
              )}
            </h1>
            <p className="m-0 max-w-[410px] text-[14px] leading-[1.8] text-[#718170] lt-760:max-w-[300px] lt-760:text-[10px] lt-760:leading-[1.55] lt-390:max-w-[235px]">
              {isLogin
                ? tr(
                    "Kembalilah untuk memverifikasi kabar kesehatan terbaru dan pantau riwayat pencarianmu.",
                    "Come back to verify the latest health news and keep track of your search history.",
                  )
                : tr(
                    "Cari tahu fakta di balik berita viral dan pastikan kesehatan diri serta keluarga berbasis bukti ilmiah.",
                    "Discover the facts behind viral news and protect your health and your family's health with scientific evidence.",
                  )}
            </p>
          </div>

          <div className="garden-scene" aria-hidden="true">
            <span className="scene-sun" />
            <span className="scene-cloud cloud-a" />
            <span className="scene-cloud cloud-b" />
            <span className="mountain mountain-back" />
            <span className="mountain mountain-mid" />
            <span className="hill hill-back" />
            <span className="hill hill-front" />
            <span className="path" />
            <div className="tiny-house">
              <div className="house-roof" />
              <div className="house-body">
                <span className="house-window" />
                <span className="house-door" />
              </div>
            </div>
            <div className="tree tree-left">
              <i />
              <b />
            </div>
            <div className="tree tree-right">
              <i />
              <b />
            </div>
            <span className="flower flower-one">✿</span>
            <span className="flower flower-two">✿</span>
            <span className="mushroom">
              <i />
              <b />
            </span>
            <span className="floating-note note-one">
              <ClipboardCheck size={12} aria-hidden="true" />{" "}
              {isLogin ? tr("Data Medis Valid", "verified medical information") : tr("pelajari sumbernya", "learn about the sources")}
            </span>
            <span className="floating-note note-two">
              <Megaphone size={12} aria-hidden="true" />{" "}
              {isLogin ? tr("Bebas Rumor", "free from rumors") : tr("bagikan faktanya", "share the facts")}
            </span>
            <div className="mascot-placeholder" role="img" aria-label={tr("Tempat gambar maskot Pana", "Placeholder for the Pana mascot")}>
              <PanaMascot pose="auth" />
            </div>
          </div>

          <span className="absolute bottom-6 left-[30px] z-[6] flex items-center gap-2 text-[11px] font-bold text-[#71866e] lt-760:hidden">
            <span className="size-[7px] rounded-full bg-[#8db68c] shadow-[0_0_0_4px_#8db68c24]" aria-hidden="true" />
            {isLogin
              ? tr("Ruang aman untuk belajar bersama", "A safe space to learn together")
              : tr("Tidak perlu tahu semuanya untuk mulai", "You do not need to know everything to start")}
          </span>
        </section>

        <section className="w-full max-w-[470px] justify-self-center py-3 lt-760:max-w-none lt-760:p-0">
          <div
            className={cn(
              "backdrop-blur-[16px] animate-[auth-card-arrive_0.65s_var(--ease)_both]",
              isLogin
                ? "rounded-[30px] border border-white bg-[#fffdf8e8] p-[35px_38px_27px] shadow-[var(--shadow),0_0_0_1px_#e6e6d8aa]"
                : "rounded-[30px] border border-white bg-[#fffdf8e8] p-[28px_38px_22px] shadow-[var(--shadow),0_0_0_1px_#e6e6d8aa]",
              "lt-1000:p-[30px_27px_24px]",
              isLogin
                ? "lt-760:rounded-[25px] lt-760:p-[27px_24px_22px] lt-760:shadow-[0_14px_40px_#455c4215] lt-390:p-[27px_19px_22px]"
                : "lt-760:rounded-[25px] lt-760:p-[23px_24px_22px] lt-760:shadow-[0_14px_40px_#455c4215] lt-390:p-[23px_19px_22px]",
            )}
          >
            <span className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.035em] text-[#6c8b70]">
              <span className="inline-grid size-[26px] place-items-center rounded-[9px] bg-[#e7efdc] text-[15px] text-[#6c9670]" aria-hidden="true">
                <User size={15} />
              </span>
              {tr("Akun PANACEA", "Your PANACEA account")}
            </span>
            <h2
              className={cn(
                "font-heading font-black leading-[1.09] tracking-[-0.04em] text-[#34483b]",
                isLogin ? "mt-[17px] mb-2.5 text-[34px]" : "mt-[13px] mb-2.5 text-[31px]",
                isLogin ? "lt-760:text-[31px]" : "lt-760:text-[29px]",
                "leading-[1.09]",
              )}
            >
              {title}
            </h2>
            <p
              className={cn(
                "m-0 max-w-[340px] text-[12px] leading-[1.7] text-[#839081]",
                isLogin ? "mb-[22px]" : "mb-4",
                isLogin ? "lt-760:text-[11px]" : "lt-760:mb-[13px] lt-760:text-[11px]",
              )}
            >
              {description}
            </p>

            <nav
              className={cn(
                "grid grid-cols-2 rounded-[14px] bg-[#f1f0e5] p-1",
                isLogin ? "mb-[23px]" : "mb-[17px]",
              )}
              aria-label={tr("Pilih halaman autentikasi", "Choose authentication page")}
            >
              <Link
                className={cn(
                  "flex min-h-[38px] items-center justify-center rounded-[11px] text-[12px] font-extrabold text-[#899286] no-underline transition-[background,box-shadow,color,transform] duration-[250ms] hover:text-[var(--sage-dark)]",
                  isLogin && "bg-[#fffdf8] text-[#507b5c] shadow-[0_3px_10px_#4e6b4815]",
                )}
                href={`/${locale}/masuk`}
                aria-current={isLogin ? "page" : undefined}
              >
                {tr("Masuk", "Sign in")}
              </Link>
              <Link
                className={cn(
                  "flex min-h-[38px] items-center justify-center rounded-[11px] text-[12px] font-extrabold text-[#899286] no-underline transition-[background,box-shadow,color,transform] duration-[250ms] hover:text-[var(--sage-dark)]",
                  !isLogin && "bg-[#fffdf8] text-[#507b5c] shadow-[0_3px_10px_#4e6b4815]",
                )}
                href={`/${locale}/daftar`}
                aria-current={!isLogin ? "page" : undefined}
              >
                {tr("Buat akun", "Create account")}
              </Link>
            </nav>

            {children}

            <p className={cn("mt-[19px] text-center text-[11px] text-[#899386]", !isLogin && "mt-[13px]")}>
              {isLogin ? tr("Belum punya akun?", "No account yet?") : tr("Sudah punya akun?", "Already have an account?")}{" "}
              <Link
                className="group font-extrabold text-[#588162] no-underline"
                href={isLogin ? `/${locale}/daftar` : `/${locale}/masuk`}
              >
                <strong>{isLogin ? tr("Daftar", "Sign up") : tr("Masuk", "Sign in")}</strong>{" "}
                <span className="inline-block no-underline transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                  <ArrowUpRight size={14} />
                </span>
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
