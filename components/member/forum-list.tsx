"use client";

import Link from "next/link";
import {
  ArrowRight,
  Eye,
  FilterX,
  Lock,
  MessageCircle,
  MessagesSquare,
  PenLine,
  Search,
  SearchX,
  Stethoscope,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { ForumListSkeleton } from "@/components/skeletons/member";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { NewThreadDialog } from "@/components/member/new-thread-dialog";
import { formatDate } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { MemberPageHeader } from "./member-page-header";
import { Pagination, usePagination } from "@/components/ui/pagination";

export function ForumList() {
  const { locale, tr } = useI18n();
  const { threads, categories, role, hydrated } = usePanacea();
  const categoryLabel = (slug: string) =>
    categories.find((item) => item.slug === slug)?.name[locale] ?? slug;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return threads
      .filter((thread) => category === "all" || thread.categorySlug === category)
      .filter(
        (thread) =>
          !normalized ||
          thread.title.toLowerCase().includes(normalized) ||
          thread.body.toLowerCase().includes(normalized),
      )
      .sort((a, b) => {
        if (sort === "popular") {
          return b.comments.filter((comment) => comment.status === "visible").length - a.comments.filter((comment) => comment.status === "visible").length;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [threads, query, category, sort]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || category !== "all";
  const { page, setPage, pageCount, start, end } = usePagination(visible.length);
  const pageSlice = visible.slice(start, end);

  if (!hydrated) return <ForumListSkeleton />;

  return (
    <div className="space-y-6">
      <MemberPageHeader
        icon={MessagesSquare}
        title={tr("Ruang diskusi termoderasi", "Moderated discussion room")}
        description={tr(
          "Tanyakan hal yang belum jelas, bagikan pengalaman, dan hubungkan diskusi dengan hasil verifikasi pakar. Semua komentar melewati moderasi.",
          "Ask what is still unclear, share experiences, and connect discussions with expert verification. Every comment passes moderation.",
        )}
        actions={
          <NewThreadDialog className={buttonVariants({ variant: "cozy" })}>
            <PenLine className="size-4" aria-hidden="true" />
            {tr("Buat thread", "New thread")}
          </NewThreadDialog>
        }
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder={tr("Cari diskusi...", "Search discussions...")}
              className="pl-11"
              aria-label={tr("Cari thread", "Search threads")}
            />
          </div>
          <Select
            value={category}
            onChange={(event) => { setCategory(event.target.value); setPage(1); }}
            aria-label={tr("Filter kategori", "Filter category")}
            className="md:w-56"
          >
            <option value="all">{tr("Semua kategori", "All categories")}</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name[locale]}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(event) => { setSort(event.target.value); setPage(1); }}
            aria-label={tr("Urutkan", "Sort")}
            className="md:w-40"
          >
            <option value="newest">{tr("Terbaru", "Newest")}</option>
            <option value="popular">{tr("Terpopuler", "Popular")}</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-bark-700">
          {visible.length} {tr("diskusi", "discussions")}
        </p>
        <Badge variant="sage">
          <MessagesSquare className="size-3.5" aria-hidden="true" />
          {tr("Moderasi aktif", "Moderation on")}
        </Badge>
      </div>

      {visible.length > 0 ? (
        <>
        <div className="space-y-3">
          {pageSlice.map((thread) => {
            const visibleComments = thread.comments.filter((comment) => comment.status === "visible");
            return (
              <article
                key={thread.id}
                className="group relative overflow-hidden rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-5 cozy-shadow cozy-hover hover:border-sage-300"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default">{categoryLabel(thread.categorySlug)}</Badge>
                  {thread.isLocked ? (
                    <Badge variant="outline">
                      <Lock className="size-3" aria-hidden="true" />
                      {tr("Dikunci", "Locked")}
                    </Badge>
                  ) : null}
                </div>
                <h2 className="mt-2 font-heading text-[21px] font-black tracking-[-0.45px] leading-snug text-bark-900">
                  <Link href={`/${locale}/forum/${thread.id}`} className="hover:text-sage-700">
                    {thread.title}
                  </Link>
                </h2>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-bark-700">{thread.body}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-[#e8e2d5] pt-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-bark-700">
                    <Avatar name={thread.authorAlias} size="sm" tone="warm" />
                    {thread.authorAlias}
                    {thread.authorIsReviewer ? (
                      <Badge variant="sky">
                        <Stethoscope className="size-3" aria-hidden="true" />
                        {tr("Reviewer", "Reviewer")}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-xs text-bark-500">{formatDate(thread.updatedAt, locale)}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-bark-500">
                    <MessageCircle className="size-3.5" aria-hidden="true" />
                    {visibleComments.length}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-bark-500">
                    <Eye className="size-3.5" aria-hidden="true" />
                    {thread.views}
                  </span>
                  <Link
                    href={`/${locale}/forum/${thread.id}`}
                    className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline"
                  >
                    {tr("Baca diskusi", "Read discussion")}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      ) : isFiltered ? (
        <EmptyState
          icon={hasQuery ? SearchX : FilterX}
          state="filtered"
          title={tr("Belum ada diskusi yang cocok", "No matching discussions yet")}
          description={tr(
            role === "user"
              ? "Ubah kata kunci atau mulai thread baru. Diskusi manual dan dari hasil analisis sama-sama tersedia."
              : "Ubah kata kunci atau mulai thread manual baru.",
            role === "user"
              ? "Change your keyword or start a new thread. Both manual and analysis-based discussions are available."
              : "Change your keyword or start a new manual thread.",
          )}
          action={
            <div className="flex gap-2">
              <Button variant="cozySoft" onClick={() => { setQuery(""); setCategory("all");; setPage(1) }}>
                {tr("Hapus filter", "Clear filters")}
              </Button>
              <NewThreadDialog className={cn(buttonVariants({ variant: "cozy" }))}>
                {tr("Buat thread", "New thread")}
              </NewThreadDialog>
            </div>
          }
        />
      ) : (
        <EmptyState
          icon={MessagesSquare}
          state="none"
          title={tr("Belum ada diskusi", "No discussions yet")}
          description={tr(
            role === "user"
              ? "Mulai thread baru untuk bertanya atau berbagi pengalaman."
              : "Mulai thread manual baru untuk bertanya atau berbagi pengalaman.",
            role === "user"
              ? "Start a new thread to ask a question or share an experience."
              : "Start a new manual thread to ask a question or share an experience.",
          )}
          action={
            <NewThreadDialog className={cn(buttonVariants({ variant: "cozy" }))}>
              {tr("Buat thread", "New thread")}
            </NewThreadDialog>
          }
        />
      )}
    </div>
  );
}
