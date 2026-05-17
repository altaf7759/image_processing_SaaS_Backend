import IORedis from "ioredis";

export const redisClient = new IORedis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
            return Math.min(times * 500, 5000)
      }
});

redisClient.on("error", (err) => console.error("Redis Error:", err));