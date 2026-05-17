import "dotenv/config";
import path from "path";
import { Worker } from "bullmq";
import { Worker as ThreadWorker } from "worker_threads";
import { redisClient } from "../config/redis.js";
import { imageQueue } from "../queues/image.queue.js";
import {
      markJobRetrying,
      markJobCompleted,
      incrementBatchCompleted,
      markJobFailed,
      incrementBatchFailed,
} from "../models/image.model.js";

const worker = new Worker(
      "image",
      async (job) => {
            const jobId = job.id;
            const batchId = jobId.split('_')[1];

            return new Promise((resolve, reject) => {
                  const thread = new ThreadWorker(
                        path.resolve("src/workers/image.thread.js"),
                        { workerData: job.data }
                  );

                  thread.on("message", async (msg) => {
                        if (msg.type === "progress") {
                              try {
                                    await job.updateProgress(msg.progress);
                              } catch (err) {
                                    console.error(`Failed to update progress for job ${job.id}:`, err.message);
                              }
                        }
                        if (msg.type === "done") {
                              resolve(msg.result);
                        }
                        if (msg.type === "error") {
                              reject(new Error(msg.error));
                        }
                  });

                  thread.on("error", (err) => reject(err));

                  thread.on("exit", (code) => {
                        if (code !== 0) {
                              reject(new Error(`Worker thread stopped unexpectedly with exit code ${code}`));
                        }
                  });

                  job.token && Object.defineProperty(job, 'discard', {
                        value: () => { thread.terminate(); }
                  });
            });
      },
      {
            connection: redisClient,
            concurrency: 4
      }
);

worker.on("active", async (job) => {
      if (job.attemptsMade > 0) {
            try {
                  await markJobRetrying(job.id, job.attemptsMade);
            } catch (err) {
                  console.error("Database error updating job retry state:", err);
            }
      }
});

worker.on("completed", async (job, result) => {
      console.log(`[BullMQ] Job ${job.id} completed successfully`);
      const batchId = job.id.split('_')[1];
      const fileName = result?.fileName;

      try {
            await markJobCompleted(job.id, fileName);
            await incrementBatchCompleted(batchId);
      } catch (err) {
            console.error(`Database commit failure on job completion hook for ${job.id}:`, err);
      }
});

worker.on("failed", async (job, err) => {
      console.error(`[BullMQ] Job ${job?.id} failed:`, err.message);
      if (!job) return;

      const batchId = job.id.split('_')[1];
      const failedReason = err.message || "Unknown unexpected execution crash exception";

      try {
            await markJobFailed(job.id, failedReason);
            await incrementBatchFailed(batchId);
      } catch (dbErr) {
            console.error(`Database commit failure on job failure hook for ${job.id}:`, dbErr);
      }
});

redisClient.on("ready", async () => {
      try {
            await imageQueue.clean(3600 * 1000, 100, "completed");
            await imageQueue.clean(86400 * 1000, 50, "failed");
            console.log("[BullMQ] Stale job cleanup complete");
      } catch (err) {
            console.error("[BullMQ] Cleanup failed:", err.message);
      }
});