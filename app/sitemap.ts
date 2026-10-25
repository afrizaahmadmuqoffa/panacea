import type { MetadataRoute } from "next";
import { publicConfig } from "@/lib/config/public";
import { getPublicFeedSlugs } from "@/lib/data/repository";
import { locales } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicConfig.appUrl.replace(/\/$/, "");
  const staticPaths = ["", "/feed-terverifikasi", "/kebijakan-privasi", "/syarat-ketentuan"];
  const feed = await getPublicFeedSlugs().catch(() => []);

  return locales.flatMap((locale) => [
    ...staticPaths.map((path) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" || path === "/feed-terverifikasi" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/feed-terverifikasi" ? 0.9 : 0.6,
      alternates: {
        languages: Object.fromEntries(locales.map((item) => [item, `${base}/${item}${path}`])),
      },
    })),
    ...feed.map((item) => ({
      url: `${base}/${locale}/feed-terverifikasi/${item.slug}`,
      lastModified: new Date(item.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map((entry) => [entry, `${base}/${entry}/feed-terverifikasi/${item.slug}`]),
        ),
      },
    })),
  ]);
}
