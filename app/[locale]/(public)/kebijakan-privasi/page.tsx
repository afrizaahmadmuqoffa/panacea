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
  return { title: createTr(locale)("Kebijakan Privasi", "Privacy Policy") };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  const sections = [
    {
      id: "data",
      title: l("Data yang kami kumpulkan", "Data we collect"),
      paragraphs: [
        l(
          "Kami menyimpan data akun, konten yang kamu kirim untuk dicek, laporan ke pakar, aktivitas forum, dan aktivitas debunk game.",
          "We store account data, content you submit for checking, reports to experts, forum activity, and debunk game activity.",
        ),
      ],
    },
    {
      id: "penggunaan",
      title: l("Cara data digunakan", "How data is used"),
      paragraphs: [
        l(
          "Data kamu digunakan untuk:",
          "Your data is used to:",
        ),
      ],
      list: [
        l("membuat dan mengelola akunmu.", "Creating and managing your account."),
        l("menganalisis klaim yang kamu kirim.", "Analyzing the claims you submit."),
        l("meneruskan laporanmu ke pakar.", "Forwarding your reports to experts."),
        l("menjalankan forum diskusi.", "Operating the discussion forum."),
        l("menjalankan aktivitas debunk game.", "Running the debunk game activity."),
        l("menjaga keamanan layanan, mencegah penyalahgunaan, dan memperbaiki kualitas layanan.", "Maintaining service security, preventing abuse, and improving service quality."),
      ],
    },
    {
      id: "publikasi",
      title: l("Publikasi anonim di feed", "Anonymous publication in the feed"),
      paragraphs: [
        l(
          "Feed publik hanya memuat salinan yang telah disunting reviewer. Nama, email, ID akun, ID klaim privat, alasan laporan, file asli, dan tautan ke riwayat privat tidak ditampilkan dan tidak dimasukkan ke metadata SEO, analytics publik, atau API feed.",
          "The public feed only contains a copy edited by the reviewer. Names, emails, account IDs, private claim IDs, report reasons, original files, and links to private history are not displayed and are not included in SEO metadata, public analytics, or the feed API.",
        ),
      ],
    },
    {
      id: "keamanan",
      title: l("Keamanan", "Security"),
      paragraphs: [
        l(
          "Kami memakai langkah teknis dan organisasi yang wajar untuk melindungi datamu. Tidak ada sistem yang sepenuhnya kebal. Jika terjadi kegagalan pelindungan data pribadi, kami akan memberi tahu kamu dan pihak yang berwenang sesuai ketentuan hukum yang berlaku.",
          "We employ reasonable technical and organizational measures to protect your data. No system is entirely invulnerable. In the event of a personal data protection breach, we will notify you and the relevant authorities in accordance with applicable laws.",
        ),
      ],
    },
    {
      id: "hak",
      title: l("Hak kamu", "Your rights"),
      paragraphs: [
        l(
          "Sesuai UU Pelindungan Data Pribadi (UU No. 27 Tahun 2022), kamu berhak untuk:",
          "Under the Personal Data Protection Law (Law No. 27 of 2022), you have the right to:",
        ),
      ],
      list: [
        l("Mendapat informasi tentang pemrosesan datamu", "Receive information about the processing of your data"),
        l("Mengakses dan meminta salinan datamu", "Access and request a copy of your data"),
        l("Meminta penghapusan datamu", "Request the deletion of your data"),
        l("Menarik persetujuan yang pernah kamu berikan", "Withdraw consent you have previously given"),
        l("Mengajukan keberatan atas keputusan yang diambil semata-mata dari pemrosesan otomatis, seperti komentar yang ditahan moderasi AI", "Object to decisions made solely through automated processing, such as comments held for AI moderation"),
      ],
    },

    {
      id: "kontak",
      title: l("Kontak", "Contact"),
      paragraphs: [
        l(
          "Pertanyaan privasi dapat disampaikan melalui kanal kontak resmi yang tersedia di situs.",
          "Privacy questions can be sent through the official contact channel available on the site.",
        ),
      ],
    },
  ];

  return (
    <LegalPage
      locale={locale}
      title={l("Kebijakan Privasi", "Privacy Policy")}
      intro={l(
        "Ringkasan bagaimana PANACEA mengumpulkan, menggunakan, dan melindungi data, termasuk batas publikasi anonim.",
        "A summary of how PANACEA collects, uses, and protects data, including the boundaries of anonymous publication.",
      )}
      updatedAt="2026-10-01T00:00:00+07:00"
      sections={sections}
    />
  );
}
