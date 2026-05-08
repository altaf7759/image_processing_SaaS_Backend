import "dotenv/config";
import express from "express";

import { authRouter } from "./modules/auth/auth.routes.js";
import { GlobalErrorHandler } from "./utils/GlobalError.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.use(GlobalErrorHandler)

export default app;