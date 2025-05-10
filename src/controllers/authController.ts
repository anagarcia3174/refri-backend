import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail } from '../services/userService';
import { CreateUserRequest, LoginRequest } from '../types/user.types';
import { logger } from '../middleware/logger';
import AppError from '../utils/AppError';
import { ErrorType } from '../types/error.types';
import { config } from '../config/config';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password }: CreateUserRequest = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await createUser({
      username,
      email,
      password: hashedPassword
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    logger.info(`User registered successfully: ${user.id}`);

    // Return success response
    res.status(201).json({
      status: 'success',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      throw new AppError(
        'Invalid email or password',
        401,
        ErrorType.AUTHENTICATION
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        'Invalid email or password',
        401,
        ErrorType.AUTHENTICATION
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user.toObject();

    logger.info(`User logged in successfully: ${user._id}`);

    // Return success response
    res.status(200).json({
      status: 'success',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};