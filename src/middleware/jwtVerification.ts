import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config/config";
import AppError from "../utils/AppError";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = (req.headers.authorization ||
      req.headers.Authorization) as string;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "No token provided, authorization denied",
        401,
        'no-token'
      );
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(
      token,
      config.accessTokenSecret,
      (
        err: jwt.VerifyErrors | null,
        payload: JwtPayload | string | undefined
      ) => {
        if (err) {
          throw new AppError("Invalid Token", 403, 'expired-token');
        }

        if (typeof payload === "object" && "userId" in payload) {
          req.user = { userId: payload.userId };
        }else{
          throw new AppError("Invalid Token", 403, 'invalid-token');
        }

        next();
      }
    );
  } catch (error) {
    next(error);
  }
};
