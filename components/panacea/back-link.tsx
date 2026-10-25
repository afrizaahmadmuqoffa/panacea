"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { readBackPath } from "./path-history";

/**
 * Tombol kembali: menuju halaman sebelumnya di dalam aplikasi bila ada,
 * dan memakai fallbackHref untuk kunjungan langsung atau riwayat yang tidak dikenal.
 */
export function BackLink({ fallbackHref, label }: { fallbackHref: string; label: string }) {
  const router = useRouter();

  return (
    <Link
      className="back-link"
      href={fallbackHref}
      onClick={(event) => {
        const sameOriginReferrer = document.referrer.startsWith(window.location.origin);
        const backPath = readBackPath();
        if (backPath && backPath !== window.location.pathname) {
          event.preventDefault();
          router.push(backPath);
          return;
        }
        if (sameOriginReferrer && window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
    >
      <span aria-hidden="true">
        <ArrowLeft size={18} />
      </span>{" "}
      {label}
    </Link>
  );
}
