import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

import "./workers/image.worker.js"
import "./workers/email.worker.js"
import { authRouter } from "./modules/auth/auth.routes.js";
import { planRouter } from "./modules/plans/plan.routes.js";
import { imageRouter } from "./modules/image/image.routes.js";
import { GlobalErrorHandler } from "./utils/GlobalError.js";
import { subscriptionRouter } from "./modules/subscriptions/subscription.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/plans", planRouter);
app.use("/api/subscriptions", subscriptionRouter);
app.use("/api/images", imageRouter);

app.use(GlobalErrorHandler)

export default app;