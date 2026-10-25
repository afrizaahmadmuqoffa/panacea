import type { Metadata } from "next";
import { NotFoundContent } from "@/components/panacea/not-found-content";

export const metadata: Metadata = {
  title: "404: Halaman tidak ditemukan",
  robots: { index: false, follow: false },
};

export default function LocaleNotFound() {
  return <NotFoundContent />;
}
