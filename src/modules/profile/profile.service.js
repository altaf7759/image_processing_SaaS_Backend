import pool from "../../config/db.js";
import { Plan } from "../../models/plan.models.js";
import { User } from "../../models/user.models.js";
import AppError from "../../utils/AppError.js";
import { getPlans } from "../plans/plan.repository.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize Cloudflare R2 Client
const r2 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
});

// Helper function to sign R2 keys safely
const generateSignedUrl = async (key) => {
      if (!key) return null;
      try {
            const command = new GetObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: key,
            });
            return await getSignedUrl(r2, command, { expiresIn: 3600 }); // 1 hour expiration
      } catch (error) {
            console.error(`Failed to sign key: ${key}`, error);
            return null;
      }
};

export const processProfile = async (userId, planId) => {
      if (!userId) {
            throw new AppError("User Id not found", 400);
      }

      const user = await User.findById(userId);
      if (!user) {
            throw new AppError("User not found", 400);
      }

      const activePlanName = await Plan.findPlanNameByPlanId(planId);
      if (!activePlanName) {
            throw new AppError("Plan not found", 400);
      }

      const allPlans = await getPlans()
      const plansWithPrices = await Plan.getPlanDetails()
      const activePlansDetails = await User.findActivePlanByUserId(userId);

      // 1. Fetch all batches for the user (Use .rows, NOT .rows[0])
      // Added ORDER BY to keep the newest batches on top
      const batchQuery = `
    SELECT id, r2_key FROM image_batches 
    WHERE user_id = $1
    ORDER BY created_at DESC; 
  `;
      const batchesResult = await pool.query(batchQuery, [userId]);
      const imageBatches = batchesResult.rows; // This is now a clean array of batches

      // 2. NESTED PROCESSING VIA PROMISE.ALL (No blocking for loops)
      const history = await Promise.all(
            imageBatches.map(async (batch) => {
                  // Sign the original image key for this batch
                  const originalImageUrl = await generateSignedUrl(batch.r2_key);

                  // Fetch all transformed transformation jobs for THIS specific batch ID
                  const imageQuery = `
        SELECT id, output_url, type FROM image_jobs
        WHERE batch_id = $1;
      `;
                  const jobsResult = await pool.query(imageQuery, [batch.id]);
                  const jobs = jobsResult.rows;

                  // Inner Loop: Sign the keys for every transformation in this batch concurrently
                  const transformedImages = await Promise.all(
                        jobs.map(async (job) => {
                              const signedUrl = await generateSignedUrl(job.output_url);
                              return {
                                    jobId: job.id,
                                    type: job.transformation_type,
                                    url: signedUrl,
                              };
                        })
                  );

                  // Return the consolidated batch data structure
                  return {
                        batchId: batch.id,
                        originalUrl: originalImageUrl,
                        transformations: transformedImages,
                  };
            })
      );

      const usageQuery = `
            SELECT
                  jobs_used,
                  storage_snapshot_bytes,
                  api_requests
            FROM usage_logs
            WHERE date = CURRENT_DATE AND user_id = $1;
      `
      const usageForDay = await pool.query(usageQuery, [userId])
      const usage = usageForDay.rows

      // 3. Return everything back to the controller
      return {
            activePlanName,
            allPlans,
            plansWithPrices,
            activePlansDetails,
            usage,
            history // Your beautifully structured array of signed image batches
      };
};
