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
import { ApiResponse, AuthResponse, AuthStatusResponse } from "../types/api.types";
import { logger } from "../middleware/logger";
import AppError from "../utils/AppError";
import { config } from "../config/config";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService";
import path from 'path';
import fs from 'fs/promises';
import { StatusCodes } from "http-status-codes";
import { createToken } from "../utils/jwt.util";

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
    const accessToken = createToken(
      userId,
      config.accessTokenSecret,
      15 * 60 // 15 minutes in seconds
    );
    const refreshToken = createToken(
      userId,
      config.refreshTokenSecret,
      30 * 24 * 60 * 60 // 30 days in seconds
    );
    const verificationToken = createToken(
      userId,
      config.emailVerificationTokenSecret,
      15 * 60 // 15 minutes in seconds
    );

    await addRefreshToken(userId, refreshToken);

    logger.info(`User registered successfully: ${userId}`);

    await sendVerificationEmail(email, verificationToken, username);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });

    const response: ApiResponse<AuthResponse> = {
      status: "success",
      data: {
        userId,
        accessToken,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error during registration", StatusCodes.INTERNAL_SERVER_ERROR, 'server-error'));
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
        StatusCodes.UNAUTHORIZED,
        'invalid-credentials'
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        "Invalid email or password",
        StatusCodes.UNAUTHORIZED,
        'invalid-credentials'
      );
    }

    const accessToken = createToken(
      user.id,
      config.accessTokenSecret,
      15 * 60 // 15 minutes in seconds
    );
    const refreshToken = createToken(
      user.id,
      config.refreshTokenSecret,
      30 * 24 * 60 * 60 // 30 days in seconds
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

    const response: ApiResponse<AuthResponse> = {
      status: "success",
      data: {
        userId: user.id,
        accessToken,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error during login", StatusCodes.INTERNAL_SERVER_ERROR, 'server-error'));
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
      throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, 'no-refresh-token');
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
            throw new AppError("Forbidden", StatusCodes.FORBIDDEN, 'expired-refresh-token');
          }
          if (typeof payload === "object" && "userId" in payload) {
            await removeAllRefreshTokens(payload.userId);
          }
        }
      );
      throw new AppError("Forbidden", StatusCodes.FORBIDDEN, 'invalid-refresh-token');
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
          throw new AppError("Forbidden", StatusCodes.FORBIDDEN, 'expired-refresh-token');
        }
        if (typeof payload === "object" && "userId" in payload) {
          if (payload.userId !== userId) {
            throw new AppError("Forbidden", StatusCodes.FORBIDDEN, 'invalid-refresh-token');
          }
        }
        const accessToken = createToken(
          userId,
          config.accessTokenSecret,
          15 * 60 // 15 minutes in seconds
        );
        const newRefreshToken = createToken(
          userId,
          config.refreshTokenSecret,
          30 * 24 * 60 * 60 // 30 days in seconds
        );
        await addRefreshToken(userId, newRefreshToken);

        res.cookie("jwt", newRefreshToken, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
          secure: true,
        });
        const response: ApiResponse<AuthResponse> = {
          status: "success",
          data: {
            userId,
            accessToken,
          },
        };
        res.status(200).json(response);
      }
    );
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error refreshing token", StatusCodes.INTERNAL_SERVER_ERROR, 'server-error'));
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
    next(new AppError("Error during logout", StatusCodes.INTERNAL_SERVER_ERROR, 'server-error'));
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
      throw new AppError("Verification token is required", StatusCodes.BAD_REQUEST, 'missing-token');
    }

    jwt.verify(token, config.emailVerificationTokenSecret, async (
      err: jwt.VerifyErrors | null,
      payload: JwtPayload | string | undefined
    ) => {
      if (err) {
        const expiredTemplate = await fs.readFile(
          path.join(__dirname, '../templates/pages/verification-expired.html'),
          'utf-8'
        );
        res.status(400).send(expiredTemplate);
        return;
      }

      if (typeof payload === "object" && "userId" in payload) {
        await updateUserEmailVerification(payload.userId, true);
        logger.info(`User email verified successfully: ${payload.userId}`);
        
        const successTemplate = await fs.readFile(
          path.join(__dirname, '../templates/pages/verification-success.html'),
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
    next(new AppError("Error verifying email", StatusCodes.INTERNAL_SERVER_ERROR, 'server-error'));
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
      throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, 'no-user');

    }

    const user = await getUserById(userId);
    if(!user){
      throw new AppError("User not found", StatusCodes.NOT_FOUND, 'no-user')
    }

    if (user.isVerified){
      throw new AppError("Email already verified", StatusCodes.BAD_REQUEST, 'email-already-verified');
    }

    const verificationToken = createToken(
      user.id,
      config.emailVerificationTokenSecret,
      15 * 60 // 15 minutes in seconds
    );

    await sendVerificationEmail(user.email, verificationToken, user.username);

    logger.info(`Verification email resent successfully: ${user.id}`);

    const response: ApiResponse = {
      status: "success",
    };

    res.status(200).json(response);
  }catch(error){
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error resending verification email", StatusCodes.INTERNAL_SERVER_ERROR, 'server-error'));
  }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError("User not found.", StatusCodes.UNAUTHORIZED, 'no-user');
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await getUserToLogin(userId);
    if (!user) {
      throw new AppError("User not found.", StatusCodes.NOT_FOUND, 'no-user');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect.", StatusCodes.UNAUTHORIZED, 'invalid-credentials');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await updateUserPassword(userId, hashedPassword);

    // Remove all refresh tokens to force re-login
    await removeAllRefreshTokens(userId);

    logger.info(`User password changed successfully: ${userId}`);

    const response: ApiResponse = {
      status: "success",
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error changing password", StatusCodes.INTERNAL_SERVER_ERROR, 'server-error'));
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await getUserToLogin(email);

    if (!user){
      throw new AppError("User not found.", StatusCodes.NOT_FOUND, 'no-user');
    }

    const resetToken = createToken(
      user.id,
      config.passwordResetTokenSecret,
      30 * 60 // 30 minutes in seconds
    );

    await sendPasswordResetEmail(user.email, resetToken, user.username);

    logger.info(`Password reset email sent to: ${user.email}`);

    const response: ApiResponse = {
      status: "success",
    };

    res.status(200).json(response);
  }catch(error){
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error sending password reset email", StatusCodes.INTERNAL_SERVER_ERROR, 'server-error'));
  }
}

export const showResetPasswordForm = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.query.token as string;
    if (!token) {
      throw new AppError("Reset token is required", StatusCodes.BAD_REQUEST, 'missing-token');
    }

    // Verify the token is valid
    jwt.verify(token, config.passwordResetTokenSecret, async (
      err: jwt.VerifyErrors | null,
      payload: JwtPayload | string | undefined
    ) => {
      if (err) {
        const expiredTemplate = await fs.readFile(
          path.join(__dirname, '../templates/pages/reset-password-expired.html'),
          'utf-8'
        );
        res.status(400).send(expiredTemplate);
        return;
      }

      // If token is valid, show the reset password form
      const resetTemplate = await fs.readFile(
        path.join(__dirname, '../templates/pages/reset-password.html'),
        'utf-8'
      );
      res.status(200).send(resetTemplate);
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error showing reset password form", StatusCodes.INTERNAL_SERVER_ERROR, 'server-error'));
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token) {
      throw new AppError("Reset token is required", StatusCodes.BAD_REQUEST, 'missing-token');
    }

    jwt.verify(token, config.passwordResetTokenSecret, async (
      err: jwt.VerifyErrors | null,
      payload: JwtPayload | string | undefined
    ) => {
      if (err) {
        throw new AppError("Invalid or expired reset token", StatusCodes.BAD_REQUEST, 'invalid-token');
      }

      if (typeof payload === "object" && "userId" in payload) {
        await updateUserPassword(payload.userId, password);
        logger.info(`Password reset successful for user: ${payload.userId}`);

        const response: ApiResponse = {
          status: "success",
        };

        res.status(200).json(response);
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error resetting password", StatusCodes.INTERNAL_SERVER_ERROR, 'server-error'));
  }
};

export const getAuthStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      const response: ApiResponse<AuthStatusResponse> = {
        status: "success",
        data: {
          isAuthenticated: false
        }
      };
      res.status(200).json(response);
      return;
    }

    const user = await getUserById(userId);
    if (!user) {
      const response: ApiResponse<AuthStatusResponse> = {
        status: "success",
        data: {
          isAuthenticated: false
        }
      };
      res.status(200).json(response);
      return;
    }

    const response: ApiResponse<AuthStatusResponse> = {
      status: "success",
      data: {
        isAuthenticated: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error checking auth status", StatusCodes.INTERNAL_SERVER_ERROR, 'server-error'));
  }
};