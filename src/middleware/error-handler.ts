import { NextFunction, Request, Response } from "express";
import { config } from "../config/config";
import AppError from "../utils/AppError";
import { logger } from "./logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    // Log expected errors at info level with context
    logger.info(`Expected error occurred: ${err.message}`, {
      errorCode: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.userId
    });

    return res.status(err.statusCode).json({
      status: "error",
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  // Log unexpected errors at error level with full context
  logger.error(`Unexpected error occurred: ${err.message}`, {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    body: req.body,
    query: req.query,
    params: req.params
  });

  return res.status(500).json({
    status: "error",
    error: {
      message: "Internal server error",
      code: "server-error",
    },
  });
};
