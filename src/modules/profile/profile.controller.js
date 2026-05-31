import { processProfile } from "./profile.service.js"


export const profileController = async (req, res, next) => {
      try {
            const profileData = await processProfile(req.params.userId, req.user.subscription.plan_id)

            res.status(200).json({ profileData })
      } catch (error) {
            next(error)
      }
}