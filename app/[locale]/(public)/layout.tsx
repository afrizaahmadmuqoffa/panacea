import { BackToTop } from "@/components/panacea/back-to-top";
import { SiteFooter } from "@/components/panacea/site-footer";
import { SiteHeader } from "@/components/panacea/site-header";
import { createTr, type Locale } from "@/lib/i18n/config";
import "@/components/panacea/panacea-chrome.css";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tr = createTr(locale as Locale);
  return (
    <div className="panacea-site">
      <a className="skip-link" href="#main-content">
        {tr("Langsung ke konten", "Skip to content")}
      </a>
      <div className="page-grain" aria-hidden="true" />
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
