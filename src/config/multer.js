import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import path from "path";
import { FILE_TYPES, LIMITS } from "../constants/constants.js";
import AppError from "../utils/AppError.js";

export const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
});

const storage = multerS3({
      s3: s3,
      bucket: process.env.R2_BUCKET_NAME,
      acl: "public-read",
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            const extension = path.extname(file.originalname);

            const folder = `users/${req.user.id}/originals`;

            const fileName = `${folder}/${uniqueSuffix}${extension}`;

            cb(null, fileName);
      }
});

const fileFilter = (req, file, cb) => {
      const allowedMimeTypes = Object.values(FILE_TYPES);
      if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
      } else {
            cb(new AppError("Invalid file type. Only JPG, PNG, and GIF are allowed.", 400), false);
      }
};

export const upload = multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
            fileSize: LIMITS.MAX_FILE_SIZE
      }
});
