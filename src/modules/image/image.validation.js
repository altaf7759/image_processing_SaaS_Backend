import { z } from "zod";
import AppError from "../../utils/AppError.js";
import { MAX_NUMBER_OF_JOBS } from "../../constants/constants.js";

const SOCIAL_PRESETS = ["youtube_thumbnail", "insta_post", "insta_story", "fb_cover"];

export const uploadImageSchema = z.object({
      file: z.object({
            originalname: z.string(),
            mimetype: z.string(),
            size: z.number(),
      }, { required_error: "No file uploaded. Please select an image." })
            .refine((file) => {
                  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
                  return allowedMimeTypes.includes(file.mimetype);
            }, "Invalid file type. Only JPG, PNG, and GIF are allowed.")
            .refine((file) => file.size <= 5 * 1024 * 1024, "File is too large. Max limit is 5MB."),

      // Validate the presets array
      targets: z.preprocess((val) => {
            if (typeof val === 'string') {
                  try { return JSON.parse(val); } catch { return [val]; }
            }
            return val;
      }, z.array(z.enum(SOCIAL_PRESETS, {
            errorMap: () => ({ message: "Invalid social media preset selected." })
      })).min(1, "At least one transformation target is required.")),

      totalJobs: z.preprocess((val) => {
            if (val === undefined || val === null || val === "") return undefined;
            return Number(val);
      }, z.number({
            required_error: "totalJobs was not received",
            invalid_type_error: "totalJobs must be a valid number"
      })
            .int()
            .min(1, "totalJobs must be at least 1")
            .max(MAX_NUMBER_OF_JOBS, `totalJobs cannot exceed ${MAX_NUMBER_OF_JOBS}`))
}).refine((data) => data.targets.length === data.totalJobs, {
      message: "totalJobs must match the number of selected targets.",
      path: ["totalJobs"]
});

export const validateUploadImage = (req, res, next) => {
      const result = uploadImageSchema.safeParse({
            file: req.file,
            targets: req.body.targets,
            totalJobs: req.body.totalJobs
      });

      if (!result.success) {
            const errorMessages = Object.values(result.error.flatten().fieldErrors)
                  .flat()
                  .join(", ");

            return next(new AppError(errorMessages, 400));
      }

      req.body = result.data;
      next();
};
