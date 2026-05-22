import "dotenv/config";
import { parentPort, workerData } from "worker_threads";
import sharp from "sharp";
import axios from "axios";
import { Upload } from "@aws-sdk/lib-storage";
import { s3 } from "../config/multer.js";
import { SOCIAL_PRESETS } from "../constants/constants.js";

(async () => {
      const startedAt = Date.now();

      try {
            const {
                  signedUrl,
                  target,
                  userId
            } = workerData;

            /* =========================================
               STEP 1: DOWNLOAD ORIGINAL IMAGE
            ========================================= */

            const response = await axios({
                  url: signedUrl,
                  responseType: "arraybuffer"
            });

            const originalBuffer = Buffer.from(response.data);

            parentPort.postMessage({
                  type: "progress",
                  progress: 20
            });

            /* =========================================
               STEP 2: READ ORIGINAL METADATA
            ========================================= */

            const originalMetadata =
                  await sharp(originalBuffer).metadata();

            const inputFormat =
                  originalMetadata.format;

            if (!inputFormat) {
                  throw new Error(
                        "Unable to determine source image format"
                  );
            }

            const extension =
                  inputFormat === "jpeg"
                        ? "jpg"
                        : inputFormat;

            /* =========================================
               STEP 3: GET TARGET DIMENSIONS
            ========================================= */

            const dimensions =
                  SOCIAL_PRESETS[target];

            if (!dimensions) {
                  throw new Error(
                        `Target preset configuration missing for: ${target}`
                  );
            }

            /* =========================================
               STEP 4: PROCESS IMAGE
            ========================================= */

            const outputBuffer = await sharp(originalBuffer)
                  .resize(
                        dimensions.width,
                        dimensions.height,
                        {
                              fit: "cover",
                              position: "center"
                        }
                  )
                  .toFormat(inputFormat, {
                        quality: 85
                  })
                  .toBuffer();

            parentPort.postMessage({
                  type: "progress",
                  progress: 60
            });

            /* =========================================
               STEP 5: READ OUTPUT METADATA
            ========================================= */

            const outputMetadata =
                  await sharp(outputBuffer).metadata();

            /* =========================================
               STEP 6: GENERATE FILE PATH
            ========================================= */

            const uniqueSuffix =
                  `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

            const folder =
                  `users/${userId}/processed/${target}`;

            const fileName =
                  `${folder}/${uniqueSuffix}.${extension}`;

            /* =========================================
               STEP 7: UPLOAD TO R2
            ========================================= */

            const upload = new Upload({
                  client: s3,
                  params: {
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: fileName,
                        Body: outputBuffer,
                        ContentType: `image/${inputFormat}`
                  }
            });

            await upload.done();

            parentPort.postMessage({
                  type: "progress",
                  progress: 100
            });

            /* =========================================
               STEP 8: FINAL RESULT PAYLOAD
            ========================================= */

            parentPort.postMessage({
                  type: "done",
                  result: {
                        fileName,

                        // storage
                        fileSize: outputBuffer.length,

                        // dimensions
                        width: outputMetadata.width,
                        height: outputMetadata.height,

                        // format
                        format: outputMetadata.format,

                        // timing
                        processingTimeMs:
                              Date.now() - startedAt,

                        // optional analytics
                        originalWidth:
                              originalMetadata.width,

                        originalHeight:
                              originalMetadata.height,

                        target
                  }
            });

      } catch (error) {

            parentPort.postMessage({
                  type: "error",
                  error:
                        error?.message ||
                        "Unexpected image processing failure"
            });
      }
})();