import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/multer.js";
import AppError from "../utils/AppError.js"

export const getR2SignedUrl = async (r2Key) => {
      const getCommand = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: r2Key,
      });
      const signedUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
      return signedUrl;
}

export const deleteR2Object = async (r2Key) => {
      try {
            const deleteCommand = new DeleteObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: r2Key,
            });
            await s3.send(deleteCommand);
      } catch (deleteError) {
            throw new AppError(`CRITICAL: Failed to delete orphaned image from R2: ${deleteError.message}`, 500);
      }
}