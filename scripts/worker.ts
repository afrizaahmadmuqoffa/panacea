import { config } from "dotenv";

config({ path: ".env.local" });

const intervalMs = Math.max(5_000, Number(process.env.WORKER_INTERVAL_MS ?? 15_000));
const batchSize = Math.max(1, Math.min(Number(process.env.WORKER_BATCH_SIZE ?? 5), 10));

let stopping = false;

async function main() {
  // Import setelah dotenv: lib/env membaca process.env saat modul dimuat.
  const { runJobs } = await import("@/lib/jobs/runner");

  const stop = () => {
    stopping = true;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  console.log(`[worker] polling every ${intervalMs}ms, batch ${batchSize}`);

  while (!stopping) {
    try {
      const result = await runJobs(batchSize);
      if (result.processed > 0) console.log(`[worker] processed ${result.processed}`);
    } catch (error) {
      console.error("[worker] run failed", error);
    }
    if (stopping) break;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.log("[worker] stopped");
}

main().catch((error) => {
  console.error("[worker] fatal", error);
  process.exit(1);
});
