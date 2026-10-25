import type { Metadata } from "next";
import { GameResult } from "@/components/member/game-result";
import { getGameSessionStatements } from "@/lib/data/repository";

export const metadata: Metadata = {
  title: "Hasil Sesi",
};

export const dynamic = "force-dynamic";

export default async function GameResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const statements = await getGameSessionStatements(sessionId);
  return <GameResult sessionId={sessionId} statements={statements} />;
}
