import { ca } from "zod/locales";
import { processCreatePlan } from "./plan.service.js";
import { getPlans } from "./plan.repository.js";

export const planController = async (req, res, next) => {
      try {
            const plan = await processCreatePlan(req.body);
            res.status(200).json({
                  status: 'success',
                  message: 'Plan created successfully',
                  plan
            });
      } catch (error) {
            next(error);
      }
};

export const getPlansController = async (req, res, next) => {
      try {
            const plans = await getPlans();
            res.status(200).json({
                  status: 'success',
                  plans
            });
      } catch (error) {
            next(error);
      }
}