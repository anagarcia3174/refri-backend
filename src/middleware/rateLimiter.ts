import rateLimit from 'express-rate-limit';
import { ErrorType } from '../types/error.types';
import AppError from '../utils/AppError';

// Rate limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, 
  message: 'Too many requests, please try again after 15 minutes',
  handler: (req, res, next) => {
    throw new AppError(
      'Too many requests, please try again after 15 minutes',
      429,
      ErrorType.VALIDATION
    );
  },
  standardHeaders: true, 
  legacyHeaders: false,
}); 