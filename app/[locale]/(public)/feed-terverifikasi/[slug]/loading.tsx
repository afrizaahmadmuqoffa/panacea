import { FeedDetailSkeleton } from "@/components/skeletons/public";
import "@/app/[locale]/(public)/panacea-public.css";
import "@/app/[locale]/(public)/panacea-feed.css";
import "@/app/[locale]/(public)/panacea-app.css";

export default function Loading() {
  return <FeedDetailSkeleton />;
}
