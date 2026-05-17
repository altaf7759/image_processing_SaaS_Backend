import { addImageToQueue } from "./image.service.js";

export const UploadImageController = async (req, res, next) => {
      try {
            const { totalJobs } = req.body;
            if (!totalJobs) {
                  return res.status(400).json({ success: false, message: "Missing required fields: totalJobs." });
            }

            const result = await addImageToQueue(req);

            res.status(200).json({
                  success: true,
                  message: "Image processing job added to the queue successfully.",
                  data: result
            });
      } catch (error) {
            next(error);
      }
}