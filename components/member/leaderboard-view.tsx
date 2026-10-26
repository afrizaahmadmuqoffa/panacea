"use client";

import {
  ArrowDown,
  ArrowUp,
  Crown,
  Flame,
  Medal,
  Minus,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LeaderboardEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MemberHero } from "./member-hero";
import { Pagination, usePagination } from "@/components/ui/pagination";

export function LeaderboardView({
  weekly,
  global,
}: {
  weekly: LeaderboardEntry[];
  global: LeaderboardEntry[];
}) {
  const { tr } = useI18n();
  const [scope, setScope] = useState("weekly");

  return (
    <div className="space-y-6">
      <MemberHero
        kicker={tr("Papan peringkat", "Leaderboard")}
        kickerIcon={Trophy}
        title={tr("Papan peringkat Debunk Game.", "Debunk Game Leaderboard")}
        description={tr(
          "Peringkat mingguan direset Senin 00.00 WIB. Global menyimpan total poin.",
          "Weekly rankings reset Monday 00:00 WIB. Global keeps all-time points.",
        )}
        mascot="leaderboard"
        mascotClassName="max-w-[312px] lg:max-w-[360px]"
      />

      <Tabs value={scope} onValueChange={setScope} variant="cozy">
        <TabsList>
          <TabsTrigger value="weekly">{tr("Mingguan", "Weekly")}</TabsTrigger>
          <TabsTrigger value="global">{tr("Global All-Time", "Global All-Time")}</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="mt-5">
          {weekly.length > 0 ? (
            <LeaderboardBoard entries={weekly} label={tr("Minggu ini", "This week")} />
          ) : (
            <EmptyState
              icon={Trophy}
              state="none"
              title={tr("Belum ada peringkat mingguan", "No weekly ranking yet")}
              description={tr("Peringkat muncul setelah anggota menyelesaikan aktivitas.", "Rankings appear after members complete activities.")}
            />
          )}
        </TabsContent>
        <TabsContent value="global" className="mt-5">
          {global.length > 0 ? (
            <LeaderboardBoard entries={global} label={tr("Sepanjang waktu", "All time")} />
          ) : (
            <EmptyState
              icon={Trophy}
              state="none"
              title={tr("Belum ada peringkat global", "No global ranking yet")}
              description={tr("Peringkat muncul setelah anggota mengumpulkan poin.", "Rankings appear after members earn points.")}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeaderboardBoard({ entries, label }: { entries: LeaderboardEntry[]; label: string }) {
  const { locale, tr } = useI18n();
  const top = entries.slice(0, 3);
  const rest = entries.slice(3);
  const { page, setPage, pageCount, start, end } = usePagination(rest.length);
  const pageSlice = rest.slice(start, end);
  const podiumOrder = [top[1], top[0], top[2]].filter(Boolean);
  const heights = ["h-32", "h-44", "h-24"];
  const medals = [Medal, Medal, Medal];
  const hasFullPodium = podiumOrder.length >= 3;

  return (
    <div className="space-y-5">
      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold text-bark-500">{label}</p>
          <Badge variant="butter">
            <Trophy className="size-3.5" aria-hidden="true" />
            Top 3
          </Badge>
        </div>
        <div className={cn("mt-5 items-end gap-2 sm:gap-4", hasFullPodium ? "grid grid-cols-3" : "flex justify-center gap-6")}>
          {podiumOrder.map((entry) => {
            const position = entry.rank;
            const orderIndex = [1, 0, 2].indexOf(position - 1);
            const Icon = medals[position - 1] ?? Medal;
            const isFirst = position === 1;
            return (
              <div key={entry.alias} className={cn("flex flex-col items-center", !hasFullPodium && "w-[38%] max-w-[180px]")}>
                <div className="relative">
                  <Avatar name={entry.alias} size={isFirst ? "lg" : "md"} tone="warm" className={cn(isFirst && "ring-4 ring-butter-300")} />
                  {isFirst ? (
                    <Crown className="cozy-bob absolute -top-5 left-1/2 size-5 -translate-x-1/2 text-[#8a641a]" aria-hidden="true" />
                  ) : null}
                </div>
                <p className={cn("mt-2 max-w-full truncate text-center text-xs font-extrabold text-bark-900", isFirst && "text-sm")}>{entry.alias}</p>
                <p className="text-xs font-semibold text-bark-500">{entry.xp.toLocaleString(locale === "id" ? "id-ID" : "en-GB")} {tr("poin", "points")}</p>
                <div
                  className={cn(
                    "mt-3 flex w-full flex-col items-center justify-end rounded-t-[14px] border border-b-0 border-border-soft bg-gradient-to-b px-2 pb-3 pt-2 shadow-[inset_0_-4px_0_rgb(61_73_63/0.05)]",
                    heights[orderIndex] ?? "h-24",
                    isFirst ? "from-[#fff2ce] to-[#f6d982]/60" : "from-cream-100 to-cream-200/70",
                  )}
                >
                  <Icon className={cn("size-4", isFirst ? "text-[#8a641a]" : "text-bark-500")} aria-hidden="true" />
                  <span className="mt-1 text-xs font-extrabold text-bark-700">#{position}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] cozy-shadow cozy-hover">
        <div className="flex items-center justify-between border-b border-dashed border-[#e8e2d5] px-4 py-3 sm:px-5">
          <p className="text-xs font-extrabold text-bark-500">
            {tr("Peringkat lainnya", "Other rankings")}
          </p>
          <span className="text-xs font-semibold text-bark-500">{entries.length} {tr("anggota", "members")}</span>
        </div>
        <ul className="divide-y divide-[#e8e2d5]">
          {pageSlice.map((entry) => (
            <li
              key={entry.alias}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition sm:px-5",
                entry.isCurrentUser && "bg-sage-100/60",
                entry.inactive && "bg-cream-100/60",
              )}
            >
              <span className="w-7 text-center text-xs font-extrabold text-bark-500">#{entry.rank}</span>
              <Avatar name={entry.alias} size="sm" tone="warm" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-xs font-extrabold text-bark-900">
                  {entry.alias}
                  {entry.isCurrentUser ? <Badge variant="sage" className="px-1.5 py-0.5 text-xs">{tr("Kamu", "You")}</Badge> : null}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-bark-500">
                  <Flame className="size-3" aria-hidden="true" />
                  {entry.streak} {tr("hari", "days")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-extrabold text-bark-900 [font-variant-numeric:tabular-nums]">
                  {entry.xp.toLocaleString(locale === "id" ? "id-ID" : "en-GB")}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-bark-500">{tr("poin", "points")}</p>
              </div>
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full",
                  entry.trend === "up" && "bg-sage-100 text-sage-700",
                  entry.trend === "down" && "bg-rose-100 text-rose-700",
                  entry.trend === "same" && "bg-cream-100 text-bark-500",
                )}
                aria-label={entry.trend}
              >
                {entry.trend === "up" ? <ArrowUp className="size-3" aria-hidden="true" /> : entry.trend === "down" ? <ArrowDown className="size-3" aria-hidden="true" /> : <Minus className="size-3" aria-hidden="true" />}
              </span>
            </li>
          ))}
        </ul>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}
