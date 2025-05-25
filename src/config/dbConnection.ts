import mongoose from "mongoose";
import { dbConfig } from "./config";
import AppError from "../utils/AppError";
import { logger } from "../middleware/logger";
import { StatusCodes } from "http-status-codes";
import { ErrorCode } from "../types/error.types";

export const connectDB = () => {
  if (!dbConfig.mongoURL) {
    throw new AppError(
      "MongoDB URL is not defined",
      StatusCodes.INTERNAL_SERVER_ERROR,
      ErrorCode.DATABASE_ERROR
    );
  }
  mongoose.connect(dbConfig.mongoURL);

  mongoose.connection.on("error", (error: Error) => {
    throw new AppError(
      `MongoDB connection error: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR,
      ErrorCode.DATABASE_ERROR
    );
  });

  mongoose.connection.on("open", () => {
    logger.info("MongoDB connected");
  });
};
