"use client";

import { useState } from "react";

export function LogoMark({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
        <path d="M24 40C11 34 8 22 14 13c5-7 12-6 15-1 5-5 13-3 15 5 3 10-7 19-20 23Z" fill="currentColor" />
        <path d="M23 37c-1-11 3-19 12-25" fill="none" stroke="#fffcf5" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="14" cy="12" r="3" fill="#f6d982" />
      </svg>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.webp" alt="" className={className} onError={() => setFailed(true)} />
  );
}
