import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import AppError from '../utils/app-error.util';
import { StatusCodes } from 'http-status-codes';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new AppError(
      errorMessages.join(', '),
      StatusCodes.BAD_REQUEST,
      'validation-error'
    );
  }
  next();
}; 