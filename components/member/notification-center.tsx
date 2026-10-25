"use client";

import Link from "next/link";
import {
  AtSign,
  Award,
  Bell,
  BotMessageSquare,
  CheckCheck,
  CircleAlert,
  Lightbulb,
  LoaderCircle,
  MessagesSquare,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/member";
import { NotificationSkeleton } from "@/components/skeletons/member";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MemberPageHeader } from "./member-page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelative } from "@/lib/i18n/format";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap = {
  analysis: BotMessageSquare,
  report: ShieldCheck,
  expert_result: Stethoscope,
  moderation: MessagesSquare,
  badge: Award,
  suggestion: Lightbulb,
  mention: AtSign,
  system: CircleAlert,
};

export function NotificationCenter() {
  const { locale, tr } = useI18n();
  const { notifications, refresh, hydrated } = usePanacea();
  const [scope, setScope] = useState<"all" | "unread">("all");
  const [marking, setMarking] = useState(false);
  async function markOne(id: string) {
    const result = await markNotificationReadAction(locale, id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await refresh();
  }
  async function markAll() {
    setMarking(true);
    try {
      const result = await markAllNotificationsReadAction(locale);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      await refresh();
    } finally {
      setMarking(false);
    }
  }
  const unread = notifications.filter((notification) => !notification.isRead);
  const visible = useMemo(
    () => (scope === "unread" ? unread : notifications),
    [scope, notifications, unread],
  );

  if (!hydrated) return <NotificationSkeleton />;

  return (
    <div className="space-y-6">
      <MemberPageHeader
        icon={Bell}
        title={tr("Kabar yang relevan untukmu", "Updates relevant to you")}
        description={tr(
          "Notifikasi in-app tetap tersimpan meskipun sinyal realtime gagal. Database menjadi sumber kebenaran.",
          "In-app notifications remain stored even if realtime delivery fails. The database is the source of truth.",
        )}
        actions={
          <Button variant="cozySoft" onClick={() => void markAll()} disabled={marking || unread.length === 0}>
            {marking ? <LoaderCircle className="size-4 spin" aria-hidden="true" /> : <CheckCheck className="size-4" aria-hidden="true" />}
            {marking ? tr("Menandai...", "Marking...") : tr("Tandai semua dibaca", "Mark all read")}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={scope} onValueChange={(v) => setScope(v as "all" | "unread")} variant="cozy">
          <TabsList>
            <TabsTrigger value="all">
              {tr("Semua", "All")}
              <Badge variant="outline" className="px-1.5 py-0 text-xs">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              {tr("Belum dibaca", "Unread")}
              <Badge variant="rose" className="px-1.5 py-0 text-xs">{unread.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs font-semibold text-bark-500">
          {unread.length} {tr("belum dibaca", "unread")}
        </p>
      </div>

      <Tabs value={scope}>
        <TabsContent value={scope}>
          {visible.length > 0 ? (
            <ul className="space-y-2.5">
              {visible.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  href={
                    notification.href
                      ? `/${locale}${notification.href}`
                      : `/${locale}/notifikasi`
                  }
                  onRead={() => void markOne(notification.id)}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={scope === "unread" ? CheckCheck : Bell}
              state={scope === "unread" ? "filtered" : "none"}
              title={scope === "unread" ? tr("Semua sudah dibaca", "You are all caught up") : tr("Belum ada notifikasi", "No notifications yet")}
              description={tr(
                "Kabar tentang analisis, laporan pakar, moderasi, dan badge akan muncul di sini.",
                "Updates about analysis, expert reports, moderation, and badges will appear here.",
              )}
              action={
                scope === "unread" ? (
                  <Button variant="cozySoft" onClick={() => setScope("all")}>
                    {tr("Lihat semua notifikasi", "View all notifications")}
                  </Button>
                ) : undefined
              }
            />
          )}
        </TabsContent>
      </Tabs>

      <div className="flex gap-2.5 rounded-[18px] border border-sage-300 bg-sage-100 p-4 text-xs leading-relaxed text-bark-700">
        <Bell className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          {tr(
            "Tautan tujuan selalu berupa rute internal yang tervalidasi. Notifikasi tidak memuat isi klaim sensitif atau identitas reviewer.",
            "Destination links are always validated internal routes. Notifications do not contain sensitive claim content or reviewer identities.",
          )}
        </p>
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  href,
  onRead,
}: {
  notification: Notification;
  href: string;
  onRead: () => void;
}) {
  const { locale, tr } = useI18n();
  const Icon = iconMap[notification.type];
  return (
    <li>
      <Link
        href={href}
        onClick={onRead}
        className={cn(
          "flex items-start gap-3 rounded-lg border border-border-soft bg-white p-4 shadow-soft transition hover:border-sage-300",
          !notification.isRead && "bg-sage-100/35",
        )}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cream-100 text-bark-700">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold text-bark-900">{notification.title[locale]}</span>
            {!notification.isRead ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-butter-300 bg-[#fff2ce] px-2 py-0.5 text-xs font-extrabold text-[#8a641a]">
                <span className="size-1.5 animate-pulse rounded-full bg-[#c7a53c] motion-reduce:animate-none" aria-hidden="true" />
                {tr("Baru", "New")}
              </span>
            ) : null}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-bark-700">{notification.body[locale]}</span>
          <span className="mt-1.5 block text-xs text-bark-500">{formatRelative(notification.createdAt, locale)}</span>
        </span>
      </Link>
    </li>
  );
}
