import "server-only";
import { analyzeClaimJob } from "@/lib/claims/analyze";
import { moderateCommentJob } from "@/lib/forum/moderate";
import { embedKbSourceJob } from "@/lib/kb/ingest";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leaseJob, markJobFailed, markJobSucceeded, releaseExpiredJobs } from "./queue";

async function execute(type: string, payload: Record<string, unknown>) {
  if (type === "analyze_claim") return analyzeClaimJob(payload);
  if (type === "moderate_comment") return moderateCommentJob(payload);
  if (type === "embed_kb") return embedKbSourceJob(payload);
  if (type === "archive_leaderboard") {
    const admin = getSupabaseAdmin();
    const result = await admin.rpc("archive_leaderboard");
    if (result.error) throw new Error(result.error.message);
    return;
  }
  throw new Error(`Unknown job type: ${type}`);
}

export async function runJobs(limit = 3, jobId?: string) {
  await releaseExpiredJobs();
  const workerId = crypto.randomUUID();
  let processed = 0;

  for (let index = 0; index < limit; index += 1) {
    const job = await leaseJob(workerId, jobId);
    if (!job) break;
    processed += 1;
    try {
      await execute(job.type, job.payload);
      await markJobSucceeded(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "job_failed";
      await markJobFailed(job.id, message, job.attempts, job.max_attempts);
    }
  }

  return { processed };
}
