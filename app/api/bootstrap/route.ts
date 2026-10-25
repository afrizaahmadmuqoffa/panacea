import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMemberSnapshot } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const snapshot = await getMemberSnapshot(session);
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "bootstrap_failed" },
      { status: 500 },
    );
  }
}
