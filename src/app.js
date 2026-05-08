import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

import { authRouter } from "./modules/auth/auth.routes.js";
import { planRouter } from "./modules/plans/plan.routes.js";
import { GlobalErrorHandler } from "./utils/GlobalError.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/plans", planRouter);

app.use(GlobalErrorHandler)

export default app;