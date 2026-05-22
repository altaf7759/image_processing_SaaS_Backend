export const ROLES = {
      USER: "user",
      ADMIN: "admin",
}

export const FILE_TYPES = {
      JPEG: "image/jpeg",
      PNG: "image/png",
      GIF: "image/gif"
}

export const LIMITS = {
      MAX_FILE_SIZE: 100 * 1024 * 1024
}

export const MAX_NUMBER_OF_JOBS = 10;

export const SOCIAL_PRESETS = {
      "youtube_thumbnail": { width: 1280, height: 720 },
      "insta_post": { width: 1080, height: 1080 },
      "insta_story": { width: 1080, height: 1920 },
};

export const JOB_STATUS = {
      QUEUED: "queued",
      PROCESSING: "processing",
      RETRYING: "retrying",
      COMPLETED: "completed",
      FAILED: "failed"
}

export const BATCH_STATUS = {
      PROCESSING: "processing",
      COMPLETED: "completed",
      PARTIAL_FAILED: "partial_failed",
      FAILED: "failed"
}