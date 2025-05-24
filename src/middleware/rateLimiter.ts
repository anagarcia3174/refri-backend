import rateLimit from 'express-rate-limit';
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
      'rate-limit-exceeded'
    );
  },
  standardHeaders: true, 
  legacyHeaders: false,
});

export const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per window
  message: {
    status: "error",
    error: {
      message: "Too many verification attempts. Please try again later.",
      code: "too-many-requests"
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 resend attempts per hour
  message: {
    status: "error",
    error: {
      message: "Too many resend attempts. Please try again later.",
      code: "too-many-requests"
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
}); 