import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import {
  updateVerificationStatus,
  getUserById,
} from "../services/user.service";
import { ApiResponse } from "../types/api.types";
import { logger } from "../utils/logger.util";
import AppError from "../utils/app-error.util";
import { sendVerificationEmail } from "../services/email.service";
import { createEmailVerificationToken, verifyEmailVerificationToken } from "../utils/jwt.util";

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
      const result = verifyEmailVerificationToken(token);

      

      if(result.isValid && !result.isExpired && result.payload?.userId){
        await updateVerificationStatus(result.payload?.userId, true);

        logger.info(`User email verified successfully: ${result.payload.userId}`);
          
        return res.status(200).render('email/verification-success');
      }else{
          return res.status(400).render('email/verification-expired');
      }
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
  
      const verificationToken = createEmailVerificationToken(
        user.id
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