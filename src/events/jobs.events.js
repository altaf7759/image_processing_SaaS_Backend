import { QueueEvents } from 'bullmq';
import { redisClient } from '../config/redis.js';
import { imageQueue } from "../queues/image.queue.js";
import { sendBatchStatusSnapshot } from './batch.events.js';
import { getBatchSnapshot, generateSignedUrls, generateSignedUrl } from '../models/sse.model.js';

export const streamBatchProgress = async (req, res) => {
      const { batchId } = req.params;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      res.write('data: Connection established\n\n');

      const sendSSE = (eventName, data) => {
            res.write(`event: ${eventName}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      const queueEvents = new QueueEvents('image', { connection: redisClient });

      // ── Snapshot ─────────────────────────────────────────────────────────
      const snapshotRow = await getBatchSnapshot(batchId);

      if (!snapshotRow) {
            sendSSE('error', { message: 'Batch not found' });
            res.end();
            return;
      }

      const { batch_status, completed_jobs, failed_jobs, total_jobs, jobs } = snapshotRow;

      const completed = parseInt(completed_jobs);
      const failed = parseInt(failed_jobs);
      const total = parseInt(total_jobs);
      const progress = Math.round(((completed + failed) / total) * 100);

      const jobsWithUrls = await generateSignedUrls(jobs);

      sendSSE('snapshot', {
            batchStatus: batch_status,
            progress,
            completed,
            failed,
            totalJobs: total,
            jobs: jobsWithUrls,
      });

      if (['completed', 'failed', 'partial_failed'].includes(batch_status)) {
            res.end();
            return;
      }
      // ─────────────────────────────────────────────────────────────────────

      const onProgress = ({ jobId, data: progressValue }) => {
            if (!jobId.includes(`job_${batchId}`)) return;
            const target = jobId.split('_')[2];

            sendSSE('job_update', {
                  target,
                  status: 'processing',
                  progress: progressValue,
                  message: `Processing dimensions for ${target}...`
            });
      };

      const onActive = async ({ jobId }) => {
            if (!jobId.includes(`job_${batchId}`)) return;
            const target = jobId.split('_')[2];

            try {
                  const job = await imageQueue.getJob(jobId);
                  if (job && job.attemptsMade > 0) {
                        sendSSE('job_update', {
                              target,
                              status: 'retrying',
                              attempt: job.attemptsMade + 1,
                              message: `Retrying conversion iteration execution (${job.attemptsMade + 1}/3)...`
                        });
                  }
            } catch (err) {
                  console.error("Error in onActive SSE handler:", err);
            }
      };

      const onCompleted = async ({ jobId, returnvalue }) => {
            if (!jobId.includes(`job_${batchId}`)) return;
            const target = jobId.split('_')[2];

            try {
                  const parsedResult = typeof returnvalue === 'string' ? JSON.parse(returnvalue) : returnvalue;
                  const fileName = parsedResult?.fileName;

                  if (!fileName) {
                        console.error(`No fileName found in worker response for job: ${jobId}`);
                        return;
                  }

                  const temporarySignedUrl = await generateSignedUrl(fileName);

                  sendSSE('job_update', {
                        target,
                        status: 'completed',
                        progress: 100,
                        imageUrl: temporarySignedUrl
                  });

                  await sendBatchStatusSnapshot(batchId, sendSSE);
            } catch (err) {
                  console.error("Error in onCompleted SSE handler:", err);
            }
      };

      const onFailed = async ({ jobId, failedReason }) => {
            if (!jobId.includes(`job_${batchId}`)) return;
            const target = jobId.split('_')[2];

            sendSSE('job_update', {
                  target,
                  status: 'failed',
                  message: `Generation process failed: ${failedReason}`
            });

            await sendBatchStatusSnapshot(batchId, sendSSE);
      };

      queueEvents.on('progress', onProgress);
      queueEvents.on('active', onActive);
      queueEvents.on('completed', onCompleted);
      queueEvents.on('failed', onFailed);

      const cleanup = async () => {
            queueEvents.off('progress', onProgress);
            queueEvents.off('active', onActive);
            queueEvents.off('completed', onCompleted);
            queueEvents.off('failed', onFailed);
            await queueEvents.close();
            res.end();
      };

      req.on('close', cleanup);
};