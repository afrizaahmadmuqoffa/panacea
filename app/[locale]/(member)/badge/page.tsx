import type { Metadata } from "next";
import { BadgeGallery } from "@/components/member/badge-gallery";

export const metadata: Metadata = {
  title: "Koleksi Badge",
};

export default function BadgePage() {
  return <BadgeGallery />;
}
