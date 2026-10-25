import type { MetadataRoute } from "next";
import { publicConfig } from "@/lib/config/public";

const privatePaths = [
  "dashboard",
  "cek-klaim",
  "riwayat-klaim",
  "lapor",
  "forum",
  "game",
  "leaderboard",
  "badge",
  "notifikasi",
  "profil",
  "reviewer",
  "admin",
  "masuk",
  "daftar",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/*/masuk", "/*/daftar", ...privatePaths.flatMap((path) => [`/id/${path}`, `/en/${path}`])],
      },
    ],
    sitemap: `${publicConfig.appUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
