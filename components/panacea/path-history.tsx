"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PREVIOUS_KEY = "panacea:previousPath";

/**
 * Mencatat path halaman terakhir di dalam aplikasi agar tombol "kembali"
 * bisa menuju halaman sebelumnya walau navigasi terjadi via client router.
 */
export function PathHistory() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    try {
      const previous = window.sessionStorage.getItem(PREVIOUS_KEY);
      if (previous && previous !== pathname) {
        window.sessionStorage.setItem("panacea:backPath", previous);
      }
      window.sessionStorage.setItem(PREVIOUS_KEY, pathname);
    } catch {
      // Penyimpanan privat bisa dinonaktifkan; tombol kembali tetap pakai fallback.
    }
  }, [pathname]);

  return null;
}

export function readBackPath() {
  try {
    return window.sessionStorage.getItem("panacea:backPath") ?? "";
  } catch {
    return "";
  }
}
