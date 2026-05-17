import pool from "../config/db.js";
import { s3 } from "../config/multer.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2SignedUrl } from "../utils/r2.js";

export const getBatchSnapshot = async (batchId) => {
      const result = await pool.query(
            `SELECT
                  b.status          AS batch_status,
                  b.completed_jobs,
                  b.failed_jobs,
                  b.total_jobs,
                  COALESCE(
                        json_agg(
                              json_build_object(
                                    'target',     j.type,
                                    'status',     j.status,
                                    'output_url', j.output_url,
                                    'error',      j.error_message
                              )
                        ) FILTER (WHERE j.id IS NOT NULL),
                        '[]'
                  ) AS jobs
            FROM image_batches b
            LEFT JOIN image_jobs j ON j.batch_id = b.id
            WHERE b.id = $1
            GROUP BY b.id`,
            [batchId]
      );

      return result.rows[0] ?? null;
};

export const getBatchStatus = async (batchId) => {
      const result = await pool.query(
            `SELECT status, completed_jobs, failed_jobs, total_jobs
             FROM image_batches
             WHERE id = $1`,
            [batchId]
      );

      return result.rows[0] ?? null;
};

export const generateSignedUrls = async (jobs) => {
      return Promise.all(
            jobs.map(async (job) => {
                  if (job.status === 'completed' && job.output_url) {
                        const signedUrl = await getR2SignedUrl(job.output_url)
                        return { ...job, signedUrl };
                  }
                  return job;
            })
      );
};

export const generateSignedUrl = async (fileName) => {
      return await getR2SignedUrl(fileName)
};