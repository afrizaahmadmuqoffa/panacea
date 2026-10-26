import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { createTr, type Locale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: createTr(locale)("Daftar", "Join"),
    robots: { index: false, follow: false },
  };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const tr = createTr(locale);
  return (
    <AuthShell
      locale={locale}
      variant="daftar"
      title={tr("Buat Akun PANACEA Gratis.", "Create PANACEA Account for Free.")}
      description={tr(
        "Buat akun gratis untuk memeriksa klaim, menyimpan riwayat, dan belajar bersama komunitas.",
        "Create a free account to check claims, keep your history, and learn with the community.",
      )}
    >
      <RegisterForm />
    </AuthShell>
  );
}
