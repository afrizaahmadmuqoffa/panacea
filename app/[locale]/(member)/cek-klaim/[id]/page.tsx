import type { Metadata } from "next";
import { ClaimResult } from "@/components/member/claim-result";

export const metadata: Metadata = {
  title: "Hasil Analisis AI",
};

export const maxDuration = 300;

export default async function ClaimResultPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <ClaimResult id={id} locale={locale} />;
}
