import z from "zod";
import AppError from "../../utils/AppError.js";

export const subscriptionSchema = z.object({
      plan_id: z.string().uuid("Invalid plan price ID format"),

      auto_renew: z.boolean().optional()
});

export const subscriptionValidation = (req, res, next) => {
      const result = subscriptionSchema.safeParse({ ...req.params, ...req.body });

      if (!result.success) {
            const errorMessages = Object.values(result.error.flatten().fieldErrors)
                  .flat()
                  .join(", ");
            throw new AppError(errorMessages, 400);
      }

      req.body = result.data;
      next();
}