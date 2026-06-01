import IORedis from "ioredis";

const redisConfig = process.env.REDIS_URL
      ? {
            host: process.env.REDIS_URL,
            port: Number(process.env.REDIS_PORT_CLOUD),
            username: process.env.REDIS_USERNAME || "default",
            password: process.env.REDIS_PASSWORD,
      }
      : {
            host: process.env.REDIS_HOST || "localhost",
            port: Number(process.env.REDIS_PORT) || 6379,
      };

export const redisClient = new IORedis(redisConfig, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
            return Math.min(times * 500, 5000);
      },
});

redisClient.on("error", (err) => {
      console.error("Redis Error:", err);
});