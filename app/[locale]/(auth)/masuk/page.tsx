import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { createTr, type Locale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: createTr(locale)("Masuk", "Sign in"),
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const tr = createTr(locale);
  return (
    <AuthShell
      locale={locale}
      title={tr("Selamat datang kembali.", "Welcome back.")}
      description={tr(
        "Masuk ke akunmu untuk melanjutkan pemeriksaan klaim dan melihat riwayat verifikasi.",
        "Sign in to your account to continue checking claims and view your verification history.",
      )}
    >
      <LoginForm />
    </AuthShell>
  );
}
