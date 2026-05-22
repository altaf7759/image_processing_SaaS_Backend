import { Queue } from "bullmq";
import { redisClient } from "../config/redis.js";

export const emailQueue = new Queue("email", {
      connection: redisClient,
      streams: {
            events: {
                  maxLen: 1000
            }
      }
});