import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { enqueueJob } from "@/lib/jobs/queue";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const env = getServerEnv();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const header = request.headers.get("x-cron-secret");
  if (!env.CRON_SECRET || (bearer !== env.CRON_SECRET && header !== env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const jobId = await enqueueJob("archive_leaderboard", {});
  return NextResponse.json({ jobId }, { headers: { "Cache-Control": "no-store" } });
}
