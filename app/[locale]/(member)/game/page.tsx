import type { Metadata } from "next";
import { GameLobby } from "@/components/member/game-lobby";

export const metadata: Metadata = {
  title: "Lobi Tantangan",
};

export default function GamePage() {
  return <GameLobby />;
}
