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
  updateUserEmailVerification,
  getUserById,
  updateUserPassword,
} from "../services/userService";
import { CreateUserRequest, LoginRequest } from "../types/user.types";
import { logger } from "../middleware/logger";
import AppError from "../utils/AppError";
import { config } from "../config/config";
import { sendVerificationEmail } from "../services/emailService";
import path from 'path';
import fs from 'fs/promises';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password }: CreateUserRequest = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = await createUser({
      username,
      email,
      password: hashedPassword,
    });

    // Generate JWT token
    const accessToken = jwt.sign(
      { userId },
      config.accessTokenSecret,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { userId },
      config.refreshTokenSecret,
      { expiresIn: "30d" }
    );
    const verificationToken = jwt.sign(
      { userId},
      config.emailVerificationTokenSecret,
      { expiresIn: "15m"}
    );

    await addRefreshToken(userId, refreshToken);

    logger.info(`User registered successfully: ${userId}`);

    await sendVerificationEmail(email, verificationToken, username);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });
    // Return success response
    res.status(201).json({
      status: "success",
      data: {
        userId,
        accessToken,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error during registration", 500, 'server-error'));
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;
    const cookies = req.cookies;
    // Get user by email
    const user = await getUserToLogin(email);
    if (!user) {
      throw new AppError(
        "Invalid email or password",
        401,
        'invalid-credentials'
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        "Invalid email or password",
        401,
        'invalid-credentials'
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

    logger.info(`User logged in successfully: ${user.id}`);

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
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error during login", 500, 'server-error'));
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
      throw new AppError("Unauthorized", 401, 'no-refresh-token');
    }

    const refreshToken = cookies.jwt;

    res.clearCookie("jwt", {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });

    const userId = await getUserByRefreshToken(refreshToken);

    if (!userId) {
      jwt.verify(
        refreshToken,
        config.refreshTokenSecret,
        async (
          err: jwt.VerifyErrors | null,
          payload: JwtPayload | string | undefined
        ) => {
          if (err) {
            throw new AppError("Forbidden", 403, 'expired-refresh-token');
          }
          if (typeof payload === "object" && "userId" in payload) {
            await removeAllRefreshTokens(payload.userId);
          }
        }
      );
      throw new AppError("Forbidden", 403, 'invalid-refresh-token');
    }

    await removeRefreshToken(userId, refreshToken);

    jwt.verify(
      refreshToken,
      config.refreshTokenSecret,
      async (
        err: jwt.VerifyErrors | null,
        payload: JwtPayload | string | undefined
      ) => {
        if(err){
          throw new AppError("Forbidden", 403, 'expired-refresh-token');
        }
        if (typeof payload === "object" && "userId" in payload) {
          if (payload.userId !== userId) {
            throw new AppError("Forbidden", 403, 'invalid-refresh-token');
          }
        }
        const accessToken = jwt.sign(
          { userId },
          config.accessTokenSecret,
          { expiresIn: "15m" }
        );
        const newRefreshToken = jwt.sign(
          { userId },
          config.refreshTokenSecret,
          { expiresIn: "30d" }
        );
        await addRefreshToken(userId, newRefreshToken);

        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
          secure: true,
        });
        res.status(200).json({
          status: "success",
          data: {
            userId,
            accessToken,
          },
        });
      }
    );
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error refreshing token", 500, 'server-error'));
  }
};


export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cookies = req.cookies;

    if (!cookies?.jwt){
        res.sendStatus(204);
        return;
    }

    const refreshToken = cookies.jwt;

    const foundUserId = await getUserByRefreshToken(refreshToken);
    if(!foundUserId){
      res.clearCookie("jwt", {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: true,
      });
       res.sendStatus(204);
       return;
    }

    await removeRefreshToken(foundUserId, refreshToken);
    res.clearCookie("jwt", {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });
    
    logger.info(`User logged out successfully: ${foundUserId}`);

    res.sendStatus(204);
    return;

    
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error during logout", 500, 'server-error'));
  }
};

export const verifyEmail = async(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.query.token as string;
    if (!token) {
      throw new AppError("Verification token is required", 400, 'missing-token');
    }

    jwt.verify(token, config.emailVerificationTokenSecret, async (
      err: jwt.VerifyErrors | null,
      payload: JwtPayload | string | undefined
    ) => {
      if (err) {
        const expiredTemplate = await fs.readFile(
          path.join(__dirname, '../templates/emails/verification-expired.html'),
          'utf-8'
        );
        res.status(400).send(expiredTemplate);
        return;
      }

      if (typeof payload === "object" && "userId" in payload) {
        await updateUserEmailVerification(payload.userId, true);
        logger.info(`User email verified successfully: ${payload.userId}`);
        
        const successTemplate = await fs.readFile(
          path.join(__dirname, '../templates/emails/verification-success.html'),
          'utf-8'
        );
        res.status(200).send(successTemplate);
        return;
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error verifying email", 500, 'server-error'));
  }
}

export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId){
      throw new AppError("Unauthorized", 401, 'no-user');

    }

    const user = await getUserById(userId);
    if(!user){
      throw new AppError("User not found", 404, 'no-user')
    }

    if (user.isVerified){
      throw new AppError("Email already verified", 400, 'email-already-verified');
    }

    const verificationToken = jwt.sign(
      { userId: user.id},
      config.emailVerificationTokenSecret,
      {expiresIn: "15m"}
    )

    await sendVerificationEmail(user.email, verificationToken, user.username);

    logger.info(`Verification email resent successfully: ${user.id}`);

    res.status(200).json({
      status: "success",
      message: "Verification email sent"
    })
  }catch(error){
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error resending verification email", 500, 'server-error'));
  }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError("User not found.", 401, 'no-user');
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await getUserToLogin(userId);
    if (!user) {
      throw new AppError("User not found.", 404, 'no-user');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect.", 401, 'invalid-credentials');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await updateUserPassword(userId, hashedPassword);

    // Remove all refresh tokens to force re-login
    await removeAllRefreshTokens(userId);

    logger.info(`User password changed successfully: ${userId}`);

    res.status(200).json({
      status: "success",
      message: "Password changed successfully"
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error changing password", 500, 'server-error'));
  }
};