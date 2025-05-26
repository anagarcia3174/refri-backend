import AppError from "../utils/app-error.util";
import { StatusCodes } from "http-status-codes";
import { config } from "../config/config";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import {
  addRefreshToken,
  getUserByRefreshToken,
  removeAllRefreshTokens,
  removeRefreshToken,
} from "../services/user.service";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util";
import { ApiResponse, AuthResponse } from "../types/api.types";
import { ref } from "process";
import { logger } from "../utils/logger.util";

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
      throw new AppError(
        "Unauthorized",
        StatusCodes.UNAUTHORIZED,
        "no-refresh-token"
      );
    }

    const refreshToken = cookies.jwt;

    res.clearCookie("jwt", {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });

    const user = await getUserByRefreshToken(refreshToken);

    const result = verifyRefreshToken(refreshToken);

    if (!user) {
      if (result.payload?.userId) {
        logger.warn(
          `Refresh token with no owner found, token belonged to user: ${result.payload.userId}`
        );
      }
      throw new AppError(
        "Forbidden",
        StatusCodes.FORBIDDEN,
        "invalid-refresh-token"
      );
    }

    await removeRefreshToken(user.id, refreshToken);

    if (result.isExpired) {
      throw new AppError(
        "Forbidden",
        StatusCodes.FORBIDDEN,
        "expired-refresh-token"
      );
    }

    if (result.isValid && result.payload?.userId !== user.id) {
      throw new AppError(
        "Forbidden",
        StatusCodes.FORBIDDEN,
        "invalid-refresh-token"
      );
    } else if (result.isValid && result.payload?.userId === user.id) {
      const accessToken = createAccessToken(user.id);
      const newRefreshToken = createRefreshToken(user.id);
      await addRefreshToken(user.id, refreshToken);

      res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: true,
      });
      const response: ApiResponse<AuthResponse> = {
        status: "success",
        data: {
          userId: user.id,
          accessToken,
        },
      };
      res.status(200).json(response);
    } else {
      throw new AppError(
        "Forbidden",
        StatusCodes.FORBIDDEN,
        "invalid-refresh-token"
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(
      new AppError(
        "Error refreshing token",
        StatusCodes.INTERNAL_SERVER_ERROR,
        "server-error"
      )
    );
  }
};
