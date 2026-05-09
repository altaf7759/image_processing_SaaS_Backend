import e from "express";

export function GlobalErrorHandler(err, req, res, next) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`[ERROR] ${message}`);
      console.error(err.stack);

      res.status(statusCode).json({
            success: false,
            message: err.isOperational ? message : err.message || "An unexpected error occurred"
      });
};