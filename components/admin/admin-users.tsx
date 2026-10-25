"use client";

import {
  FilterX,
  KeyRound,
  LoaderCircle,
  Power,
  Search,
  SearchX,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { setUserStatusAction } from "@/lib/actions/admin";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrap, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StatusBadge } from "@/components/panacea/status-badge";
import { formatDate } from "@/lib/i18n/format";
import type { AdminUser } from "@/lib/types";

type PendingAction = { type: "toggle" | "revoke"; user: AdminUser };

export function AdminUsers({ users }: { users: AdminUser[] }) {
  const { locale, tr } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirming, setConfirming] = useState(false);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users
      .filter((user) => role === "all" || user.role === role)
      .filter((user) => status === "all" || (status === "active" ? user.isActive : !user.isActive))
      .filter(
        (user) =>
          !normalized ||
          user.fullName.toLowerCase().includes(normalized) ||
          user.email.toLowerCase().includes(normalized),
      );
  }, [users, query, role, status]);

  const hasQuery = query.trim().length > 0;
  const isFiltered = hasQuery || role !== "all" || status !== "all";

  const roleLabel = (value: AdminUser["role"]) =>
    value === "admin" ? tr("Admin", "Admin") : value === "reviewer" ? tr("Reviewer", "Reviewer") : tr("User", "User");

  async function confirm() {
    if (!pending) return;
    setConfirming(true);
    try {
      const action = pending.type === "toggle" ? (pending.user.isActive ? "deactivate" : "activate") : "revoke_sessions";
      const result = await setUserStatusAction(locale, pending.user.id, action);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        action === "deactivate"
          ? tr("Akun dinonaktifkan.", "Account deactivated.")
          : action === "activate"
            ? tr("Akun diaktifkan kembali.", "Account reactivated.")
            : tr(
                "Sesi refresh dicabut. Pengguna harus masuk lagi setelah token akses kedaluwarsa.",
                "Refresh sessions revoked. The user must sign in again after the access token expires.",
              ),
      );
      setPending(null);
      router.refresh();
    } finally {
      setConfirming(false);
    }
  }

  const actionCopy = pending
    ? pending.type === "toggle"
      ? pending.user.isActive
        ? {
            title: tr("Nonaktifkan akun?", "Deactivate account?"),
            body: tr(
              "Pengguna tidak dapat masuk dan akses data baru. Riwayat, audit, dan jejak verifikasi tetap disimpan.",
              "The user cannot sign in or access new data. History, audit, and verification records are preserved.",
            ),
            label: tr("Ya, nonaktifkan", "Yes, deactivate"),
          }
        : {
            title: tr("Aktifkan kembali akun?", "Reactivate account?"),
            body: tr("Pengguna dapat kembali mengakses sesuai perannya.", "The user can access the service again according to their role."),
            label: tr("Ya, aktifkan", "Yes, reactivate"),
          }
      : {
          title: tr("Cabut semua sesi?", "Revoke all sessions?"),
          body: tr(
            "Semua perangkat kehilangan sesi refresh. Pengguna harus masuk kembali. Token akses yang sudah terbit tetap berlaku sampai kedaluwarsa.",
            "All devices lose their refresh sessions. The user must sign in again. Access tokens already issued remain valid until they expire.",
          ),
          label: tr("Cabut sesi", "Revoke sessions"),
        }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Pengguna", "Users")}
        title={tr("Kelola akun dan akses", "Manage accounts and access")}
        description={tr(
          "Cari pengguna, aktifkan atau nonaktifkan akun, dan cabut sesi login. Mencabut sesi menghapus refresh token; token akses yang sudah terbit tetap berlaku sampai kedaluwarsa. Admin tidak dapat melihat atau menyetel ulang password.",
          "Search users, activate or deactivate accounts, and revoke login sessions. Revoking sessions removes refresh tokens; access tokens already issued remain valid until they expire. Admins cannot view or reset passwords.",
        )}
        actions={
          <Badge variant="sage">
            <Users className="size-3.5" aria-hidden="true" />
            {users.length} {tr("akun", "accounts")}
          </Badge>
        }
      />

      <div className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-bark-500" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr("Cari nama atau email...", "Search name or email...")} className="pl-11" aria-label={tr("Cari pengguna", "Search users")} />
          </div>
          <Select value={role} onChange={(event) => setRole(event.target.value)} aria-label={tr("Filter peran", "Filter role")} className="md:w-40">
            <option value="all">{tr("Semua peran", "All roles")}</option>
            <option value="user">User</option>
            <option value="reviewer">Reviewer</option>
            <option value="admin">Admin</option>
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={tr("Filter status", "Filter status")} className="md:w-40">
            <option value="all">{tr("Semua status", "All statuses")}</option>
            <option value="active">{tr("Aktif", "Active")}</option>
            <option value="inactive">{tr("Nonaktif", "Inactive")}</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-bark-700">{visible.length} {tr("pengguna", "users")}</p>
        <Badge variant="sky">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {tr("Aksi diaudit", "Audited actions")}
        </Badge>
      </div>

      {visible.length > 0 ? (
        <>
          <div className="hidden lg:block">
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>{tr("Pengguna", "User")}</TH>
                    <TH>{tr("Peran", "Role")}</TH>
                    <TH>{tr("Status", "Status")}</TH>
                    <TH>{tr("Bergabung", "Joined")}</TH>
                    <TH>{tr("Aktif terakhir", "Last active")}</TH>
                    <TH>{tr("Aksi", "Actions")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {visible.map((user) => (
                    <TR key={user.id}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={user.fullName} size="sm" />
                          <div>
                            <p className="text-xs font-extrabold text-bark-900">{user.fullName}</p>
                            <p className="text-xs text-bark-500">{user.email}</p>
                          </div>
                        </div>
                      </TD>
                      <TD><Badge variant={user.role === "admin" ? "butter" : user.role === "reviewer" ? "sky" : "default"}>{roleLabel(user.role)}</Badge></TD>
                      <TD><StatusBadge status={user.isActive ? "active" : "inactive"} /></TD>
                      <TD className="whitespace-nowrap text-xs">{formatDate(user.joinedAt, locale)}</TD>
                      <TD className="whitespace-nowrap text-xs">{formatDate(user.lastActiveAt, locale)}</TD>
                      <TD>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="size-11" onClick={() => setPending({ type: "toggle", user })} aria-label={user.isActive ? tr("Nonaktifkan", "Deactivate") : tr("Aktifkan", "Activate")}>
                            <Power className="size-3.5" aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-11" onClick={() => setPending({ type: "revoke", user })} aria-label={tr("Cabut sesi", "Revoke sessions")}>
                            <KeyRound className="size-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </div>

          <div className="grid gap-3 lg:hidden">
            {visible.map((user) => (
              <article key={user.id} className="rounded-[22px] border border-[#eae5d9] bg-[#fffdf8] p-4 cozy-shadow cozy-hover hover:border-sage-300">
                <div className="flex items-start gap-3">
                  <Avatar name={user.fullName} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-bark-900">{user.fullName}</p>
                    <p className="truncate text-xs text-bark-500">{user.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge variant={user.role === "admin" ? "butter" : user.role === "reviewer" ? "sky" : "default"}>{roleLabel(user.role)}</Badge>
                      <StatusBadge status={user.isActive ? "active" : "inactive"} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3 text-xs text-bark-500">
                  <span>{formatDate(user.lastActiveAt, locale)}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-11" onClick={() => setPending({ type: "toggle", user })} aria-label={tr("Aktif/nonaktif", "Activate/deactivate")}><Power className="size-3.5" aria-hidden="true" /></Button>
                    <Button variant="ghost" size="icon" className="size-11" onClick={() => setPending({ type: "revoke", user })} aria-label={tr("Cabut sesi", "Revoke sessions")}><KeyRound className="size-3.5" aria-hidden="true" /></Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : isFiltered ? (
        <EmptyState
          icon={hasQuery ? SearchX : FilterX}
          state="filtered"
          title={tr("Tidak ada pengguna yang cocok", "No matching users")}
          description={tr("Ubah kata kunci atau filter.", "Adjust the keyword or filters.")}
          action={<Button variant="secondary" onClick={() => { setQuery(""); setRole("all"); setStatus("all"); }}>{tr("Hapus filter", "Clear filters")}</Button>}
        />
      ) : (
        <EmptyState
          icon={Users}
          state="none"
          title={tr("Belum ada pengguna", "No users yet")}
          description={tr("Akun anggota dan reviewer akan tampil di sini.", "Member and reviewer accounts will appear here.")}
        />
      )}

      <div className="flex gap-2.5 rounded-lg border border-butter-300 bg-[#fff7de] p-4 text-xs leading-relaxed text-bark-700">
        <UserRound className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          {tr(
            "Email unik per akun. Pendaftaran mandiri hanya membuat peran User. Perubahan role reviewer/admin dilakukan melalui fungsi admin yang diaudit.",
            "Email is unique per account. Self-registration only creates a User role. Reviewer/admin role changes go through an audited admin function.",
          )}
        </p>
      </div>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => { if (!open) setPending(null); }}
        title={actionCopy?.title ?? ""}
        description={actionCopy?.body}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)} disabled={confirming}>{tr("Batal", "Cancel")}</Button>
            <Button variant={pending?.type === "toggle" && pending.user.isActive ? "destructive" : "primary"} onClick={confirm} disabled={confirming}>
              {confirming ? <LoaderCircle className="size-4 spin" aria-hidden="true" /> : null}
              {confirming ? tr("Memproses...", "Processing...") : actionCopy?.label}
            </Button>
          </>
        }
      />
    </div>
  );
}
