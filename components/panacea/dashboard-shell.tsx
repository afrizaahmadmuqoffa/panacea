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
  Menu,
  MessagesSquare,
  SearchCheck,
  Settings2,
  Stethoscope,
  Tags,
  Trophy,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
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

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hydrated && storeUserId !== session.userId) void refresh();
  }, [hydrated, storeUserId, session.userId, refresh]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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

      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-[#eae5d9] bg-[#fffcf5]/95 backdrop-blur-xl transition-transform duration-200 lg:z-30 lg:w-[248px] lg:max-w-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-[#eae5d9] px-6">
          <Link href={hrefFor(homeHref)} onClick={() => setOpen(false)} aria-label="PANACEA" className="inline-flex min-h-11 items-center">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid size-10 place-items-center rounded-full text-bark-700 transition hover:bg-[#f1f5e9] lg:hidden"
            aria-label={tr("Tutup menu", "Close menu")}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
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
                      onClick={() => setOpen(false)}
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

      {open ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={tr("Tutup menu", "Close menu")}
          className="fixed inset-0 z-40 bg-bark-900/40 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <div className="relative z-10 lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-[#eae5d9] bg-[#f8f7ec]/80 backdrop-blur-xl">
          <div className="flex h-[68px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="grid size-10 place-items-center rounded-full text-bark-700 transition hover:bg-[#f1f5e9] lg:hidden"
                aria-label={tr("Buka menu", "Open menu")}
                aria-expanded={open}
                aria-controls="app-sidebar"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
              <span className="text-xs font-bold text-bark-500">
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
          className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-14"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
