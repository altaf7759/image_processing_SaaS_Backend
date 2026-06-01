import {
      getR2SignedUrl,
      deleteR2Object
} from "../../utils/r2.js";

import { deleteImageBatch } from "./image.repository.js";
import { imageQueue } from "../../queues/image.queue.js";

import pool from "../../config/db.js";

import AppError from "../../utils/AppError.js";

import {
      createImageBatch,
      createJobRow,
      increaseStorageUsed,
      findUserJobLimitForToday
} from "./image.repository.js";

export const addImageToQueue = async (req) => {

      const {
            totalJobs,
            targets
      } = req.body;

      const userId = req.user.id;

      const r2Key = req.file.key;

      const originalFileName =
            req.file.originalname;

      const {
            max_file_size_bytes,
            storage_limit_bytes,
            storage_used_bytes,
            daily_jobs_limit,
            priority_level
      } = req.user.subscription;

      const todayJobLimit = await findUserJobLimitForToday(userId);

      if (todayJobLimit >= Number(daily_jobs_limit)) {
            await deleteR2Object(r2Key);

            throw new AppError(
                  "Daily job limit exceeded",
                  403
            );
      }

      if (
            Number(req.file.size) >
            Number(max_file_size_bytes)
      ) {

            await deleteR2Object(r2Key);

            throw new AppError(
                  "File exceeds plan limit",
                  403
            );
      }

      const projectedStorage =
            Number(storage_used_bytes) +
            Number(req.file.size);

      if (
            Number(projectedStorage) >
            Number(storage_limit_bytes)
      ) {

            await deleteR2Object(r2Key);

            throw new AppError(
                  "Storage quota exceeded",
                  403
            );
      }

      const signedUrl =
            await getR2SignedUrl(r2Key);

      if (!signedUrl) {

            await deleteR2Object(r2Key);

            throw new AppError(
                  "Failed to generate signed URL.",
                  500
            );
      }

      const client =
            await pool.connect();

      let createdBatchId = null;

      try {

            await client.query("BEGIN");

            const batch =
                  await createImageBatch(
                        {
                              userId,
                              r2Key,
                              totalJobs,
                              originalFileName
                        },
                        client
                  );

            createdBatchId = batch.id;

            const addedJobs = [];

            for (const target of targets) {

                  const customBullMqId =
                        `job_${createdBatchId}_${target}_${Date.now()}`;

                  const jobRow =
                        await createJobRow(
                              {
                                    batchId:
                                          createdBatchId,

                                    bullmqId:
                                          customBullMqId,

                                    type: target,

                                    priority: Number(priority_level)
                              },
                              client
                        );

                  addedJobs.push({
                        target,
                        bullMqId:
                              customBullMqId,
                        jobRecordId:
                              jobRow.id
                  });
            }

            await increaseStorageUsed(
                  {
                        userId,
                        bytes:
                              req.file.size
                  },
                  client
            );

            await client.query("COMMIT");

            for (const job of addedJobs) {

                  await imageQueue.add(
                        "image",
                        {
                              batchId:
                                    createdBatchId,

                              jobRecordId:
                                    job.jobRecordId,

                              userId,

                              signedUrl,

                              target:
                                    job.target,
                        },
                        {
                              jobId:
                                    job.bullMqId,

                              attempts: 3,

                              backoff: {
                                    type:
                                          "exponential",

                                    delay: 1000,
                              },

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
            }

            return {
                  success: true,
                  batchId: createdBatchId,
                  jobs: addedJobs,
                  url: signedUrl
            };

      } catch (error) {

            await client.query(
                  "ROLLBACK"
            );

            await deleteR2Object(r2Key);

            if (createdBatchId) {

                  await deleteImageBatch(
                        createdBatchId
                  );
            }

            throw new AppError(
                  `Failed to process image request: ${error.message}`,
                  500
            );

      } finally {

            client.release();
      }
};