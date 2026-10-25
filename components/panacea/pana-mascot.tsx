"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./pana-mascot.module.css";

const POSE_SRC = {
  hero: "/pana-hero.webp",
  cta: "/pana-cta.webp",
  feed: "/pana-feed.webp",
  auth: "/pana-auth.webp",
  dashboard: "/pana-dashboard.webp",
  badge: "/pana-badge.webp",
  game: "/pana-game.webp",
  gameResult: "/pana-game-result.webp",
  reviewer: "/pana-dashboard.webp",
  investigating: "/pana-investigating.webp",
  teach: "/pana-teach.webp",
  leaderboard: "/pana-leaderboard.webp",
  summary: "/pana-summary.webp",
} as const;

function DogHeadFallback() {
  return (
    <svg viewBox="0 0 120 120" className={styles.fallbackSvg} role="presentation" aria-hidden="true">
      <ellipse cx="28" cy="58" rx="15" ry="26" fill="#c9a06b" transform="rotate(-12 28 58)" />
      <ellipse cx="92" cy="58" rx="15" ry="26" fill="#c9a06b" transform="rotate(12 92 58)" />
      <circle cx="60" cy="62" r="38" fill="#f3d9a6" />
      <ellipse cx="60" cy="78" rx="20" ry="15" fill="#fff4e2" />
      <circle cx="47" cy="56" r="4.5" fill="#3d493f" />
      <circle cx="73" cy="56" r="4.5" fill="#3d493f" />
      <ellipse cx="60" cy="72" rx="6" ry="4.5" fill="#3d493f" />
      <path d="M60 77v6c0 3-3 5-7 5" fill="none" stroke="#3d493f" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 36h68l-6 6H32z" fill="#65936f" />
      <path d="M40 36c2-14 38-14 40 0z" fill="#547a60" />
      <rect x="40" y="30" width="40" height="5" rx="2" fill="#f6d982" />
    </svg>
  );
}

export function PanaMascot({
  pose = "hero",
  className,
}: {
  pose?: keyof typeof POSE_SRC;
  className?: string;
}) {
  const [stage, setStage] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const checkedRef = useRef<string | null>(null);
  const src = stage === 0 ? POSE_SRC[pose] : POSE_SRC.hero;

  // A 404 can resolve before hydration, so onError never fires. Re-check on mount.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || el.getAttribute("src") !== src || checkedRef.current === src) return;
    if (el.complete && el.naturalWidth === 0) {
      checkedRef.current = src;
      setStage((value) => value + 1);
    }
  }, [src]);

  if (stage >= 2) {
    return (
      <span className={cn(styles.mascot, className)}>
        <span className={styles.fallback}>
          <DogHeadFallback />
        </span>
      </span>
    );
  }
  return (
    <span className={cn(styles.mascot, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src={src} alt="Pana" className={styles.img} onError={() => setStage((value) => value + 1)} />
    </span>
  );
}
