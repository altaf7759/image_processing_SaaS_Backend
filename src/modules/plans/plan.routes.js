import express from "express";
import { createPlan } from "./plan.repository.js";
import { validatePlan } from "./plan.validation.js";
import { planController } from "./plan.controller.js";
import { validateRole, validateToken } from "../../middlewares/user.middleware.js";
import { getPlansController } from "./plan.controller.js";
import { ROLES } from "../../constants/constants.js";

export const planRouter = express.Router();

planRouter.post('/create', validateToken, validatePlan, validateRole(ROLES.ADMIN), planController);
planRouter.get('/all', getPlansController);