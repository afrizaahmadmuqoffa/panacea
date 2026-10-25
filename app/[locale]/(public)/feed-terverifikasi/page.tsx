import type { Metadata } from "next";
import { Library, ShieldCheck } from "lucide-react";
import { FeedExplorer } from "@/components/panacea/feed-explorer";
import { PanaMascot } from "@/components/panacea/pana-mascot";
import { getPublicCategories, getPublicFeed } from "@/lib/data/repository";
import { createTr, type Locale } from "@/lib/i18n/config";
import "@/app/[locale]/(public)/panacea-public.css";
import "@/app/[locale]/(public)/panacea-feed.css";
import "@/app/[locale]/(public)/panacea-app.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tr = createTr(locale);
  return {
    title: tr("Feed Terverifikasi", "Verified Feed"),
    description: tr(
      "Telusuri klaim kesehatan yang sudah diputuskan pakar. Filter berdasarkan kategori.",
      "Explore health claims with expert verdicts. Filter by category.",
    ),
  };
}

export default async function FeedPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const tr = createTr(locale);
  const [items, categories] = await Promise.all([getPublicFeed(), getPublicCategories()]);
  const visibleItems = items.filter((item) => item.status === "visible");

  return (
    <div className="panacea-feed">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <div className="feed-view">
        <div className="page-intro wrap">
          <div className="intro-copy">
            <span className="eyebrow">
              <span aria-hidden="true">
                <Library size={14} />
              </span>{" "}
              {tr("Perpustakaan PANACEA", "PANACEA Library")}
            </span>
            <h1>
              {tr("Klaim diperiksa.", "Claims checked.")}
              <br />
              <span>{tr("Bukti dibagikan.", "Evidence shared.")}</span>
            </h1>
            <p>
              {tr(
                "Telusuri hasil verifikasi klaim kesehatan yang sudah diverifikasi pakar lengkap dengan sumbernya.",
                "Explore verified health claims, read the reasoning behind expert verdicts, and open the references behind them.",
              )}
            </p>
            <p className="privacy-pill">
              <span className="privacy-icon" aria-hidden="true">
                <ShieldCheck size={18} />
              </span>
              <span>
                <strong>{tr("Terverifikasi Pakar", "Expert Verified")}</strong>
                <small>
                  {tr(
                    "Setiap entri berasal dari review pakar sebelum terbit.",
                    "Every entry comes from expert review before it is published.",
                  )}
                </small>
              </span>
            </p>
          </div>
          <div className="intro-illustration" aria-hidden="true">
            <span className="intro-glow" />
            <span className="intro-glow intro-glow-b" />
            <span className="intro-orbit intro-orbit-a" />
            <span className="intro-orbit intro-orbit-b" />
            <span className="intro-cloud intro-cloud-a" />
            <span className="intro-cloud intro-cloud-b" />
            <span className="intro-particle" />
            <span className="intro-particle" />
            <span className="intro-particle" />
            <span className="intro-particle" />
            <span className="intro-particle" />
            <span className="intro-particle" />
            <span className="intro-ground" />
            <div className="mascot-placeholder intro-mascot">
              <PanaMascot pose="feed" />
            </div>
          </div>
        </div>

        <FeedExplorer items={visibleItems} categories={categories} />
      </div>
    </div>
  );
}
