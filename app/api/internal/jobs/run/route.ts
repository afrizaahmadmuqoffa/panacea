import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { runJobs } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: NextRequest) {
  const env = getServerEnv();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const header = request.headers.get("x-internal-secret");
  return Boolean(env.INTERNAL_WORKER_SECRET) && (bearer === env.INTERNAL_WORKER_SECRET || header === env.INTERNAL_WORKER_SECRET);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 3);
  const result = await runJobs(Math.min(Math.max(limit, 1), 10));
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
