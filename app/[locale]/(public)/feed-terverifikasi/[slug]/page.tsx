import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, CalendarDays, FileWarning, Info, Quote, Search, ShieldCheck, UserRoundCheck } from "lucide-react";
import { BackLink } from "@/components/panacea/back-link";
import { categoryName } from "@/lib/data/categories";
import { getPublicFeedItem } from "@/lib/data/repository";
import { createTr, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";
import "@/app/[locale]/(public)/panacea-public.css";
import "@/app/[locale]/(public)/panacea-feed.css";
import "@/app/[locale]/(public)/panacea-app.css";

export const dynamic = "force-dynamic";

const verdictClass: Record<string, string> = {
  supported: "verdict-supported",
  partly_supported: "verdict-partial",
  contradicted: "verdict-contradicted",
  insufficient_evidence: "verdict-insufficient",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = await getPublicFeedItem(slug);
  if (!item) return {};
  return {
    title: item.title[locale],
    description: item.summary[locale],
    alternates: { canonical: `/${locale}/feed-terverifikasi/${slug}` },
    openGraph: {
      title: item.title[locale],
      description: item.summary[locale],
      type: "article",
    },
    robots: item.status === "visible" ? { index: true, follow: true } : { index: false },
  };
}

export default async function FeedDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const item = await getPublicFeedItem(slug);
  if (!item) notFound();
  const tr = createTr(locale);

  const verdictLabel =
    item.verdict === "supported"
      ? tr("Didukung bukti", "Supported")
      : item.verdict === "partly_supported"
        ? tr("Sebagian didukung", "Partly supported")
        : item.verdict === "contradicted"
          ? tr("Bertentangan", "Contradicted")
          : tr("Bukti belum cukup", "Insufficient evidence");

  return (
    <div className="panacea-feed">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <div className="detail-view wrap">
        <BackLink
          fallbackHref={`/${locale}/feed-terverifikasi`}
          label={tr("Kembali", "Back")}
        />

        <div className="detail-layout">
          <article className="detail-main">
            <div className="detail-meta">
              <span className={`verdict-badge ${verdictClass[item.verdict] ?? "verdict-insufficient"}`}>{verdictLabel}</span>
              <span className="category-badge">{categoryName(item.categorySlug, locale)}</span>
            </div>
            <h1>{item.title[locale]}</h1>
            <p className="detail-summary">{item.summary[locale]}</p>

            <div className="detail-dates">
              <span className="date-icon" aria-hidden="true">
                <CalendarDays size={19} />
              </span>
              <span>
                <small>{tr("Tanggal publikasi verifikasi", "Verification publication date")}</small>
                <strong>{formatDate(item.publishedAt, locale)}</strong>
              </span>
              <span className="meta-divider" aria-hidden="true" />
              <span className="reviewer-avatar" aria-hidden="true">
                <UserRoundCheck size={19} />
              </span>
              <span>
                <small>{tr("Ditinjau oleh", "Reviewed by")}</small>
                <strong>{item.reviewerName ?? tr("Tim reviewer PANACEA", "PANACEA review team")}</strong>
              </span>
            </div>

            <div className="privacy-banner">
              <span className="privacy-banner-icon" aria-hidden="true">
                <ShieldCheck size={19} />
              </span>
              <div>
                <strong>{tr("Identitas pelapor dilindungi", "Reporter identity is protected")}</strong>
                <p>
                  {tr(
                    "Entri ini hanya memuat salinan publik yang telah disunting dari data pribadi.",
                    "This entry only contains a public copy with personal data removed.",
                  )}
                </p>
              </div>
            </div>

            <section className="detail-section claim-section">
              <span className="detail-section-icon icon-peach" aria-hidden="true">
                <Quote size={20} />
              </span>
              <div>
                <h2>{tr("Apa klaimnya?", "What is the claim?")}</h2>
                <p>{item.publicClaimText[locale]}</p>
              </div>
            </section>

            <section className="detail-section evidence-section">
              <span className="detail-section-icon icon-sage" aria-hidden="true">
                <Search size={20} />
              </span>
              <div>
                <h2>{tr("Apa yang ditemukan bukti?", "What did the evidence find?")}</h2>
                <p>{item.expertNote[locale]}</p>
                <ul className="finding-list">
                  {(item.evidence ?? []).slice(0, 4).map((ref) => (
                    <li key={ref.id}>
                      {ref.title} — {ref.publisher} ({ref.year})
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="detail-section limitation-section">
              <span className="detail-section-icon icon-butter" aria-hidden="true">
                <FileWarning size={20} />
              </span>
              <div>
                <h2>{tr("Batasan bukti", "Evidence limitations")}</h2>
                <p>{item.limitations[locale]}</p>
              </div>
            </section>

            <section className="references-section">
              <div className="references-heading">
                <div>
                  <span className="section-kicker">{tr("Telusuri lebih lanjut", "Dig deeper")}</span>
                  <h2>{tr("Referensi yang digunakan", "References used")}</h2>
                  <p>
                    {tr(
                      "Sumber yang mendukung penilaian ditampilkan agar pembaca dapat memeriksa konteks aslinya.",
                      "The sources behind the assessment are shown so readers can check their original context.",
                    )}
                  </p>
                </div>
              </div>
              <div className="reference-list">
                {item.evidence.map((ref) => (
                  <article className="reference-card" key={ref.id}>
                    <div>
                      <h3 className="reference-title">{ref.title}</h3>
                      <div className="reference-meta">
                        <span className={`source-badge ${ref.sourceType === "kb" ? "source-internal" : "source-epmc"}`}>
                          {ref.sourceType === "kb" ? tr("KB internal", "Internal KB") : "Europe PMC"}
                        </span>
                        <span className="relevance">
                          {tr("Relevansi", "Relevance")}:{" "}
                          <strong>
                            {ref.relevance === "high"
                              ? tr("Tinggi", "High")
                              : ref.relevance === "medium"
                                ? tr("Sedang", "Medium")
                                : tr("Rendah", "Low")}
                          </strong>
                        </span>
                        <span className="reference-year">
                          {tr("Tahun", "Year")} {ref.year}
                        </span>
                      </div>
                    </div>
                    <a className="source-link" href={ref.url} target="_blank" rel="noreferrer noopener">
                      {tr("Buka sumber", "Open source")}{" "}
                      <span aria-hidden="true">
                        <ArrowUpRight size={13} />
                      </span>
                    </a>
                  </article>
                ))}
              </div>
            </section>

            <p className="detail-disclaimer">
              <span aria-hidden="true">
                <Info size={15} />
              </span>{" "}
              {tr(
                "Hasil ini adalah ringkasan bukti untuk literasi kesehatan, bukan diagnosis atau nasihat medis. Konsultasikan keputusan pengobatan dengan tenaga kesehatan.",
                "This result is an evidence summary for health literacy, not a diagnosis or medical advice. Discuss treatment decisions with a health professional.",
              )}
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}
