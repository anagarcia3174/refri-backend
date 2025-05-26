import mongoose from "mongoose";
import { dbConfig } from "./config";
import AppError from "../utils/app-error.util";
import { logger } from "../utils/logger.util";
import { StatusCodes } from "http-status-codes";

interface dbConfig {
  mongoURL: string;
}

const dbConfig: dbConfig = {
  mongoURL: process.env.MONGO_URL || 'mongodb://localhost:27017/your-database-name',
}

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
