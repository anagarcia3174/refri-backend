import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  addRefreshToken,
  createUser,
  getUserByEmail,
  getUserById,
  getUserByRefreshToken,
  removeRefreshToken,
} from "../services/userService";
import { CreateUserRequest, LoginRequest } from "../types/user.types";
import { logger } from "../middleware/logger";
import AppError from "../utils/AppError";
import { ErrorType } from "../types/error.types";
import { config } from "../config/config";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email, password }: CreateUserRequest = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await createUser({
      username,
      email,
      password: hashedPassword,
    });

    // Generate JWT token
    const accessToken = jwt.sign(
      { userId: user.id },
      config.accessTokenSecret,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      config.refreshTokenSecret,
      { expiresIn: "30d" }
    );

    await addRefreshToken(user.id, refreshToken);

    logger.info(`User registered successfully: ${user.id}`);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });

    // Return success response
    res.status(201).json({
      status: "success",
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      throw new AppError(
        "Invalid email or password",
        401,
        ErrorType.AUTHENTICATION
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        "Invalid email or password",
        401,
        ErrorType.AUTHENTICATION
      );
    }

    const accessToken = jwt.sign(
      { userId: user.id },
      config.accessTokenSecret,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      config.refreshTokenSecret,
      { expiresIn: "30d" }
    );

    await addRefreshToken(user.id, refreshToken);

    // Remove password from user object
    const {
      refreshTokens,
      password: _,
      ...userWithoutPassword
    } = user.toObject();

    logger.info(`User logged in successfully: ${user._id}`);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true
    });

    // Return success response
    res.status(200).json({
      status: "success",
      data: {
        user: userWithoutPassword,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const checkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // User is already attached to request by auth middleware
    const user = await getUserById(req.user!.userId);

    res.status(200).json({
      status: "success",
      data: {
        user,
        isAuthenticated: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
      throw new AppError("Unauthorized", 401, ErrorType.AUTHENTICATION);
    }

    const refreshToken = cookies.jwt;

    const user = await getUserByRefreshToken(refreshToken);

    if (!user) {
      throw new AppError("Forbidden", 403, ErrorType.AUTHENTICATION);
    }

    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret) as {
      userId: string;
    };

    if (user.id !== decoded.userId) {
      throw new AppError("Forbidden", 403, ErrorType.AUTHENTICATION);
    }

    const accessToken = jwt.sign(
      { userId: user.id },
      config.accessTokenSecret,
      { expiresIn: "15m" }
    );

    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export const handleLogout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
      res.sendStatus(204);
    }

    const refreshToken = cookies.jwt;

    const user = await getUserByRefreshToken(refreshToken);

    if (!user) {
      res.clearCookie("jwt", {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: true,
      });
      res.sendStatus(204);
    } else {
      await removeRefreshToken(user.id, refreshToken);
      res.clearCookie("jwt", {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.sendStatus(204);
    }
  } catch (error) {
    next(error);
  }
};
