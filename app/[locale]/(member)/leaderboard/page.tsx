import type { Metadata } from "next";
import { LeaderboardView } from "@/components/member/leaderboard-view";
import { getLeaderboard } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Leaderboard",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [weekly, global] = await Promise.all([getLeaderboard("weekly"), getLeaderboard("global")]);
  return <LeaderboardView weekly={weekly} global={global} />;
}
