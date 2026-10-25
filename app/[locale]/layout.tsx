import type { Metadata } from "next";
import { DM_Sans, Nunito } from "next/font/google";
import { notFound } from "next/navigation";
import { AppProviders } from "@/components/providers/app-providers";
import { publicConfig } from "@/lib/config/public";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import "../globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isId = locale === "id";
  return {
    title: {
      default: isId ? "PANACEA: Periksa Klaim Kesehatan" : "PANACEA: Check Health Claims",
      template: "%s | PANACEA",
    },
    description: isId
      ? "Platform literasi kesehatan dan verifikasi klaim berbasis bukti, ditinjau pakar manusia."
      : "A health literacy and claim verification platform grounded in evidence and reviewed by human experts.",
    applicationName: "PANACEA",
    metadataBase: new URL(publicConfig.appUrl),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/site.webmanifest",
    openGraph: {
      title: "PANACEA",
      description: isId
        ? "Periksa klaim kesehatan. Telusuri buktinya."
        : "Check health claims. Trace the evidence.",
      type: "website",
      locale: isId ? "id_ID" : "en_GB",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className={`${nunito.variable} ${dmSans.variable}`}>
      <body>
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}

export const dynamicParams = false;
export const revalidate = false;
