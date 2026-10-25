import type { Metadata } from "next";
import { ClaimHistory } from "@/components/member/claim-history";

export const metadata: Metadata = {
  title: "Riwayat Klaim",
};

export default function ClaimHistoryPage() {
  return <ClaimHistory />;
}
