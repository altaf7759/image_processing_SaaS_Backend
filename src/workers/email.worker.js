import 'dotenv/config'
import { Worker } from "bullmq";
import { redisClient } from "../config/redis.js";
import { transporter } from "../config/email.js";
import { markEmailFailed, markEmailSent } from "../models/email.model.js";
import { subscriptionEmail, welcomeEmail } from "../utils/emailTemplates.js";

const worker = new Worker(
      "email",
      async (job) => {
            const { email, type, name, emailLogId } = job.data;

            switch (type) {
                  case "welcome email":
                        console.log(`[Email Worker] Processing welcome template for: ${email}`);
                        await transporter.sendMail(welcomeEmail(email, name));
                        return { emailLogId };

                  case "subscription buy email":
                        console.log(`[Email Worker] Processing premium subscription receipt template for: ${email}`);
                        await transporter.sendMail(subscriptionEmail(email, name));
                        return { emailLogId };

                  default:
                        console.warn(`[Email Worker] Unhandled task execution label category: ${type}`);
            }
      },
      {
            connection: redisClient,
            concurrency: 4
      }
);

worker.on("completed", async (job, returnValues) => {
      if (returnValues?.emailLogId) {
            await markEmailSent(returnValues.emailLogId);
      }
      console.log(`Job ${job.id} completed successfully.`);
});

worker.on("failed", async (job, error) => {
      if (job?.data?.emailLogId) {
            await markEmailFailed(job.data.emailLogId);
      }
      console.error(`Job ${job?.id} failed permanently: ${error.message}`);
});