import { z } from "zod";
import AppError from "../../utils/AppError.js";

export const planSchema = z.object({
      name: z
            .string()
            .trim()
            .min(1, "Plan name is required")
            .max(100, "Plan name must be under 100 characters"),

      daily_jobs_limit: z
            .number({ invalid_type_error: "Daily jobs limit must be a number" })
            .int("Daily jobs limit must be an integer")
            .min(0, "Daily jobs limit cannot be negative"),

      max_file_size_mb: z
            .number({ invalid_type_error: "Max file size must be a number" })
            .int("Max file size must be an integer")
            .positive("Max file size must be greater than 0"),

      priority_level: z
            .number({ invalid_type_error: "Priority level must be a number" })
            .int("Priority level must be an integer")
            .min(1, "Priority level must be at least 1"),

      storage_limit_mb: z
            .number({ invalid_type_error: "Storage limit must be a number" })
            .int("Storage limit must be an integer")
            .min(0, "Storage limit cannot be negative"),

      watermark_enabled: z
            .boolean()
            .optional()
            .default(false),

      price: z
            .number({ invalid_type_error: "Price must be a number" })
            .min(0, "Price cannot be negative"),

      is_active: z
            .boolean()
            .optional()
            .default(true)
});

export const validatePlan = (req, res, next) => {
      const result = planSchema.safeParse(req.body);

      if (!result.success) {
            const errorMessages = Object.values(result.error.flatten().fieldErrors)
                  .flat()
                  .join(", ");
            throw new AppError(errorMessages, 400);
      }

      req.body = result.data;
      next();
};