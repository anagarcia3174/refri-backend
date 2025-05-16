import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  addRefreshToken,
  createUser,
  getUserToLogin,
  getUserByRefreshToken,
  removeAllRefreshTokens,
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
        userId: user.id,
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
    const cookies = req.cookies;
    // Get user by email
    const user = await getUserToLogin(email);
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

    if (cookies?.jwt) {
      const tokenUser = await getUserByRefreshToken(cookies.jwt);
      if (!tokenUser) {
        await removeAllRefreshTokens(user.id);
      } else {
        await removeRefreshToken(user.id, cookies.jwt);
      }

      res.clearCookie("jwt", {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: true,
      });
    }

    await addRefreshToken(user.id, refreshToken);

    logger.info(`User logged in successfully: ${user._id}`);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });

    // Return success response
    res.status(200).json({
      status: "success",
      data: {
        userId: user.id,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
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

    res.clearCookie("jwt", {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });

    const user = await getUserByRefreshToken(refreshToken);

    if (!user) {
      jwt.verify(
        refreshToken,
        config.refreshTokenSecret,
        async (
          err: jwt.VerifyErrors | null,
          payload: JwtPayload | string | undefined
        ) => {
          if (err) {
            throw new AppError("Forbidden", 403, ErrorType.AUTHENTICATION);
          }
          if (typeof payload === "object" && "userId" in payload) {
            await removeAllRefreshTokens(payload.userId);
          }
        }
      );
      throw new AppError("Forbidden", 403, ErrorType.AUTHENTICATION);
    }

    await removeRefreshToken(user.id, refreshToken);

    jwt.verify(
      refreshToken,
      config.refreshTokenSecret,
      async (
        err: jwt.VerifyErrors | null,
        payload: JwtPayload | string | undefined
      ) => {
        if(err){
          throw new AppError("Forbidden", 403, ErrorType.AUTHENTICATION);
        }
        if (typeof payload === "object" && "userId" in payload) {
          if (payload.userId !== user.id) {
            throw new AppError("Forbidden", 403, ErrorType.AUTHENTICATION);
          }
        }
        const accessToken = jwt.sign(
          { userId: user.id },
          config.accessTokenSecret,
          { expiresIn: "15m" }
        );
        const newRefreshToken = jwt.sign(
          { userId: user.id },
          config.refreshTokenSecret,
          { expiresIn: "30d" }
        );
        await addRefreshToken(user.id, newRefreshToken);

        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
          secure: true,
        });
        res.status(200).json({
          status: "success",
          data: {
            userId: user.id,
            accessToken,
          },
        });
      }
    );
  } catch (error) {
    next(error);
  }
};


export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.jwt){
        res.sendStatus(204);
        return;
    }

    const refreshToken = cookies.jwt;

    const foundUser = await getUserByRefreshToken(refreshToken);
    if(!foundUser){
      res.clearCookie("jwt", {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: true,
      });
       res.sendStatus(204);
       return;
    }

    await removeRefreshToken(foundUser.id, refreshToken);
    res.clearCookie("jwt", {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });
     res.sendStatus(204);
     return;

    
  } catch (error) {
    next(error);
  }
};