import { redirect } from "next/navigation";
import { getSession, roleHome } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import "@/components/auth/panacea-auth.css";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (session) redirect(roleHome(locale as Locale, session.role));
  return <div className="panacea-auth">{children}</div>;
}
