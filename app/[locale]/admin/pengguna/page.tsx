import type { Metadata } from "next";
import { AdminUsers } from "@/components/admin/admin-users";
import { getAdminUsers } from "@/lib/admin/repository";

export const metadata: Metadata = {
  title: "Manajemen Pengguna",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();
  return <AdminUsers users={users} />;
}
