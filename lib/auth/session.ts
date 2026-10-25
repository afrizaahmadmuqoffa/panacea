import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";
import type { UserRole } from "@/lib/types";

export type Session = {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  alias: string;
};

export function roleHome(locale: Locale, role: UserRole) {
  if (role === "admin") return `/${locale}/admin/dashboard`;
  if (role === "reviewer") return `/${locale}/reviewer/dashboard`;
  return `/${locale}/dashboard`;
}

function isRole(value: unknown): value is UserRole {
  return value === "user" || value === "reviewer" || value === "admin";
}

export async function getSession(): Promise<Session | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.warn("[auth] getUser failed", {
      code: error.code,
      status: error.status,
      message: error.message,
    });
  }
  if (!user) return null;

  const [{ data: roleData }, { data: profile }] = await Promise.all([
    supabase.rpc("get_my_role"),
    supabase.from("profiles").select("full_name, alias").eq("id", user.id).maybeSingle(),
  ]);

  const role = isRole(roleData) ? roleData : "user";
  const fallbackName = user.email?.split("@")[0] ?? "Anggota";
  return {
    userId: user.id,
    email: user.email ?? "",
    role,
    fullName: profile?.full_name ?? fallbackName,
    alias: profile?.alias ?? fallbackName,
  };
}

export async function requireSession(locale: Locale): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/${locale}/masuk`);
  return session;
}

export async function requireRole(locale: Locale, allowed: UserRole[]): Promise<Session> {
  const session = await requireSession(locale);
  if (!allowed.includes(session.role)) redirect(roleHome(locale, session.role));
  return session;
}

export function roleSatisfies(role: UserRole, allowed: UserRole[]) {
  return allowed.includes(role);
}
