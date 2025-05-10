import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import AppError from '../utils/AppError';
import { ErrorType } from '../types/error.types';

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

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header - handle both cases and ensure we get a string
    const authHeader = (req.headers.authorization || req.headers.Authorization) as string;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided, authorization denied', 401, ErrorType.AUTHENTICATION);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    
    // Add user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401, ErrorType.AUTHENTICATION));
    } else {
      next(error);
    }
  }
};