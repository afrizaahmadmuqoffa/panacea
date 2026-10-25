import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { runJobs } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const env = getServerEnv();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const header = request.headers.get("x-cron-secret");
  if (!env.CRON_SECRET || (bearer !== env.CRON_SECRET && header !== env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runJobs(3);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
