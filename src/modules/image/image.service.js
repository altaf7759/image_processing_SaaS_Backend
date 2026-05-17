import { getR2SignedUrl, deleteR2Object } from "../../utils/r2.js";
import { imageQueue } from "../../queues/image.queue.js";
import pool from "../../config/db.js";
import AppError from "../../utils/AppError.js";

export const addImageToQueue = async (req) => {
      const { totalJobs, targets } = req.body;
      const userId = req.user.id;
      const r2Key = req.file.key;
      const originalFileName = req.file.originalname;

      const signedUrl = await getR2SignedUrl(r2Key);
      if (!signedUrl) {
            await deleteR2Object(r2Key);
            throw new AppError("Failed to generate signed URL.", 500);
      }

      let createdBatchId = null;

      try {
            const batchQuery = `
                  INSERT INTO image_batches (user_id, r2_key, original_file_name, total_jobs, status)
                  VALUES ($1, $2, $3, $4, 'processing'::batch_status)
                  RETURNING id;
            `;
            const batchResult = await pool.query(batchQuery, [userId, r2Key, originalFileName, totalJobs]);
            createdBatchId = batchResult.rows[0].id;

            const addedJobs = [];

            for (const target of targets) {
                  const customBullMqId = `job_${createdBatchId}_${target}_${Date.now()}`;

                  const jobQuery = `
                        INSERT INTO image_jobs (batch_id, bullmq_id, type, priority, status)
                        VALUES ($1, $2, $3, $4, 'queued'::job_status)
                        RETURNING id;
                  `;

                  const jobResult = await pool.query(jobQuery, [createdBatchId, customBullMqId, target, 1]);
                  const imageJobRecordId = jobResult.rows[0].id;

                  const job = await imageQueue.add(
                        "image",
                        {
                              batchId: createdBatchId,
                              jobRecordId: imageJobRecordId,
                              userId,
                              signedUrl,
                              target,
                        },
                        {
                              jobId: customBullMqId,
                              attempts: 3,
                              backoff: { type: "exponential", delay: 1000 },
                              removeOnComplete: {
                                    age: 3600,
                                    count: 100,
                              },
                              removeOnFail: {
                                    age: 86400,
                                    count: 50,
                              }
                        }
                  );

                  addedJobs.push({ target, bullMqId: job.id });
            }

            return {
                  success: true,
                  batchId: createdBatchId,
                  jobs: addedJobs,
                  url: signedUrl
            };

      } catch (error) {
            await deleteR2Object(r2Key);

            if (createdBatchId) {
                  await pool.query("DELETE FROM image_batches WHERE id = $1", [createdBatchId]);
            }

            throw new AppError(`Failed to process image request: ${error.message}`, 500);
      }
};