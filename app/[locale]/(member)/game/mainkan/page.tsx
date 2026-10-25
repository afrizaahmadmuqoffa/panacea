import type { Metadata } from "next";
import { GameArena } from "@/components/member/game-arena";

export const metadata: Metadata = {
  title: "Arena Tantangan",
};

export default function PlayGamePage() {
  return <GameArena />;
}
