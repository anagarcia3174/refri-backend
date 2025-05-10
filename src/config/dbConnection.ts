import mongoose from "mongoose";
import { dbConfig } from "./config";
import AppError from "../utils/AppError";
import { ErrorType } from "../types/error.types";
import { logger } from "../middleware/logger";

export const connectDB = () => {
  if (!dbConfig.mongoURL) {
    throw new AppError(
      "MongoDB URL is not defined",
      500,
      ErrorType.SERVER_ERROR
    );
  }
  mongoose.connect(dbConfig.mongoURL);

  mongoose.connection.on("error", (error: Error) => {
    throw new AppError(
      `MongoDB connection error: ${error.message}`,
      500,
      ErrorType.SERVER_ERROR
    );
  });

  mongoose.connection.on("open", () => {
    logger.info("MongoDB connected");
  });
};
