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
      markJobStarted
} from "../models/image.model.js";
import { upsertUsageLog } from "../models/usage.model.js";
import { increaseStorageUsed } from "../modules/image/image.repository.js";
import { checkAndCompleteBatch } from "../models/sse.model.js";

const worker = new Worker(
      "image",
      async (job) => {
            // Safely update retry state inside the processor context prior to running heavy logic
            if (job.attemptsMade > 0) {
                  try {
                        await markJobRetrying(job.id, job.attemptsMade);
                  } catch (err) {
                        console.error(`Database error updating job retry state for ${job.id}:`, err.message);
                  }
            }

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
      { connection: redisClient, concurrency: 4 }
);

// Lightweight clean logging hooks
worker.on("active", async (job) => {
      try {
            await markJobStarted(job.id);

            console.log(
                  `[BullMQ] Job ${job.id} is now active`
            );
      } catch (err) {
            console.error(err);
      }
});

worker.on("completed", async (job, result) => {
      console.log(`[BullMQ] Job ${job.id} completed successfully`);
      const batchId = job.id.split('_')[1];
      const fileName = result?.fileName;
      const fileSize = result?.fileSize || 0;

      try {
            // 1. Commit job resolution states
            await markJobCompleted({
                  bullmqId: job.id,
                  outputUrl: result.fileName,
                  outputSizeBytes: result.fileSize,
                  width: result.width,
                  height: result.height,
                  format: result.format,
                  processingTimeMs: result.processingTimeMs,
            });
            await incrementBatchCompleted(batchId);

            // 2. Adjust user billing/snapshots safely
            const updatedSubscription = await increaseStorageUsed({ userId: job.data.userId, bytes: fileSize });
            await upsertUsageLog({ userId: job.data.userId, storageSnapshotBytes: updatedSubscription });

            // 3. Atomically check if the macro-batch is completed
            await checkAndCompleteBatch(batchId);
      } catch (err) {
            console.error(`Database update failure on job completion lifecycle for ${job.id}:`, err);
      }
});

worker.on("failed", async (job, err) => {
      console.error(`[BullMQ] Job ${job?.id} encountered an error:`, err.message);
      if (!job) return;

      const batchId = job.id.split('_')[1];
      const failedReason = err.message || "Unknown unexpected execution crash exception";
      const maxAttempts = job.opts.attempts || 1;

      // CRITICAL PROTECTION: Skip state pollution if BullMQ is going to handle a retry attempt
      if (job.attemptsMade < maxAttempts) {
            console.log(`[BullMQ] Job ${job.id} marked for automatic retry queue re-assignment.`);
            return;
      }

      // Final hard terminal failure branch
      try {
            await markJobFailed(job.id, failedReason);
            await incrementBatchFailed(batchId);

            // Atomically evaluate macro-batch closure status safely 
            await checkAndCompleteBatch(batchId);
      } catch (dbErr) {
            console.error(`Database update failure on fatal job closure for ${job.id}:`, dbErr);
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
