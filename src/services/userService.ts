import { UserModel } from '../models/userModel';
import { CreateUserData, IUser, UserResponse } from '../types/user.types';
import { logger } from '../middleware/logger';
import AppError from '../utils/AppError';
import { ErrorType } from '../types/error.types';

export const createUser = async (data: CreateUserData): Promise<UserResponse> => {
  try {
    // Check if email exists
    const existingEmail = await UserModel.findOne({ email: data.email });
    if (existingEmail) {
      throw new AppError('Email is already taken', 400, ErrorType.VALIDATION);
    }

    // Check if username exists
    const existingUsername = await UserModel.findOne({ username: data.username });
    if (existingUsername) {
      throw new AppError('Username is already taken', 400, ErrorType.VALIDATION);
    }

    // Create new user
    const user = await UserModel.create(data);

    // Remove password and map _id to id
    const { password, _id, ...rest } = user.toObject();
    const userResponse: UserResponse = {
      id: _id.toString(),
      ...rest
    };
    
    logger.info(`User created successfully: ${user._id}`);
    return userResponse;
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  try {
    const user = await UserModel.findOne({ email }).select('+password');
    return user;
  } catch (error) {
    logger.error(`Error fetching user by email ${email}:`, error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<UserResponse> => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, ErrorType.NOT_FOUND);
    }

    // Remove password and map _id to id
    const { password, _id, ...rest } = user.toObject();
    const userResponse: UserResponse = {
      id: _id.toString(),
      ...rest
    };
    
    return userResponse;
  } catch (error) {
    logger.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

