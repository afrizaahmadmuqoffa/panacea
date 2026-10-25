"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useSyncExternalStore } from "react";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Logo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";

const SECTION_IDS = ["beranda", "masalah", "solusi", "cara-kerja", "faq"];

function getActiveSection() {
  if (typeof document === "undefined") return "";
  let current = "";
  for (const id of SECTION_IDS) {
    const element = document.getElementById(id);
    if (element && element.getBoundingClientRect().top <= 100) current = id;
  }
  return current;
}

function subscribeSection(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  window.addEventListener("resize", callback);
  return () => {
    window.removeEventListener("scroll", callback);
    window.removeEventListener("resize", callback);
  };
}

export function SiteHeader() {
  const { locale, tr } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sectionOnLanding = useSyncExternalStore(subscribeSection, getActiveSection, () => "");
  const activeSection = pathname === `/${locale}` ? sectionOnLanding : "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { hash: "beranda", label: tr("Beranda", "Home") },
    { hash: "masalah", label: tr("Masalah", "Problem") },
    { hash: "solusi", label: tr("Solusi", "Solution") },
    { hash: "cara-kerja", label: tr("Cara kerja", "How it works") },
    { hash: "faq", label: tr("FAQ", "FAQ") },
  ];

  return (
    <header id="top" className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <nav className="nav wrap" aria-label={tr("Navigasi utama", "Main navigation")}>
        <Link className="brand" href={`/${locale}#beranda`} aria-label="PANACEA">
          <Logo />
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-label={open ? tr("Tutup menu", "Close menu") : tr("Buka menu", "Open menu")}
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
        <div id="nav-links" className={`nav-links ${open ? "is-open" : ""}`}>
          {links.map((link) => (
            <Link
              key={link.hash}
              href={`/${locale}#${link.hash}`}
              className={activeSection === link.hash ? "active" : undefined}
              aria-current={activeSection === link.hash ? "location" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <LocaleSwitcher />
          <Link href={`/${locale}/masuk`} className="nav-login" onClick={() => setOpen(false)}>
            {tr("Masuk", "Sign in")}
          </Link>
          <Link
            href={`/${locale}/daftar`}
            className="button button-small button-primary nav-cta"
            onClick={() => setOpen(false)}
          >
            {tr("Daftar", "Join")}{" "}
            <span aria-hidden="true">
              <ArrowUpRight size={15} />
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
