"use client";

import {
  Award,
  Bell,
  BookOpen,
  BookMarked,
  BookOpenCheck,
  ClipboardCheck,
  FlaskConical,
  Gauge,
  Gamepad2,
  History,
  LayoutDashboard,
  MessagesSquare,
  SearchCheck,
  Settings2,
  Stethoscope,
  Tags,
  Trophy,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { useI18n } from "@/components/providers/i18n-provider";
import { usePanacea } from "@/components/providers/panacea-provider";
import { Avatar } from "@/components/ui/avatar";
import type { Session } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";

type Area = "member" | "reviewer" | "admin";

type NavItem = {
  href: string;
  label: { id: string; en: string };
  icon: LucideIcon;
  exact?: boolean;
  newTab?: boolean;
};

type NavGroup = {
  label?: { id: string; en: string };
  items: NavItem[];
};

const areaLabel: Record<Area, { id: string; en: string }> = {
  member: { id: "Ruang Anggota", en: "Member space" },
  reviewer: { id: "Ruang Reviewer", en: "Reviewer space" },
  admin: { id: "Ruang Admin", en: "Admin space" },
};

function getNav(area: Area): NavGroup[] {
  if (area === "reviewer") {
    return [
      {
        items: [
          { href: "/reviewer/dashboard", label: { id: "Dasbor", en: "Dashboard" }, icon: LayoutDashboard },
          { href: "/reviewer/tugas", label: { id: "Tugas Saya", en: "My tasks" }, icon: ClipboardCheck },
          { href: "/reviewer/knowledge-base", label: { id: "Knowledge Base", en: "Knowledge Base" }, icon: BookOpen },
          { href: "/feed-terverifikasi", label: { id: "Feed Terverifikasi", en: "Verified feed" }, icon: BookOpenCheck, newTab: true },
          { href: "/forum", label: { id: "Forum", en: "Forum" }, icon: MessagesSquare },
          { href: "/profil", label: { id: "Profil", en: "Profile" }, icon: UserRound },
        ],
      },
    ];
  }
  if (area === "admin") {
    return [
      {
        items: [
          { href: "/admin/dashboard", label: { id: "Ringkasan", en: "Overview" }, icon: Gauge },
        ],
      },
      {
        label: { id: "Pengguna & Reviewer", en: "People & reviewers" },
        items: [
          { href: "/admin/pengguna", label: { id: "Pengguna", en: "Users" }, icon: Users },
          { href: "/admin/reviewer", label: { id: "Reviewer", en: "Reviewers" }, icon: Stethoscope },
          { href: "/admin/kategori", label: { id: "Kategori", en: "Categories" }, icon: Tags },
        ],
      },
      {
        label: { id: "Klaim & Feed", en: "Claims & feed" },
        items: [
          { href: "/admin/klaim", label: { id: "Monitoring Klaim", en: "Claim monitoring" }, icon: SearchCheck },
          { href: "/admin/feed", label: { id: "Feed Terverifikasi", en: "Verified feed" }, icon: BookOpenCheck },
        ],
      },
      {
        label: { id: "Knowledge Base", en: "Knowledge Base" },
        items: [
          { href: "/admin/knowledge-base", label: { id: "Sumber KB", en: "KB sources" }, icon: BookOpen },
          { href: "/admin/saran-kb", label: { id: "Saran Reviewer", en: "Reviewer suggestions" }, icon: BookMarked },
        ],
      },
      {
        label: { id: "Komunitas", en: "Community" },
        items: [
          { href: "/admin/forum-moderasi", label: { id: "Moderasi Forum", en: "Forum moderation" }, icon: MessagesSquare },
        ],
      },
      {
        label: { id: "Game & Badge", en: "Game & badges" },
        items: [
          { href: "/admin/game-soal", label: { id: "Bank Soal", en: "Question bank" }, icon: Gamepad2 },
          { href: "/admin/badge", label: { id: "Konfigurasi Badge", en: "Badge settings" }, icon: Award },
        ],
      },
      {
        label: { id: "Audit & Pengaturan", en: "Audit & settings" },
        items: [
          { href: "/admin/audit", label: { id: "Audit Log", en: "Audit log" }, icon: FlaskConical },
          { href: "/admin/pengaturan", label: { id: "Pengaturan", en: "Settings" }, icon: Settings2 },
        ],
      },
    ];
  }
  return [
    {
      items: [
        { href: "/dashboard", label: { id: "Dasbor", en: "Dashboard" }, icon: LayoutDashboard },
        { href: "/cek-klaim", label: { id: "Cek Klaim", en: "Check a claim" }, icon: SearchCheck },
        { href: "/riwayat-klaim", label: { id: "Riwayat Klaim", en: "Claim history" }, icon: History },
        { href: "/feed-terverifikasi", label: { id: "Feed Terverifikasi", en: "Verified feed" }, icon: BookOpenCheck, newTab: true },
        { href: "/forum", label: { id: "Forum", en: "Forum" }, icon: MessagesSquare },
        { href: "/game", label: { id: "Debunk Game", en: "Debunk Game" }, icon: Gamepad2 },
        { href: "/leaderboard", label: { id: "Leaderboard", en: "Leaderboard" }, icon: Trophy },
        { href: "/badge", label: { id: "Badge", en: "Badges" }, icon: Award },
        { href: "/profil", label: { id: "Profil", en: "Profile" }, icon: UserRound },
      ],
    },
  ];
}

const mobileItems: Record<Area, NavItem[]> = {
  member: [
    { href: "/dashboard", label: { id: "Dasbor", en: "Home" }, icon: LayoutDashboard },
    { href: "/cek-klaim", label: { id: "Cek", en: "Check" }, icon: SearchCheck },
    { href: "/forum", label: { id: "Forum", en: "Forum" }, icon: MessagesSquare },
    { href: "/game", label: { id: "Game", en: "Game" }, icon: Gamepad2 },
    { href: "/profil", label: { id: "Profil", en: "Profile" }, icon: UserRound },
  ],
  reviewer: [
    { href: "/reviewer/dashboard", label: { id: "Dasbor", en: "Home" }, icon: LayoutDashboard },
    { href: "/reviewer/tugas", label: { id: "Tugas", en: "Tasks" }, icon: ClipboardCheck },
    { href: "/reviewer/knowledge-base", label: { id: "KB", en: "KB" }, icon: BookOpen },
    { href: "/forum", label: { id: "Forum", en: "Forum" }, icon: MessagesSquare },
    { href: "/profil", label: { id: "Profil", en: "Profile" }, icon: UserRound },
  ],
  admin: [
    { href: "/admin/dashboard", label: { id: "Dasbor", en: "Home" }, icon: Gauge },
    { href: "/admin/pengguna", label: { id: "Orang", en: "People" }, icon: Users },
    { href: "/admin/klaim", label: { id: "Klaim", en: "Claims" }, icon: SearchCheck },
    { href: "/admin/knowledge-base", label: { id: "KB", en: "KB" }, icon: BookOpen },
    { href: "/admin/pengaturan", label: { id: "Setelan", en: "Settings" }, icon: Settings2 },
  ],
};

export function DashboardShell({
  area,
  session,
  children,
}: {
  area: Area;
  session: Session;
  children: ReactNode;
}) {
  const { locale, tr } = useI18n();
  const { notifications, userId: storeUserId, hydrated, refresh } = usePanacea();
  const pathname = usePathname();
  const nav = getNav(area);
  const unread = notifications.filter((notification) => !notification.isRead).length;
  const displayName = session.fullName;

  useEffect(() => {
    if (hydrated && storeUserId !== session.userId) void refresh();
  }, [hydrated, storeUserId, session.userId, refresh]);

  const prefix = `/${locale}`;
  const hrefFor = (href: string) => `${prefix}${href}`;
  const homeHref = area === "admin" ? "/admin/dashboard" : area === "reviewer" ? "/reviewer/dashboard" : "/dashboard";
  const isActive = (href: string, exact?: boolean) => {
    const target = hrefFor(href);
    return exact ? pathname === target : pathname === target || pathname.startsWith(`${target}/`);
  };

  return (
    <div className="min-h-screen bg-[#f8f7ec]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-bark-900 focus:shadow-float"
      >
        {tr("Lewati ke konten utama", "Skip to main content")}
      </a>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-40 top-24 z-0 hidden size-[30rem] rounded-full bg-[radial-gradient(circle,#e7f1df_0,transparent_72%)] opacity-70 sm:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-32 top-[44%] z-0 hidden size-[30rem] rounded-full bg-[radial-gradient(circle,#fbf0d9_0,transparent_72%)] opacity-70 sm:block"
      />
      <div
        aria-hidden="true"
        className="paper-grain pointer-events-none fixed inset-0 z-[55] opacity-[0.075]"
      />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#eae5d9] bg-[#fffcf5]/95 backdrop-blur-xl lg:flex">
        <div className="flex h-[76px] items-center border-b border-[#eae5d9] px-6">
          <Link href={hrefFor(homeHref)} aria-label="PANACEA" className="inline-flex min-h-11 items-center">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5 no-scrollbar">
          {nav.map((group, index) => (
            <div key={group.label?.en ?? index} className={cn(index > 0 && "mt-5")}>
              {group.label ? (
                <p className="mb-2 px-3 text-xs font-extrabold uppercase tracking-[0.14em] text-bark-500">
                  {group.label[locale]}
                </p>
              ) : null}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={hrefFor(item.href)}
                      target={item.newTab ? "_blank" : undefined}
                      rel={item.newTab ? "noopener noreferrer" : undefined}
                      className={cn(
                        "relative flex min-h-11 items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-[13px] font-bold text-bark-700 transition hover:translate-x-0.5 hover:bg-[#f1f5e9] hover:text-sage-700",
                        active && "bg-[#e9f1df] font-extrabold text-[#42694d] shadow-[inset_3px_0_#6c9b70]",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className={cn("size-[17px]", active ? "text-sage-700" : "text-bark-500")} aria-hidden="true" />
                      {item.label[locale]}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#eae5d9] p-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={displayName} size="sm" tone="warm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-bark-900">{displayName}</p>
              <p className="truncate text-xs text-bark-500">{areaLabel[area][locale]}</p>
            </div>
          </div>
          <LogoutButton locale={locale} className="mt-3" buttonClassName="w-full justify-start" />
        </div>
      </aside>

      <div className="relative z-10 lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-[#eae5d9] bg-[#f8f7ec]/80 backdrop-blur-xl">
          <div className="flex h-[68px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
            <div className="flex items-center gap-2.5">
              <Link href={hrefFor(homeHref)} className="inline-flex min-h-11 items-center lg:hidden" aria-label="PANACEA">
                <Logo />
              </Link>
              <span className="hidden text-xs font-bold text-bark-500 sm:inline">
                {areaLabel[area][locale]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <LocaleSwitcher className="hidden md:inline-flex" />
              <Link
                href={hrefFor("/notifikasi")}
                className="relative grid size-11 place-items-center rounded-full border border-border-soft bg-white text-bark-700 shadow-soft transition hover:bg-sage-100"
                aria-label={tr("Notifikasi", "Notifications")}
              >
                <Bell className="size-[18px]" aria-hidden="true" />
                {unread > 0 ? (
                  <span className="absolute -right-1 -top-1 grid size-5 min-w-5 place-items-center rounded-full bg-butter-300 px-1 text-xs font-extrabold text-[#7c5c17]">
                    {unread}
                  </span>
                ) : null}
              </Link>
              <Link href={hrefFor("/profil")} aria-label={tr("Profil", "Profile")} className="inline-flex size-11 items-center justify-center">
                <Avatar name={displayName} size="sm" tone="warm" />
              </Link>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1200px] px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-14"
        >
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-30 rounded-[22px] border border-[#eae5d9] bg-[#fffdf8]/95 shadow-[0_4px_0_rgb(232_226_213/0.6),0_14px_28px_rgb(61_73_63/0.12)] backdrop-blur-xl lg:hidden"
        aria-label={tr("Navigasi utama", "Main navigation")}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          {mobileItems[area].map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={hrefFor(item.href)}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-xs font-bold text-bark-500",
                  active && "text-sage-700",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full transition",
                    active && "bg-sage-100 shadow-[inset_0_-2px_0_rgb(84_122_96/0.12)]",
                  )}
                >
                  <Icon className={cn("size-[18px]", active && "cozy-wiggle")} aria-hidden="true" />
                </span>
                <span className="truncate">{item.label[locale]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
