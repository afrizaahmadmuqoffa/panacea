import type { Metadata } from "next";
import { ClaimComposer } from "@/components/member/claim-composer";

export const metadata: Metadata = {
  title: "Cek Klaim",
};

export const maxDuration = 300;

export default function CheckClaimPage() {
  return <ClaimComposer />;
}
