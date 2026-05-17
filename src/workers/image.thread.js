import "dotenv/config";
import { parentPort, workerData } from "worker_threads";
import sharp from "sharp";
import axios from "axios";
import { Upload } from "@aws-sdk/lib-storage";
import { s3 } from "../config/multer.js";
import { SOCIAL_PRESETS } from "../constants/constants.js";

(async () => {
      try {
            const { signedUrl, target, userId } = workerData;

            // Step 1: Download (20%)
            const response = await axios({ url: signedUrl, responseType: "arraybuffer" });
            const originalBuffer = Buffer.from(response.data);
            parentPort.postMessage({ type: "progress", progress: 20 });

            // Step 2: Read Metadata & Process (60%)
            const metadata = await sharp(originalBuffer).metadata();
            const format = metadata.format;
            const extension = format === "jpeg" ? "jpg" : format;

            const dimensions = SOCIAL_PRESETS[target];
            if (!dimensions) {
                  throw new Error(`Target preset configuration metadata missing for: ${target}`);
            }

            const outputBuffer = await sharp(originalBuffer)
                  .resize(dimensions.width, dimensions.height, {
                        fit: "cover",
                        position: "center"
                  })
                  .toFormat(format, { quality: 85 })
                  .toBuffer();

            parentPort.postMessage({ type: "progress", progress: 60 });

            // Step 3: Uploading (100%)
            const fileName = `processed/${userId}/${Date.now()}-${target}.${extension}`;

            const upload = new Upload({
                  client: s3,
                  params: {
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: fileName,
                        Body: outputBuffer,
                        ContentType: `image/${format}`
                  }
            });
            await upload.done();

            parentPort.postMessage({ type: "progress", progress: 100 });
            parentPort.postMessage({ type: "done", result: { fileName } });

      } catch (error) {
            parentPort.postMessage({ type: "error", error: error.message });
      }
})();