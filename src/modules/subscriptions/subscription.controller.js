import { processSubscription } from "./subscription.services.js";

export const subscriptionController = async (req, res, next) => {
      try {
            const subscriptionResult = await processSubscription(req.user.id, req.params.plan_id, req.body.auto_renew, req.user.email, req.user.name);

            res.json({
                  success: true,
                  message: "Subscription activated successfully",
                  subscription: subscriptionResult
            });
      } catch (error) {
            next(error)
      }
}