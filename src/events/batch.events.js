import { getBatchStatus } from "../models/sse.model.js";

export const sendBatchStatusSnapshot = async (batchId, sendSSE) => {
      try {
            const row = await getBatchStatus(batchId);
            if (!row) return;

            const completed = parseInt(row.completed_jobs);
            const failed = parseInt(row.failed_jobs);
            const total = parseInt(row.total_jobs);
            const progress = Math.round(((completed + failed) / total) * 100);

            sendSSE('batch_update', {
                  batchStatus: row.status,
                  progress,
                  completed,
                  failed,
                  totalJobs: total,
            });
      } catch (err) {
            console.error("Error reading batch status for SSE:", err);
      }
};