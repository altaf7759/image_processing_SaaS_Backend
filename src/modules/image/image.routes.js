import express from 'express'
import { UploadImageController } from './image.controller.js'
import { upload } from '../../config/multer.js'
import { validateToken, validateRole } from '../../middlewares/user.middleware.js'
import { ROLES } from '../../constants/constants.js'
import { validateUploadImage } from './image.validation.js'
import { streamBatchProgress } from '../../events/jobs.events.js'

export const imageRouter = express.Router()

imageRouter.post('/upload', validateToken, validateRole(ROLES.USER, ROLES.ADMIN), upload.single('image'), validateUploadImage, UploadImageController)
imageRouter.get('/progress/:batchId/stream', validateToken, validateRole(ROLES.USER, ROLES.ADMIN), streamBatchProgress)