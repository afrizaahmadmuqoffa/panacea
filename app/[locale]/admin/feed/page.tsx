import type { Metadata } from "next";
import { AdminFeed } from "@/components/admin/admin-feed";
import { getAdminFeed } from "@/lib/admin/repository";

export const metadata: Metadata = {
  title: "Kelola Feed Terverifikasi",
};

export const dynamic = "force-dynamic";

export default async function AdminFeedPage() {
  const items = await getAdminFeed();
  return <AdminFeed items={items} />;
}
