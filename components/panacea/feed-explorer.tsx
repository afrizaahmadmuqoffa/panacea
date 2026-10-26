"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, FileCheck2, FilterX, Search, SearchX } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { categoryName } from "@/lib/data/categories";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { FeedCard } from "./feed-card";
import type { Category, FeedItem, Verdict } from "@/lib/types";

type VerdictTab = "all" | "supported" | "partial" | "contradicted" | "insufficient";

const TAB_VERDICT: Record<Exclude<VerdictTab, "all">, Verdict> = {
  supported: "supported",
  partial: "partly_supported",
  contradicted: "contradicted",
  insufficient: "insufficient_evidence",
};

export function FeedExplorer({ items, categories }: { items: FeedItem[]; categories: Category[] }) {
  const { locale, tr } = useI18n();
  const [category, setCategory] = useState("all");
  const [verdict, setVerdict] = useState<VerdictTab>("all");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey) return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!searchRef.current) return;
      event.preventDefault();
      searchRef.current.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const tabs: Array<{ key: VerdictTab; label: string }> = [
    { key: "all", label: tr("Semua verdict", "All verdicts") },
    { key: "supported", label: tr("Didukung bukti", "Supported") },
    { key: "partial", label: tr("Sebagian didukung", "Partly supported") },
    { key: "contradicted", label: tr("Bertentangan", "Contradicted") },
    { key: "insufficient", label: tr("Bukti belum cukup", "Insufficient evidence") },
  ];

  const needle = query.trim().toLocaleLowerCase(locale);
  const hasQuery = needle.length > 0;
  const isFiltered = hasQuery || category !== "all" || verdict !== "all";

  const visible = useMemo(
    () =>
      items.filter((item) => {
        const matchesQuery =
          !needle ||
          [
            item.title[locale],
            item.summary[locale],
            item.publicClaimText[locale],
            item.expertNote[locale],
            categoryName(item.categorySlug, locale),
          ].some((text) => text.toLocaleLowerCase(locale).includes(needle));
        const matchesCategory = category === "all" || item.categorySlug === category;
        const matchesVerdict = verdict === "all" || item.verdict === TAB_VERDICT[verdict];
        return matchesQuery && matchesCategory && matchesVerdict;
      }),
    [items, needle, category, verdict, locale],
  );

  const { page, setPage, pageCount, start, end } = usePagination(visible.length);

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setVerdict("all");
    setPage(1);
  }

  return (
    <div className="feed-content wrap">
      <div className="feed-heading-row">
        <div>
          <h2>{tr("Jelajahi hasil verifikasi", "Explore verified findings")}</h2>
          <p className="section-subtitle">
            {tr(
              "Setiap putusan dilengkapi ringkasan, batasan bukti, dan referensi yang bisa ditelusuri.",
              "Every verdict comes with a summary, evidence limitations, and traceable references.",
            )}
          </p>
        </div>
        <div className="result-count" aria-live="polite">
          <span className="count-leaf" aria-hidden="true">
            <FileCheck2 size={18} />
          </span>
          <div>
            <strong>{visible.length}</strong>
            <small>{tr("hasil tersedia", "results available")}</small>
          </div>
        </div>
      </div>

      <div className="filter-panel">
        <label className="search-box" htmlFor="feed-search">
          <span className="search-icon" aria-hidden="true">
            <Search size={20} />
          </span>
          <input
            ref={searchRef}
            id="feed-search"
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder={tr("Cari klaim, topik, atau kata kunci...", "Search claims, topics, or keywords...")}
            autoComplete="off"
          />
          <kbd aria-hidden="true">/</kbd>
        </label>
        <label className="category-select-label" htmlFor="category-filter">
          {tr("Kategori", "Category")}
        </label>
        <select
          id="category-filter"
          className="category-select"
          value={category}
          onChange={(event) => { setCategory(event.target.value); setPage(1); }}
        >
          <option value="all">{tr("Semua kategori", "All categories")}</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name[locale]}
            </option>
          ))}
        </select>
      </div>

      <div className="verdict-tabs" role="tablist" aria-label={tr("Filter berdasarkan putusan", "Filter by verdict")}>
        {tabs.map((tab) => {
          const active = verdict === tab.key;
          const count =
            tab.key === "all" ? items.length : items.filter((item) => item.verdict === TAB_VERDICT[tab.key as Exclude<VerdictTab, "all">]).length;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`verdict-tab ${active ? "is-active" : ""}`}
              onClick={() => { setVerdict(tab.key); setPage(1); }}
            >
              {tab.label} <span>{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length > 0 ? (
        <>
          <div className="feed-grid" aria-live="polite">
            {visible.slice(start, end).map((item, index) => (
              <FeedCard key={item.id} item={item} index={index} />
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} tone="plain" />
        </>
      ) : isFiltered ? (
        <div className="empty-state" data-empty="filtered">
          <span aria-hidden="true">{hasQuery ? <SearchX size={32} /> : <FilterX size={32} />}</span>
          <h3>{tr("Tidak ada hasil yang cocok", "No matching results")}</h3>
          <p>
            {tr(
              "Coba kata kunci lain atau longgarkan filter yang dipilih.",
              "Try another keyword or loosen the selected filters.",
            )}
          </p>
          <button type="button" className="button button-soft" onClick={resetFilters}>
            {tr("Reset filter", "Reset filters")}
          </button>
        </div>
      ) : (
        <div className="empty-state" data-empty="none">
          <span aria-hidden="true">
            <BadgeCheck size={32} />
          </span>
          <h3>{tr("Belum ada klaim terverifikasi", "No verified claims yet")}</h3>
          <p>
            {tr(
              "Klaim yang sudah diputuskan oleh reviewer akan tampil di sini.",
              "Claims already decided by expert reviewers will appear here.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
