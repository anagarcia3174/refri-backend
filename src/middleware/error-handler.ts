import { NextFunction, Request, Response } from "express";
import { config } from "../config/config";
import AppError from "../utils/AppError";
import { ErrorType } from "../types/error.types";
import { logger } from "./logger";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    ...(error instanceof AppError && {
      errorType: error.type,
      statusCode: error.status,
    }),
  });

  if (res.headersSent || config.nodeEnv === "debug") {
    next(error);
    return;
  }

  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.status : 500;
  const errorType = isAppError ? error.type : ErrorType.SERVER_ERROR;
  const message = error.message || "Internal Server Error";

  const responseBody: any = {
    success: false,
    message: message,
    type: errorType,
  };

  if (config.nodeEnv === "development" || config.nodeEnv === "test") {
    responseBody.stack = error.stack;
  }

  res.status(statusCode).json(responseBody);
};
