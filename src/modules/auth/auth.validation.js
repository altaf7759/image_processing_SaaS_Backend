import { z } from "zod";

import AppError from "../../utils/AppError.js";

const timezoneSchema = z
      .string()
      .refine(
            (tz) => {
                  try {
                        Intl.DateTimeFormat(undefined, { timeZone: tz });
                        return true;
                  } catch {
                        return false;
                  }
            },
            { message: "Invalid timezone format provided" }
      );

export const registerSchema = z.object({
      name: z
            .string()
            .trim()
            .min(1, "Name is required")
            .max(50, "Name too long"),

      email: z
            .string()
            .trim()
            .email("Invalid email format"),

      password: z
            .string()
            .min(6, "Password must be at least 6 characters"),

      timezone: timezoneSchema.optional()
});

export const validateRegister = (req, res, next) => {
      const result = registerSchema.safeParse(req.body);

      if (!result.success) {
            const errorMessages = Object.values(result.error.flatten().fieldErrors)
                  .flat()
                  .join(", ");
            throw new AppError(errorMessages, 400);
      }

      req.body = result.data;
      next();
};

export const loginSchema = z.object({
      email: z
            .string()
            .trim()
            .email("Invalid email format"),

      password: z
            .string()
            .min(6, "Password must be at least 6 characters")
});

export const validateLogin = (req, res, next) => {
      const result = loginSchema.safeParse(req.body);

      if (!result.success) {
            const errorMessages = Object.values(result.error.flatten().fieldErrors)
                  .flat()
                  .join(", ");
            throw new AppError(errorMessages, 400);
      }

      req.body = result.data;
      next();
};