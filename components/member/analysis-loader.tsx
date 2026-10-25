"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/providers/i18n-provider";
import { PanaMascot } from "@/components/panacea/pana-mascot";
import styles from "./analysis-loader.module.css";

export function AnalysisLoader() {
  const { tr } = useI18n();
  const [mounted] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!mounted) return null;

  const content = (
    <div className={styles.overlay} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.card}>
        <div className={styles.scene} aria-hidden="true">
          <span className={`${styles.cloud} ${styles.cloudOne}`} />
          <span className={`${styles.cloud} ${styles.cloudTwo}`} />
          <span className={`${styles.hill} ${styles.hillBack}`} />
          <span className={`${styles.hill} ${styles.hillFront}`} />
          <span className={`${styles.flower} ${styles.flowerOne}`}>✿</span>
          <span className={`${styles.flower} ${styles.flowerTwo}`}>✿</span>
          <span className={`${styles.orbit} ${styles.orbitLeft}`}>✦</span>
          <span className={`${styles.orbit} ${styles.orbitRight}`}>✧</span>
          <div className={styles.panaWrap}>
            <PanaMascot pose="investigating" className={styles.pana} />
          </div>
        </div>
        <span className={styles.kicker}>{tr("PANA SEDANG MENYELIDIKI", "PANA IS INVESTIGATING")}</span>
        <h2 className={styles.title}>{tr("Menelusuri bukti...", "Tracing the evidence...")}</h2>
        <p className={styles.desc}>
          {tr(
            "Analisis sedang berjalan. Jangan tutup halaman ini.",
            "The analysis is running. Please keep this page open.",
          )}
        </p>
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressBar} />
        </div>
        <div className={styles.steps} aria-hidden="true">
          <span>{tr("Kenali klaim", "Identify claim")}</span>
          <span>{tr("Cari sumber", "Find sources")}</span>
          <span>{tr("Rangkum bukti", "Summarize evidence")}</span>
        </div>
        <small className={styles.footnote}>{tr("Biasanya membutuhkan 20-60 detik.", "This usually takes 20-60 seconds.")}</small>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
