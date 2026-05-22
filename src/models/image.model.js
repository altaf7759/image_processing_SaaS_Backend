import pool from "../config/db.js";

export const markJobRetrying = async (bullmqId, attempts) => {
      await pool.query(
            `UPDATE image_jobs
             SET status = 'retrying'::job_status, attempts = $1, last_retry_at = NOW()
             WHERE bullmq_id = $2`,
            [attempts, bullmqId]
      );
};

export const markJobCompleted = async ({
      bullmqId,
      outputUrl,
      outputSizeBytes,
      width,
      height,
      format,
      processingTimeMs,
}) => {

      const query = `
            UPDATE image_jobs
            SET
                  status = 'completed'::job_status,
                  output_url = $1,
                  output_size_bytes = $2,
                  width = $3,
                  height = $4,
                  format = $5,
                  processing_time_ms = $6,
                  completed_at = NOW()
            WHERE bullmq_id = $7
      `;

      const values = [
            outputUrl,
            outputSizeBytes,
            width,
            height,
            format,
            processingTimeMs,
            bullmqId,
      ];

      await pool.query(query, values);
};

export const markJobStarted = async (bullmqId) => {

      await pool.query(
            `
            UPDATE image_jobs
            SET
                  status = 'processing'::job_status,
                  started_at = NOW()
            WHERE bullmq_id = $1
            `,
            [bullmqId]
      );
};

export const incrementBatchCompleted = async (batchId) => {
      await pool.query(
            `UPDATE image_batches SET completed_jobs = completed_jobs + 1 WHERE id = $1`,
            [batchId]
      );
};

export const markJobFailed = async (bullmqId, reason) => {
      await pool.query(
            `UPDATE image_jobs
             SET status = 'failed'::job_status, error_message = $1, completed_at = NOW()
             WHERE bullmq_id = $2`,
            [reason, bullmqId]
      );
};

export const incrementBatchFailed = async (batchId) => {
      await pool.query(
            `UPDATE image_batches SET failed_jobs = failed_jobs + 1 WHERE id = $1`,
            [batchId]
      );
};