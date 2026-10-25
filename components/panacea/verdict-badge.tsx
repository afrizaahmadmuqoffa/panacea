"use client";

import { BadgeCheck, LoaderCircle, Scale, Search, ShieldAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/providers/i18n-provider";
import type { Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";

const config = {
  supported: {
    variant: "sage" as const,
    icon: BadgeCheck,
    label: { id: "Didukung bukti", en: "Supported" },
  },
  partly_supported: {
    variant: "butter" as const,
    icon: Scale,
    label: { id: "Sebagian didukung", en: "Partly supported" },
  },
  contradicted: {
    variant: "rose" as const,
    icon: ShieldAlert,
    label: { id: "Bertentangan", en: "Contradicted" },
  },
  insufficient_evidence: {
    variant: "sky" as const,
    icon: Search,
    label: { id: "Bukti belum cukup", en: "Insufficient evidence" },
  },
};

const warmConfig = {
  supported: {
    variant: "sage" as const,
    icon: BadgeCheck,
    label: { id: "Didukung bukti", en: "Supported" },
  },
  partly_supported: {
    variant: "butter" as const,
    icon: Scale,
    label: { id: "Sebagian didukung", en: "Partly supported" },
  },
  contradicted: {
    variant: "rose" as const,
    icon: ShieldAlert,
    label: { id: "Bertentangan", en: "Contradicted" },
  },
  insufficient_evidence: {
    variant: "default" as const,
    icon: Search,
    label: { id: "Bukti belum cukup", en: "Insufficient evidence" },
  },
};

export function VerdictBadge({
  verdict,
  size = "md",
  className,
  palette = "warm",
}: {
  verdict: Verdict;
  size?: "sm" | "md" | "lg";
  className?: string;
  palette?: "default" | "warm";
}) {
  const { locale } = useI18n();
  const item = (palette === "warm" ? warmConfig : config)[verdict];
  const Icon = item.icon;
  return (
    <Badge
      variant={item.variant}
      className={cn(
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "lg" && "px-3.5 py-2 text-sm",
        className,
      )}
    >
      <Icon className={cn("size-3.5", size === "lg" && "size-4")} aria-hidden="true" />
      {item.label[locale]}
    </Badge>
  );
}

export function PendingBadge({ kind = "analysis", palette = "warm" }: { kind?: "analysis" | "reviewer" | "moderation"; palette?: "default" | "warm" }) {
  const { locale } = useI18n();
  const labels = {
    analysis: { id: "Analisis berlangsung", en: "Analysis in progress" },
    reviewer: { id: "Menunggu pakar", en: "Waiting for expert" },
    moderation: { id: "Menunggu pemeriksaan", en: "Awaiting review" },
  };
  const Icon = kind === "reviewer" ? Users : kind === "moderation" ? LoaderCircle : LoaderCircle;
  return (
    <Badge variant={palette === "warm" ? "butter" : "sky"}>
      <Icon className="size-3.5 animate-spin" aria-hidden="true" />
      {labels[kind][locale]}
    </Badge>
  );
}
