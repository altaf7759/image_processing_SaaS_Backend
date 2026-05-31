import express from "express"
import { validateToken } from "../../middlewares/user.middleware.js"
import { profileController } from "./profile.controller.js"

export const profileRouter = express.Router()

profileRouter.get("/:userId", validateToken, profileController)