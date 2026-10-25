"use client";

import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/components/providers/i18n-provider";
import { categoryName } from "@/lib/data/categories";
import { formatDate } from "@/lib/i18n/format";
import type { FeedItem, Verdict } from "@/lib/types";

const verdictTone: Record<Verdict, { accent: string; glow: string }> = {
  supported: { accent: "#8fc185", glow: "#e4f2df" },
  partly_supported: { accent: "#f0c96b", glow: "#fff0c9" },
  contradicted: { accent: "#e3917f", glow: "#fbe4de" },
  insufficient_evidence: { accent: "#b3a4dd", glow: "#e9e5f7" },
};

export function FeedCard({ item, index = 0 }: { item: FeedItem; index?: number }) {
  const { locale, tr } = useI18n();
  const tone = verdictTone[item.verdict];
  const href = `/${locale}/feed-terverifikasi/${item.slug}`;
  return (
    <article
      className="feed-card"
      style={
        {
          "--card-accent": tone.accent,
          "--card-glow": tone.glow,
          animationDelay: `${Math.min(index, 8) * 60}ms`,
        } as React.CSSProperties
      }
    >
      <div className="card-topline">
        <span className={`verdict-badge ${item.verdict === "partly_supported" ? "verdict-partial" : `verdict-${item.verdict}`}`}>
          {item.verdict === "supported"
            ? tr("Didukung bukti", "Supported")
            : item.verdict === "partly_supported"
              ? tr("Sebagian didukung", "Partly supported")
              : item.verdict === "contradicted"
                ? tr("Bertentangan", "Contradicted")
                : tr("Bukti belum cukup", "Insufficient evidence")}
        </span>
        <span className="category-badge">{categoryName(item.categorySlug, locale)}</span>
      </div>
      <h3 className="card-title">
        <Link href={href}>{item.title[locale]}</Link>
      </h3>
      <p className="card-summary">{item.summary[locale]}</p>
      <div className="card-footer">
        <span className="card-date">
          <span className="meta-calendar" aria-hidden="true">
            <CalendarDays size={13} />
          </span>{" "}
          {tr("Dipublikasikan", "Published")} {formatDate(item.publishedAt, locale)}
        </span>
        <Link className="read-result" href={href}>
          {tr("Baca hasil", "Read verdict")}{" "}
          <span aria-hidden="true">
            <ArrowRight size={15} />
          </span>
        </Link>
      </div>
    </article>
  );
}
