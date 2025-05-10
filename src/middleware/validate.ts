import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import AppError from '../utils/AppError';
import { ErrorType } from '../types/error.types';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new AppError(
      errorMessages.join(', '),
      400,
      ErrorType.VALIDATION
    );
  }
  next();
}; 