import express from "express";
import { validateRole, validateToken } from "../../middlewares/user.middleware.js";
import { subscriptionValidation } from "./subscription.validation.js";
import { subscriptionController } from "./subscription.controller.js";
import { ROLES } from "../../constants/constants.js";

export const subscriptionRouter = express.Router();

subscriptionRouter.post("/:plan_id", validateToken, validateRole(ROLES.USER), subscriptionValidation, subscriptionController);