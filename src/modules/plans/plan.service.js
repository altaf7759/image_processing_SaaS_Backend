import { Plan } from '../../models/plan.models.js';
import AppError from '../../utils/AppError.js';
import { createPlan } from './plan.repository.js';

export const processCreatePlan = async (planData) => {
      const plan = await Plan.findByName(planData.name);
      if (plan) {
            throw new AppError('Plan with this name already exists', 400);
      }

      return await createPlan(planData);
}