"use client";

import Link from "next/link";
import { ArrowUpRight, Flower2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Logo } from "./logo";

export function SiteFooter() {
  const { locale, tr } = useI18n();

  return (
    <footer className="site-footer">
      <div className="footer-top wrap">
        <div className="footer-brand">
          <Link className="brand" href={`/${locale}#beranda`} aria-label="PANACEA">
            <Logo />
          </Link>
          <p>
            {tr(
              "Cek fakta medis tanpa pusing. Semua klaim kami telusuri langsung sampai ke sumber resminya.",
              "Check medical facts without the hassle. We trace every claim all the way back to its official source.",
            )}
          </p>
          <span className="footer-motto">
            {tr("Stay curious, check kindly.", "Stay curious, check kindly.")}{" "}
            <span aria-hidden="true">
              <Flower2 size={17} />
            </span>
          </span>
        </div>
        <div className="footer-column">
          <h3>{tr("Jelajahi", "Explore")}</h3>
          <Link href={`/${locale}#beranda`}>{tr("Beranda", "Home")}</Link>
          <Link href={`/${locale}#masalah`}>{tr("Masalah", "Problem")}</Link>
          <Link href={`/${locale}#solusi`}>{tr("Solusi", "Solution")}</Link>
          <Link href={`/${locale}#cara-kerja`}>{tr("Cara kerja", "How it works")}</Link>
          <Link href={`/${locale}#faq`}>FAQ</Link>
        </div>
        <div className="footer-column footer-note">
          <h3>{tr("Catatan penting", "Important note")}</h3>
          <p>
            {tr(
              "PANACEA menyediakan informasi dan literasi kesehatan, bukan diagnosis, resep, atau pengganti layanan kesehatan. Selalu periksa sumber dan konteksnya.",
              "PANACEA provides health information and literacy, not diagnosis, prescriptions, or a substitute for health services. Always check the sources and context.",
            )}
          </p>
          <Link href={`/${locale}/kebijakan-privasi`}>
            {tr("Kebijakan privasi", "Privacy policy")}{" "}
            <span aria-hidden="true">
              <ArrowUpRight size={13} />
            </span>
          </Link>
          <Link href={`/${locale}/syarat-ketentuan`}>
            {tr("Syarat dan ketentuan", "Terms and conditions")}{" "}
            <span aria-hidden="true">
              <ArrowUpRight size={13} />
            </span>
          </Link>
        </div>
      </div>
      <div className="footer-bottom wrap">
        <span>
          © 2026 PANACEA. {tr("Dibuat dengan rasa ingin tahu", "Made with curiosity")}{" "}
          <span className="footer-heart" aria-hidden="true">
            ♥
          </span>
        </span>
        <span className="footer-bottom-right">
          <span className="online-dot" aria-hidden="true" /> {tr("Bertumbuh bersama bukti", "Growing with evidence")}
        </span>
      </div>
    </footer>
  );
}
