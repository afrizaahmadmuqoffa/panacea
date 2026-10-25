import "server-only";
import { getServerEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type JobType = "analyze_claim" | "moderate_comment" | "embed_kb" | "archive_leaderboard";

export type JobRow = {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
};

export async function enqueueJob(type: JobType, payload: Record<string, unknown>) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .schema("private")
    .from("ai_jobs")
    // run_after memakai jam server DB, sedangkan jam proses bisa tertinggal beberapa detik.
    // Job baru ditandai siap 30 detik lebih awal agar langsung bisa di-lease.
    .insert({ type, payload, run_after: new Date(Date.now() - 30_000).toISOString() })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function leaseJob(workerId: string, jobId?: string): Promise<JobRow | null> {
  const admin = getSupabaseAdmin();
  let query = admin
    .schema("private")
    .from("ai_jobs")
    .select("id")
    .eq("status", "queued")
    // Toleransi 5 detik menutup selisih jam antara server aplikasi dan database.
    .lte("run_after", new Date(Date.now() + 5_000).toISOString())
    .order("created_at")
    .limit(1);
  if (jobId) query = query.eq("id", jobId);
  const { data: candidate, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!candidate) return null;

  const { data, error: claimError } = await admin
    .schema("private")
    .from("ai_jobs")
    .update({
      status: "running",
      locked_at: new Date().toISOString(),
      locked_by: workerId,
      attempts: (await currentAttempts(candidate.id)) + 1,
    })
    .eq("id", candidate.id)
    .eq("status", "queued")
    .select("id, type, payload, attempts, max_attempts")
    .maybeSingle();
  if (claimError) throw new Error(claimError.message);
  return data as JobRow | null;
}

async function currentAttempts(jobId: string) {
  const admin = getSupabaseAdmin();
  const { data } = await admin.schema("private").from("ai_jobs").select("attempts").eq("id", jobId).maybeSingle();
  return Number(data?.attempts ?? 0);
}

export async function markJobSucceeded(jobId: string) {
  const admin = getSupabaseAdmin();
  await admin
    .schema("private")
    .from("ai_jobs")
    .update({ status: "succeeded", last_error: null, locked_at: null })
    .eq("id", jobId);
}

export async function markJobFailed(jobId: string, message: string, attempts: number, maxAttempts: number) {
  const env = getServerEnv();
  const admin = getSupabaseAdmin();
  const willRetry = attempts < maxAttempts;
  const runAfter = new Date(Date.now() + env.JOB_BACKOFF_SECONDS * 1000 * attempts).toISOString();
  await admin
    .schema("private")
    .from("ai_jobs")
    .update({
      status: willRetry ? "queued" : "failed",
      last_error: message.slice(0, 2000),
      locked_at: null,
      locked_by: null,
      run_after: willRetry ? runAfter : new Date().toISOString(),
    })
    .eq("id", jobId);
}

export async function releaseExpiredJobs() {
  const env = getServerEnv();
  const admin = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - env.JOB_LEASE_SECONDS * 1000).toISOString();
  await admin
    .schema("private")
    .from("ai_jobs")
    .update({ status: "queued", locked_at: null, locked_by: null })
    .eq("status", "running")
    .lt("locked_at", cutoff);
}
