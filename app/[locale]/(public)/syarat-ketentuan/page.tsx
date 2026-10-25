import type { Metadata } from "next";
import { LegalPage } from "@/components/panacea/legal-page";
import { l } from "@/lib/data/helpers";
import { createTr, type Locale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: createTr(locale)("Syarat & Ketentuan", "Terms & Conditions") };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  const sections = [
    {
      id: "layanan",
      title: l("Sifat layanan", "Nature of the service"),
      paragraphs: [
        l(
          "PANACEA adalah layanan literasi kesehatan dan verifikasi klaim. PANACEA bukan alat diagnosis, bukan resep, dan bukan pengganti konsultasi dengan tenaga kesehatan.",
          "PANACEA is a health literacy and claim verification service. PANACEA is not a diagnostic tool, a prescription, or a substitute for consultation with a health professional.",
        ),
        l(
          "Analisis awal AI selalu diberi label. Hanya putusan reviewer terautentikasi yang dapat dianggap sebagai verifikasi pakar.",
          "Initial AI analysis is always labelled. Only authenticated reviewer verdicts may be considered expert verification.",
        ),
      ],
    },
    {
      id: "akun",
      title: l("Akun dan akses", "Accounts and access"),
      paragraphs: [
        l(
          "Pendaftaran mandiri hanya membuat akun User. Akun reviewer dan admin dibuat melalui proses admin yang diaudit. Kamu bertanggung jawab menjaga kredensial dan segera memberi tahu jika ada akses tidak sah.",
          "Self-registration only creates a User account. Reviewer and admin accounts are created through an audited admin process. You are responsible for keeping credentials secure and reporting unauthorised access promptly.",
        ),
        l(
          "Tidak tersedia fitur reset atau lupa password. Pengguna yang masih dapat masuk dapat mengganti password dari halaman profil setelah verifikasi sesi.",
          "There is no reset or forgot password flow. Users who can still sign in may change their password from the profile page after session verification.",
        ),
      ],
    },
    {
      id: "konten",
      title: l("Konten pengguna", "User content"),
      paragraphs: [
        l(
          "Kamu tidak boleh mengirim konten yang melanggar hukum, mengancam, menyerang personal, membagikan data pribadi orang lain tanpa izin, atau mencoba mengakali moderasi.",
          "You must not submit unlawful content, threats, personal attacks, other people's personal data without permission, or attempts to circumvent moderation.",
        ),
        l(
          "Komentar dapat ditahan, dikembalikan untuk revisi, disembunyikan, atau dihapus sesuai kebijakan moderasi. Keputusan penting dicatat untuk audit.",
          "Comments may be held, returned for revision, hidden, or removed under moderation policy. Important decisions are recorded for audit.",
        ),
      ],
    },
    {
      id: "klaim",
      title: l("Klaim dan laporan pakar", "Claims and expert reports"),
      paragraphs: [
        l(
          "Saat mengirim klaim, kamu memberi izin terbatas kepada reviewer yang ditugaskan untuk melihat konteks yang diperlukan. Identitas pelapor tidak ditampilkan di feed publik.",
          "When submitting a claim, you give assigned reviewers limited permission to view the context they need. Reporter identity is not shown in the public feed.",
        ),
        l(
          "Kamu memahami bahwa ringkasan putusan pakar dapat dipublikasikan otomatis secara anonim setelah putusan kanonis tersimpan. Kamu tidak diwajibkan mempublikasikan identitas pribadi.",
          "You understand that the expert verdict summary may be published automatically and anonymously after the canonical verdict is stored. You are not required to publish personal identity.",
        ),
        l(
          "Klaim berisiko tinggi dapat menampilkan peringatan konteks dan mungkin tidak dipublikasikan sebagai kepastian bila bukti tidak memadai.",
          "High-risk claims may show context warnings and may not be published as certain when evidence is insufficient.",
        ),
      ],
    },
    {
      id: "game",
      title: l("Game, XP, dan badge", "Game, XP, and badges"),
      paragraphs: [
        l(
          "XP, streak, dan badge dihitung di server. Klien tidak dapat menetapkan skor atau status reward. Upaya memanipulasi permainan dapat menyebabkan pembatasan akun.",
          "XP, streaks, and badges are calculated server-side. Clients cannot set scores or reward status. Attempts to manipulate the game may lead to account restrictions.",
        ),
        l(
          "Badge bersifat permanen dan tidak hilang ketika streak terputus. Perubahan ambang badge hanya berlaku untuk pencapaian baru.",
          "Badges are permanent and do not disappear when a streak breaks. Changes to badge thresholds only apply to new achievements.",
        ),
      ],
    },
    {
      id: "tanggung-jawab",
      title: l("Batasan tanggung jawab", "Limitation of liability"),
      paragraphs: [
        l(
          "Informasi disediakan untuk tujuan literasi. Keputusan kesehatan tetap menjadi tanggung jawab pengguna bersama tenaga kesehatan. Dalam keadaan darurat, hubungi layanan kesehatan terdekat.",
          "Information is provided for literacy purposes. Health decisions remain the responsibility of the user together with health professionals. In an emergency, contact local health services.",
        ),
      ],
    },
    {
      id: "perubahan",
      title: l("Perubahan ketentuan", "Changes to these terms"),
      paragraphs: [
        l(
          "Ketentuan dapat diperbarui untuk mencerminkan perubahan produk, hukum, atau praktik keamanan. Perubahan material akan diumumkan melalui kanal yang tersedia.",
          "These terms may be updated to reflect product, legal, or security changes. Material changes will be announced through available channels.",
        ),
      ],
    },
  ];

  return (
    <LegalPage
      locale={locale}
      title={l("Syarat & Ketentuan", "Terms & Conditions")}
      intro={l(
        "Aturan penggunaan PANACEA, batas layanan kesehatan, dan tanggung jawab pengguna.",
        "Rules for using PANACEA, the boundaries of the health service, and user responsibilities.",
      )}
      updatedAt="2026-10-01T00:00:00+07:00"
      sections={sections}
    />
  );
}
