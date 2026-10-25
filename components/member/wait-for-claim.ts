import type { Claim } from "@/lib/types";

export type ClaimOutcome = "succeeded" | "failed" | "timeout";

type Snapshot = { claims: Claim[] } | null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Menunggu analisis klaim sampai terminal (sukses atau gagal). */
export async function waitForClaimOutcome(
  refresh: () => Promise<Snapshot>,
  claimId: string,
  options: { attempts?: number; intervalMs?: number } = {},
): Promise<ClaimOutcome> {
  const attempts = options.attempts ?? 90;
  const intervalMs = options.intervalMs ?? 2000;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const snapshot = await refresh();
    const claim = snapshot?.claims.find((item) => item.id === claimId);
    if (claim) {
      if (claim.analysis?.status === "succeeded") return "succeeded";
      if (claim.analysis?.status === "failed" || claim.status === "analysis_failed") {
        return "failed";
      }
    }
    if (attempt < attempts - 1) await sleep(intervalMs);
  }

  return "timeout";
}
