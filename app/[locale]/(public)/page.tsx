import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Check,
  Flower2,
  Search,
  SearchCheck,
  Smile,
  Sparkle,
  Sparkles,
  Sun,
} from "lucide-react";
import { FaqList } from "@/components/panacea/faq-list";
import { PanaMascot } from "@/components/panacea/pana-mascot";
import { LandingReveal } from "@/components/panacea/landing-reveal";
import { createTr, type Locale } from "@/lib/i18n/config";
import "@/app/[locale]/(public)/panacea-public.css";
import "@/app/[locale]/(public)/panacea-app.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tr = createTr(locale);
  return {
    title: tr("Cek Kebenaran Klaim Kesehatan dengan cepat.", "Quickly Check the Accuracy of Health Claims."),
    description: tr(
      "Jangan langsung percaya info di grup WhatsApp atau TikTok. PANACEA bantu kamu verifikasi klaim kesehatan lewat riset ilmiah dan tinjauan pakar.",
      "Don't immediately trust information shared in WhatsApp groups or on TikTok. PANACEA helps you verify health claims through scientific research and expert review.",
    ),
  };
}

export default async function LandingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const tr = createTr(locale);

  const faqs = [
    {
      q: tr("Apakah jawaban AI PANACEA selalu benar?", "Is PANACEA's AI answer always right?"),
      a: tr(
        "Tidak. AI dapat keliru atau memiliki keterbatasan sumber. PANACEA menampilkan analisis awal beserta bukti yang ditemukan, sedangkan putusan verifikasi pakar dipisahkan dengan jelas.",
        "No. AI can make mistakes or have limitations in its sources. PANACEA presents an initial analysis alongside the evidence it finds, while expert verification verdicts are clearly distinguished from the AI analysis.",
      ),
    },
    {
      q: tr("Apa bedanya analisis AI dan hasil verifikasi?", "What is the difference between AI analysis and verification results?"),
      a: tr(
        "Analisis AI adalah penelusuran awal untuk membantu memahami klaim dan sumber. Hasil verifikasi adalah putusan reviewer/pakar setelah meninjau bukti. Keduanya tidak boleh dianggap sama.",
        "AI analysis is an initial exploration to help understand a claim and its sources. Verification results are the verdict given by a reviewer or expert after examining the evidence. The two should not be considered the same.",
      ),
    },
    {
      q: tr("Apakah klaim yang saya kirim akan dipublikasikan?", "Will the claim I submit be published?"),
      a: tr(
        "Klaim dan laporan asli bersifat privat. Jika pakar menyelesaikan review, ringkasan yang telah ditinjau dapat diterbitkan otomatis ke feed dengan menjaga privasi pelapor, akun, dan file asli.",
        "The original claim and report remain private. Once an expert completes the review, a reviewed summary may be automatically published to the feed while protecting the reporter's identity, account, and original files.",
      ),
    },
    {
      q: tr("Dari mana bukti dan sumbernya berasal?", "Where do the evidence and sources come from?"),
      a: tr(
        "PANACEA memprioritaskan Knowledge Base internal yang telah dikurasi, kemudian dapat mencari literatur eksternal seperti Europe PMC ketika bukti internal belum memadai. Sumber yang digunakan ditampilkan agar dapat diperiksa.",
        "PANACEA prioritises its curated internal Knowledge Base and can then search external literature, such as Europe PMC, when the available internal evidence is insufficient. The sources used are displayed so they can be checked.",
      ),
    },
    {
      q: tr("Apakah PANACEA bisa mendiagnosis atau memberi resep?", "Can PANACEA diagnose or prescribe medication?"),
      a: tr(
        "Tidak. PANACEA adalah platform literasi dan verifikasi informasi kesehatan. Platform ini tidak mendiagnosis, meresepkan obat, atau menggantikan pemeriksaan dan keputusan klinis.",
        "No. PANACEA is a health information literacy and verification platform. It does not diagnose conditions, prescribe medication, or replace medical examinations and clinical decisions.",
      ),
    },
  ];

  return (
    <div className="panacea-landing">
      <LandingReveal />

      <section className="hero section-shell" aria-labelledby="hero-title">
        <div className="hero-sky" aria-hidden="true">
          <span className="sun-glow" />
          <span className="sun" />
          <span className="cloud cloud-one">
            <i />
            <b />
            <em />
          </span>
          <span className="cloud cloud-two">
            <i />
            <b />
            <em />
          </span>
          <span className="sparkle sparkle-one">✦</span>
          <span className="sparkle sparkle-two">✧</span>
          <span className="sparkle sparkle-three">✦</span>
          <span className="flying-leaf leaf-one">✦</span>
          <span className="flying-leaf leaf-two">❋</span>
        </div>
        <div className="hero-grid wrap">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-icon">
                <Sparkle size={13} aria-hidden="true" />
              </span>{" "}
              {tr("Verifikasi klaim kesehatan berbasis AI", "AI-based health claim verification")}
            </div>
            <h1 id="hero-title">
              {tr("Cek Kebenaran Klaim Kesehatan", "Check the Accuracy of Health Claims")}
              <br />
              <span className="headline-highlight">{tr("Dengan cepat.", "Quickly.")}</span>
            </h1>
            <p className="hero-lead">
              {tr(
                "Jangan langsung percaya info di grup WhatsApp atau TikTok. PANACEA bantu kamu verifikasi klaim kesehatan lewat riset ilmiah dan tinjauan pakar.",
                "Don't immediately trust information shared in WhatsApp groups or on TikTok. PANACEA helps you verify health claims through scientific research and expert review.",
              )}
            </p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" href={`/${locale}/cek-klaim`}>
                {tr("Cek klaim sekarang", "Check a claim now")}{" "}
                <span className="button-icon" aria-hidden="true">
                  <ArrowUpRight size={16} />
                </span>
              </Link>
              <Link className="button button-soft button-large" href={`/${locale}/feed-terverifikasi`}>
                <span className="button-play" aria-hidden="true">
                  <SearchCheck size={12} />
                </span>{" "}
                {tr("Jelajahi hasil verifikasi", "Explore verification results")}
              </Link>
            </div>
            <div className="hero-proof">
              <span className="proof-avatars" aria-hidden="true">
                <i>
                  <Flower2 size={14} />
                </i>
                <i>
                  <Search size={14} />
                </i>
                <i>
                  <Check size={14} />
                </i>
              </span>
              <span>
                <strong>{tr("Bukti dulu, baru percaya.", "Evidence first, then trust.")}</strong>
                <br />
                {tr("Analisis AI bukan putusan akhir.", "AI analysis is not the final verdict.")}
              </span>
            </div>
            <div className="hero-note">
              <span className="note-star">
                <Sparkles size={16} />
              </span>
              <span>
                {tr("Rasa ingin tahu", "Curiosity.")}
                <br />
                <b>{tr("Dengan bukti", "With evidence.")}</b>
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label={tr(
              "Ilustrasi taman bukti PANACEA dengan tempat untuk maskot Pana",
              "An illustration of PANACEA's evidence garden with a space for the Pana mascot",
            )}
          >
            <div className="art-label label-evidence">
              <span className="mini-icon mini-book">
                <BookOpen size={18} />
              </span>
              <span>
                <b>{tr("Telusuri bukti", "Trace the evidence")}</b>
                <small>{tr("Sumber yang bisa diperiksa", "Verifiable sources")}</small>
              </span>
            </div>
            <div className="art-label label-human">
              <span className="mini-icon mini-check">
                <BadgeCheck size={18} />
              </span>
              <span>
                <b>{tr("Ditinjau pakar", "Reviewed by experts")}</b>
                <small>{tr("Manusia tetap berperan", "Humans still matter")}</small>
              </span>
            </div>
            <div className="orbit orbit-back" />
              <div className="orbit orbit-front" />
              <div className="floating-book book-back">
                <span />
                <i />
              </div>
              <div className="floating-leaf leaf-big">✦</div>
              <div className="hero-speech">
                {tr("Salam kenal, Namaku Pana!", "Nice to meet you! My name is Pana!")}{" "}
                <i aria-hidden="true">
                  <Smile size={12} />
                </i>
              </div>
            <div className="hero-island">
              <div className="island-top" />
              <div className="island-side" />
              <div className="hill hill-back" />
              <div className="hill hill-mid" />
              <div className="hill hill-front" />
              <div className="tiny-house">
                <div className="house-roof" />
                <div className="house-body">
                  <span className="house-window" />
                  <span className="house-door" />
                </div>
                <div className="house-flower">✿</div>
              </div>
              <div className="tree tree-left" aria-hidden="true">
                <svg viewBox="0 0 120 170" role="presentation">
                  <path
                    d="M52 158 Q59 119 57 83 L48 60 L29 45 L34 39 L56 55 L65 38 L72 41 L64 67 Q70 105 68 158Z"
                    fill="#a97f58"
                  />
                  <path
                    d="M58 112 L42 91 L45 86 L61 100 M64 91 L80 72 L85 75 L69 103"
                    fill="none"
                    stroke="#a77b55"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <ellipse cx="59" cy="59" rx="40" ry="43" fill="#8fbd7e" />
                  <circle cx="31" cy="74" r="25" fill="#91c184" />
                  <circle cx="82" cy="74" r="26" fill="#a8cf8e" />
                  <circle cx="42" cy="43" r="24" fill="#b8d99b" />
                  <circle cx="72" cy="39" r="25" fill="#8fbd7e" />
                  <ellipse cx="48" cy="30" rx="13" ry="6" fill="#d2e8b4" opacity=".6" />
                </svg>
              </div>
              <div className="tree tree-right" aria-hidden="true">
                <svg viewBox="0 0 120 170" role="presentation">
                  <path
                    d="M52 158 Q59 119 57 83 L48 60 L29 45 L34 39 L56 55 L65 38 L72 41 L64 67 Q70 105 68 158Z"
                    fill="#a97f58"
                  />
                  <path
                    d="M58 112 L42 91 L45 86 L61 100 M64 91 L80 72 L85 75 L69 103"
                    fill="none"
                    stroke="#a77b55"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <ellipse cx="59" cy="59" rx="40" ry="43" fill="#8fbd7e" />
                  <circle cx="31" cy="74" r="25" fill="#91c184" />
                  <circle cx="82" cy="74" r="26" fill="#a8cf8e" />
                  <circle cx="42" cy="43" r="24" fill="#b8d99b" />
                  <circle cx="72" cy="39" r="25" fill="#8fbd7e" />
                  <ellipse cx="48" cy="30" rx="13" ry="6" fill="#d2e8b4" opacity=".6" />
                </svg>
              </div>
              <div className="flower flower-one">✿</div>
              <div className="flower flower-two">✿</div>
              <div className="flower flower-three">✿</div>
              <div className="mushroom" aria-hidden="true">
                <svg viewBox="0 0 72 76" role="presentation">
                  <path
                    d="M27 35 Q29 29 35 31 Q43 29 46 36 L49 67 Q37 73 24 67Z"
                    fill="#fff4d9"
                    stroke="#e5c69b"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M5 35 C7 16 22 7 37 7 C53 7 67 18 68 35 C52 43 21 43 5 35Z"
                    fill="#e9947d"
                    stroke="#d7806a"
                    strokeWidth="2"
                  />
                  <ellipse cx="27" cy="20" rx="6" ry="4.5" fill="#fff3d8" />
                  <ellipse cx="48" cy="27" rx="4.5" ry="3.5" fill="#fff3d8" />
                  <ellipse cx="18" cy="31" rx="3.5" ry="2.5" fill="#fff3d8" />
                  <path d="M11 35 Q36 42 62 35" fill="none" stroke="#c97561" strokeWidth="2" />
                </svg>
              </div>
              <div className="pathway" />
              <div className="mascot-placeholder mascot-hero" role="img" aria-label={tr("Tempat gambar maskot Pana", "Placeholder for the Pana mascot")}>
                <PanaMascot pose="hero" />
              </div>
              <div className="magnifier-prop" aria-hidden="true">
                <svg viewBox="0 0 90 112" role="presentation">
                  <g transform="rotate(-2 42 42)">
                    <path
                      d="M52 57 L72 82 Q77 88 71 94 Q65 99 60 92 L40 66Z"
                      fill="#c49a54"
                      stroke="#8e663a"
                      strokeWidth="2.5"
                    />
                    <path d="M58 73 L69 86 Q72 90 68 93 L54 76Z" fill="#8e663a" opacity=".35" />
                    <circle cx="38" cy="38" r="29" fill="#c49a54" />
                    <circle cx="38" cy="38" r="22.5" fill="#e8f6f7" stroke="#fff0c7" strokeWidth="3" />
                    <path d="M24 24 Q33 15 44 19" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".85" />
                  </g>
                </svg>
              </div>
            </div>
            <div className="art-caption">
              <span className="caption-dot" />
              {tr("Selamat datang di PANACEA", "Welcome to PANACEA")}
            </div>
            <span className="scene-cloud scene-cloud-a" />
            <span className="scene-cloud scene-cloud-b" />
          </div>
        </div>
        <div className="hero-bottom-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0 44C150 88 266 8 420 39s237 63 382 31 250-40 363-10 177 32 275-5v65H0Z" fill="#e8f2e3" />
            <path d="M0 75c160-33 244 31 420 12s260-30 400-2 243 27 367 1 183-13 253 0v34H0Z" fill="#f4f0dc" />
          </svg>
        </div>
      </section>

      <section className="problem section-pad" id="masalah" aria-labelledby="problem-title">
        <div className="wrap">
          <div className="section-heading centered reveal">
            <span className="section-kicker">
              {tr("Masalah", "The Problem")}
            </span>
            <h2 id="problem-title">
              {tr("Banyak Klaim Kesehatan Seliweran", "Health Claims Are Everywhere")}
              <br />
              <span className="text-sage">{tr("Tapi mana yang bisa dipercaya?", "But which ones can you trust?")}</span>
            </h2>
            <p>
              {tr(
                "Informasi di internet sering kali bikin makin bingung. Tanpa bukti jelas, salah langkah bisa berdampak ke kesehatanmu.",
                "Information online can often leave us more confused. Without clear evidence, a wrong decision can affect your health.",
              )}
            </p>
          </div>
          <div className="problem-layout">
            <article className="problem-card problem-card-large reveal">
              <div className="problem-illustration illustration-chat" aria-hidden="true">
                <span className="chat-bubble bubble-pink">“{tr("Katanya...", "They say...")}”</span>
                <span className="chat-bubble bubble-yellow">{tr("100% ampuh!", "100% effective!")}</span>
                <span className="chat-spark">✦</span>
                <span className="phone-shape">
                  <i />
                  <b />
                  <em />
                  <small />
                </span>
              </div>
              <div className="problem-card-copy">
                <span className="number-tag">01 / {tr("Viral", "Viral")}</span>
                <h3>{tr("Hoaks Cepat Menyebar", "Misinformation Spreads Quickly")}</h3>
                <p>
                  {tr(
                    "Pesan berantai dan potongan video viral sering memotong konteks medis yang sebenarnya.",
                    "Chain messages and viral video clips often leave out the actual medical context.",
                  )}
                </p>
              </div>
            </article>
            <article className="problem-card problem-card-small problem-card-lilac reveal">
              <div className="problem-illustration illustration-magnify" aria-hidden="true">
                <span className="paper paper-one" />
                <span className="paper paper-two" />
                <svg className="problem-magnifier-svg" viewBox="0 0 110 132" role="presentation" aria-hidden="true">
                  <path d="M55 58 L88 101" fill="none" stroke="#42685d" strokeWidth="16" strokeLinecap="round" />
                  <path d="M54 59 L86 99" fill="none" stroke="#82b1a0" strokeWidth="11" strokeLinecap="round" />
                  <path d="M60 70 L79 95" fill="none" stroke="#c2ddc8" strokeWidth="3" strokeLinecap="round" opacity=".65" />
                  <circle cx="37" cy="40" r="29" fill="#d3b477" stroke="#8eaa97" strokeWidth="2" />
                  <circle cx="37" cy="40" r="23" fill="#ddf0f0" stroke="#f8fff0" strokeWidth="3.5" />
                  <path d="M22 27 Q31 19 42 23" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".9" />
                </svg>
                <span className="tiny-star">✧</span>
              </div>
              <div className="problem-card-copy">
                <span className="number-tag">02 / {tr("Rumit", "Complicated")}</span>
                <h3>{tr("Bukti ilmiah tidak selalu mudah dipahami.", "Scientific evidence is not always easy to understand.")}</h3>
                <p>
                  {tr(
                    "Bahasa jurnal yang ribet bikin kita malas mengecek sumber aslinya.",
                    "The technical language used in scientific journals can make us reluctant to check the original sources.",
                  )}
                </p>
              </div>
            </article>
            <article className="problem-card problem-card-small problem-card-peach reveal">
              <div className="problem-illustration illustration-robot" aria-hidden="true">
                <span className="robot-body">
                  <i />
                  <b />
                  <em />
                </span>
                <span className="question q-one">?</span>
                <span className="question q-two">?</span>
                <span className="robot-spark">✦</span>
              </div>
              <div className="problem-card-copy">
                <span className="number-tag">03 / {tr("Belum cukup", "Not Enough")}</span>
                <h3>{tr("Jawaban AI Biasa Suka Ngasal.", "AI Answers Need Checking Too.")}</h3>
                <p>
                  {tr(
                    "Chatbot biasa sering memberikan jawaban yang terkesan meyakinkan, padahal rujukannya tidak valid.",
                    "Chatbots can give convincing-sounding answers even when their references are invalid.",
                  )}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="solution section-pad" id="solusi" aria-labelledby="solution-title">
        <div className="solution-decor solution-decor-one" aria-hidden="true">
          ✿
        </div>
        <div className="solution-decor solution-decor-two" aria-hidden="true">
          ❋
        </div>
        <div className="wrap solution-grid">
          <div className="solution-copy reveal">
            <span className="section-kicker">
              {tr("Solusi", "The Solution")}
            </span>
            <h2 id="solution-title">
              {tr("Bukan Cuma Jawaban", "More Than Just an Answer")}
              <br />
              <span className="text-sage">{tr("Tapi Lengkap dengan Buktinya.", "Complete with Supporting Evidence.")}</span>
            </h2>
            <p>
              {tr(
                "PANACEA menelusuri data medis secara transparan dari sumber terpercaya hingga validasi pakar.",
                "PANACEA transparently traces medical information from trusted sources to expert validation.",
              )}
            </p>
            <ul className="solution-points">
              <li>
                <span className="point-check" aria-hidden="true">
                  <Check size={15} />
                </span>
                <span>
                  <b>{tr("Sumber Medis Terlacak", "Traceable Medical Sources")}</b>
                  <small>{tr("Kamu bisa langsung melihat jurnal dan artikel ilmiah yang menjadi acuan.", "You can view the scientific journals and articles used as references.")}</small>
                </span>
              </li>
              <li>
                <span className="point-check" aria-hidden="true">
                  <Check size={15} />
                </span>
                <span>
                  <b>{tr("Transparan Apa Adanya", "Transparent and Honest")}</b>
                  <small>{tr("Jika bukti ilmiahnya masih terbatas, kami sampaikan sejujurnya tanpa mengarang.", "If scientific evidence is limited, we say so honestly instead of making things up.")}</small>
                </span>
              </li>
              <li>
                <span className="point-check" aria-hidden="true">
                  <Check size={15} />
                </span>
                <span>
                  <b>{tr("Ditinjau Langsung oleh Pakar", "Reviewed Directly by Experts")}</b>
                  <small>
                    {tr(
                      "Analisis AI tetap melewati pengawasan dan verifikasi tenaga medis.",
                      "AI analysis is still subject to oversight and verification by medical professionals.",
                    )}
                  </small>
                </span>
              </li>
            </ul>
          </div>
          <div className="solution-art reveal" aria-label={tr("Ilustrasi taman dengan jalur bukti", "An illustration of a garden with an evidence trail")}>
            <div className="solution-cloud cloud-solution-one" />
            <div className="solution-cloud cloud-solution-two" />
            <div className="solution-sun" />
            <div className="solution-hill hill-solution-back" />
            <div className="solution-hill hill-solution-front" />
            <div className="stepping-stone stone-one">
              <span>01</span>
              <b>{tr("Telusuri", "Trace")}</b>
            </div>
            <div className="stepping-stone stone-two">
              <span>02</span>
              <b>{tr("Bandingkan", "Compare")}</b>
            </div>
            <div className="stepping-stone stone-three">
              <span>03</span>
              <b>{tr("Pahami", "Understand")}</b>
            </div>
            <div className="solution-plant plant-a" aria-hidden="true">
              <svg viewBox="0 0 90 140" role="presentation">
                <path d="M45 136 Q42 88 47 27" fill="none" stroke="#7fb083" strokeWidth="10" strokeLinecap="round" />
                <path d="M39 103 L53 103 M40 72 L53 72 M43 42 L52 42" stroke="#d2e4a6" strokeWidth="3" strokeLinecap="round" />
                <path d="M47 30 Q22 11 8 20 Q22 35 47 34Z" fill="#76a96e" />
                <path d="M47 30 Q64 5 82 9 Q73 29 47 34Z" fill="#a8ca83" />
                <path d="M45 48 Q20 34 5 45 Q21 58 45 52Z" fill="#8bb879" />
                <path d="M48 47 Q70 27 85 35 Q71 52 48 52Z" fill="#6ca16e" />
                <path d="M47 29 L25 20 M48 30 L72 13 M46 49 L19 45 M48 49 L76 37" stroke="#c6dda0" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <div className="solution-plant plant-b" aria-hidden="true">
              <svg viewBox="0 0 90 140" role="presentation">
                <path d="M45 136 Q42 88 47 27" fill="none" stroke="#7fb083" strokeWidth="10" strokeLinecap="round" />
                <path d="M39 103 L53 103 M40 72 L53 72 M43 42 L52 42" stroke="#d2e4a6" strokeWidth="3" strokeLinecap="round" />
                <path d="M47 30 Q22 11 8 20 Q22 35 47 34Z" fill="#76a96e" />
                <path d="M47 30 Q64 5 82 9 Q73 29 47 34Z" fill="#a8ca83" />
                <path d="M45 48 Q20 34 5 45 Q21 58 45 52Z" fill="#8bb879" />
                <path d="M48 47 Q70 27 85 35 Q71 52 48 52Z" fill="#6ca16e" />
                <path d="M47 29 L25 20 M48 30 L72 13 M46 49 L19 45 M48 49 L76 37" stroke="#c6dda0" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <div className="solution-book">
              <span>✦</span>
              <i />
              <b />
            </div>
            <div className="solution-butterfly">✿</div>
            <div className="solution-note">
                <span><SearchCheck aria-hidden="true" /></span>
              <p>
                {tr("Ungkap semua bukti", "Uncover the evidence")}
                <br />
                <b>{tr("klaim kesehatan", "behind health claims.")}</b>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="how section-pad" id="cara-kerja" aria-labelledby="how-title">
        <div className="wrap">
          <div className="section-heading centered reveal">
            <span className="section-kicker">
              {tr("Cara kerja", "How It Works")}
            </span>
            <h2 id="how-title">
              {tr("Dari rasa penasaran", "From curiosity")}
              <br />
              <span className="text-sage">{tr("menuju pemahaman.", "to understanding.")}</span>
            </h2>
            <p>
              {tr(
                "Tiga langkah untuk membantu kamu memahami klaim kesehatan dengan bukti yang dapat ditelusuri.",
                "Three steps to help you understand health claims through traceable evidence.",
              )}
            </p>
          </div>
          <div className="steps-path" aria-label={tr("Tiga langkah kerja PANACEA", "PANACEA's three-step process")}>
            <div className="path-doodle" aria-hidden="true">
              <svg viewBox="0 0 900 100" preserveAspectRatio="none">
                <path
                  d="M10 58C130 0 190 95 300 52S480 3 590 55 760 95 890 30"
                  fill="none"
                  stroke="#c7d9b7"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="5 12"
                />
              </svg>
            </div>
            <article className="step-card step-one reveal">
              <div className="step-visual step-visual-one">
                <span className="step-cloud" />
                <span className="step-document">
                  <i />
                  <b />
                  <em />
                  <small />
                </span>
                <svg className="step-magnifier-svg" viewBox="0 0 100 120" role="presentation" aria-hidden="true">
                  <path d="M49 48 L77 85" fill="none" stroke="#456b60" strokeWidth="13" strokeLinecap="round" />
                  <path d="M49 49 L75 83" fill="none" stroke="#86ad9a" strokeWidth="9" strokeLinecap="round" />
                  <circle cx="32" cy="31" r="25" fill="#7a9f90" stroke="#527b6e" strokeWidth="2" />
                  <circle cx="32" cy="31" r="19" fill="#e6f4f4" stroke="#fffdf4" strokeWidth="3" />
                  <path d="M21 20 Q27 14 35 17" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
                <span className="step-number">01</span>
              </div>
              <div className="step-copy">
                <span className="step-label">{tr("Mulai dari pertanyaanmu", "Start with your question")}</span>
                <h3>{tr("Masukkan klaim", "Submit a claim")}</h3>
                <p>
                  {tr(
                    "Tempel teks, tautan, atau unggah gambar klaim kesehatan yang ingin kamu periksa.",
                    "Paste text, a link, or upload an image of the health claim you want to check.",
                  )}
                </p>
              </div>
            </article>
            <article className="step-card step-two reveal">
              <div className="step-visual step-visual-two">
                <span className="orbit-dot" />
                <span className="evidence-book">
                  <i />
                  <b />
                  <em />
                  <small />
                </span>
                <span className="evidence-leaf">✦</span>
                <span className="step-number">02</span>
              </div>
              <div className="step-copy">
                <span className="step-label">{tr("Lihat lebih dekat", "Take a closer look")}</span>
                <h3>{tr("Telusuri bukti", "Trace the evidence")}</h3>
                <p>
                  {tr(
                    "AI membantu merangkum dan menelusuri sumber. Kamu bisa melihat konteks dan keterbatasan bukti.",
                    "AI helps summarise findings and trace sources. You can see the context and limitations of the evidence.",
                  )}
                </p>
              </div>
            </article>
            <article className="step-card step-three reveal">
              <div className="step-visual step-visual-three">
                <span className="expert-card">
                  <i>✓</i>
                  <b />
                  <em />
                </span>
                <span className="expert-flower">✿</span>
                <span className="step-number">03</span>
              </div>
              <div className="step-copy">
                <span className="step-label">{tr("Untuk hasil yang diverifikasi", "For verified results")}</span>
                <h3>{tr("Pakar meninjau", "Experts review")}</h3>
                <p>
                  {tr(
                    "Laporan yang sesuai diteruskan ke reviewer terkait. Putusan pakar dipublikasikan secara anonim.",
                    "Relevant reports are forwarded to the appropriate reviewers. Expert verdicts are published anonymously.",
                  )}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="faq section-pad" id="faq" aria-labelledby="faq-title">
        <div className="faq-background" aria-hidden="true">
          <span className="faq-cloud" />
          <span className="faq-flower">✿</span>
          <span className="faq-leaf">❋</span>
        </div>
        <div className="wrap faq-grid">
          <div className="faq-intro reveal">
            <span className="section-kicker">
              {tr("FAQ", "FAQ")}
            </span>
            <h2 id="faq-title">
              {tr("Masih Punya Pertanyaan?", "Still Have Questions?")}
              <br />
              <span className="text-sage">{tr("Kami Punya Jawabannya.", "We Have the Answers.")}</span>
            </h2>
            <p>
              {tr(
                "Pelajari bagaimana PANACEA menjaga keakuratan data dan memverifikasi setiap informasi.",
                "Learn how PANACEA maintains information accuracy and verifies every claim.",
              )}
            </p>
            <div className="faq-doodle" aria-hidden="true">
              <div className="faq-mushroom">
                <b />
                <i />
              </div>
              <span>{tr("take your time", "take your time")} ✦</span>
            </div>
          </div>
          <div className="reveal">
            <FaqList items={faqs} />
          </div>
        </div>
      </section>

      <section className="final-cta" aria-labelledby="cta-title">
        <div className="cta-landscape" aria-hidden="true">
          <div className="cta-sky-glow" />
          <div className="cta-cloud cta-cloud-a" />
          <div className="cta-cloud cta-cloud-b" />
          <div className="cta-sun" />
          <svg className="cta-mountain-range" viewBox="0 0 1440 420" preserveAspectRatio="none" role="presentation">
            <path
              d="M0 248 L100 185 170 213 280 100 356 171 430 133 530 220 625 143 700 195 808 88 904 180 1008 125 1115 205 1224 142 1320 198 1440 133 1440 420 0 420Z"
              fill="#d4e5d1"
              opacity=".72"
            />
            <path
              d="M0 286 L110 239 205 258 326 171 420 233 510 201 620 269 744 175 837 238 946 190 1055 260 1164 207 1280 260 1380 207 1440 228 1440 420 0 420Z"
              fill="#b7d3ae"
              opacity=".8"
            />
            <path
              d="M0 315 Q145 254 270 302 T520 298 T780 286 T1030 305 T1260 274 T1440 295 L1440 420 0 420Z"
              fill="#a8c99e"
            />
            <path d="M0 350 Q160 300 315 342 T610 330 T900 350 T1180 325 T1440 340 L1440 420 0 420Z" fill="#83b47e" opacity=".68" />
            <g fill="#f8f0d9" opacity=".65">
              <path d="M280 100 255 128 279 120 297 137 311 125 326 171 280 100Z" />
              <path d="M808 88 780 119 805 111 824 128 840 112 858 135 808 88Z" />
              <path d="M1224 142 1201 164 1221 157 1240 174 1252 161 1267 173 1224 142Z" />
            </g>
          </svg>
          <svg className="cta-foreground-terrain" viewBox="0 0 1440 420" preserveAspectRatio="none" role="presentation">
            <path
              d="M0 252 C110 228 172 246 258 268 C355 293 442 250 531 266 C653 288 720 240 831 255 C960 274 1020 237 1138 254 C1254 273 1332 239 1440 247 L1440 420 L0 420 Z"
              fill="#afd39d"
            />
            <path
              d="M0 302 C130 272 222 304 338 306 C465 308 535 282 665 303 C790 323 866 284 984 298 C1118 314 1250 278 1440 300 L1440 420 L0 420 Z"
              fill="#91c481"
            />
            <path
              d="M0 345 C145 327 228 350 360 340 C485 329 578 353 704 344 C835 335 928 353 1058 340 C1186 327 1306 344 1440 330 L1440 420 L0 420 Z"
              fill="#80b977"
            />
            <path
              d="M0 304 C130 274 222 306 338 308 C465 310 535 284 665 305 C790 325 866 286 984 300 C1118 316 1250 280 1440 302"
              fill="none"
              stroke="#d8e9c5"
              strokeWidth="5"
              opacity=".55"
            />
          </svg>
          <div className="cta-hill cta-hill-back" />
          <div className="cta-hill cta-hill-front" />
          <span className="cta-flower cta-flower-a">✿</span>
          <span className="cta-flower cta-flower-b">✿</span>
          <span className="cta-firefly">✦</span>
        </div>
        <div className="wrap cta-inner reveal">
          <div className="cta-copy">
            <span className="section-kicker">
              <span>
                <Sun className="icon-14" aria-hidden="true" />
              </span>{" "}
              {tr("Langkah kecil, dampak berarti", "Small Steps, Meaningful Impact")}
            </span>
            <h2 id="cta-title">
              {tr("Punya Info Kesehatan yang Bikin Ragu?", "Found Health Information You're Unsure About?")}
              <br />
              <span>{tr("Cek kebenarannya", "Check Whether It's True.")}</span>
            </h2>
            <p>
              {tr(
                "Masukkan klaimnya sekarang dan dapatkan penjelasan medis yang jujur serta mudah dipahami.",
                "Submit a claim now and get an honest, easy-to-understand medical explanation.",
              )}
            </p>
            <div className="cta-actions">
              <Link className="button button-primary button-large" href={`/${locale}/cek-klaim`}>
                {tr("Periksa klaim sekarang", "Check a claim now")}{" "}
                <span className="button-icon" aria-hidden="true">
                  <ArrowUpRight size={16} />
                </span>
              </Link>
              <Link className="button button-outline-light button-large" href={`/${locale}/feed-terverifikasi`}>
                {tr("Jelajahi hasil verifikasi", "Explore verification results")}
              </Link>
            </div>
          </div>
          <div className="cta-mascot-wrap">
            <div className="cta-mascot-glow" />
            <div className="mascot-placeholder mascot-cta" role="img" aria-label={tr("Tempat gambar maskot Pana untuk ajakan terakhir", "Placeholder for the Pana mascot in the final call to action")}>
              <PanaMascot pose="cta" />
            </div>
            <span className="cta-speech">
              {tr("Yuk, cari tahu!", "Let's find out!")}{" "}
            </span>

          </div>
        </div>
      </section>
    </div>
  );
}