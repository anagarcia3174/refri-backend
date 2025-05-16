import { UserModel } from "../models/userModel";
import { CreateUserData, IUser, UserResponse } from "../types/user.types";
import { logger } from "../middleware/logger";
import AppError from "../utils/AppError";
import { ErrorType } from "../types/error.types";

export const createUser = async (
  data: CreateUserData
): Promise<UserResponse> => {
  try {
    // Check if email exists
    const existingEmail = await UserModel.findOne({ email: data.email });
    if (existingEmail) {
      throw new AppError("Email is already taken", 400, ErrorType.VALIDATION);
    }

    // Check if username exists
    const existingUsername = await UserModel.findOne({
      username: data.username,
    });
    if (existingUsername) {
      throw new AppError(
        "Username is already taken",
        400,
        ErrorType.VALIDATION
      );
    }

    // Create new user
    const user = await UserModel.create(data);

    // Remove password and map _id to id
    const { refreshTokens, password, _id, ...rest } = user.toObject();
    const userResponse: UserResponse = {
      id: _id.toString(),
      ...rest,
    };

    logger.info(`User created successfully: ${user._id}`);
    return userResponse;
  } catch (error) {
    logger.error("Error creating user:", error);
    throw error;
  }
};

export const getUserToLogin = async (email: string): Promise<IUser | null> => {
  try {
    const user = await UserModel.findOne({ email }).select("+password");
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
      throw new AppError("User not found", 404, ErrorType.NOT_FOUND);
    }

    // Remove password and map _id to id
    const { refreshTokens, password, _id, ...rest } = user.toObject();
    const userResponse: UserResponse = {
      id: _id.toString(),
      ...rest,
    };

    return userResponse;
  } catch (error) {
    logger.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

export const addRefreshToken = async (
  userId: string,
  refreshToken: string
): Promise<UserResponse> => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, ErrorType.NOT_FOUND);
    }

    user.refreshTokens.push(refreshToken);

    const updatedUser = await user.save();

    const { refreshTokens ,password, _id, ...rest } = updatedUser.toObject();
    const userResponse: UserResponse = {
      id: _id.toString(),
      ...rest
    }

    return userResponse;
  } catch (error) {
    logger.error(`Error adding refresh token to user: ${userId}`, error);
    throw error;
  }
};

export const getUserByRefreshToken = async (refreshToken: string): Promise<UserResponse | null> => {
  try{
    const user = await UserModel.findOne({refreshTokens: {$in: [refreshToken]}});
    if(!user){
      return null;

    }

    const { refreshTokens, password, _id, ...rest } = user.toObject();
    const userResponse: UserResponse = {
      id: _id.toString(),
      ...rest,
    };

    return userResponse;
  }catch(error){
    logger.error(`Error finding refresh token: ${refreshToken}`, error);
    throw error;
  }
}

export const removeRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  try{
    const user = await UserModel.findById(userId);
    if(!user){
      throw new AppError('User not found', 404, ErrorType.NOT_FOUND);
    }

    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken)
    await user.save();


  }catch(error){
    logger.error(`Error removing refresh token: ${refreshToken}`, error);
    throw error;
  }
}

export const removeAllRefreshTokens = async (userId: string): Promise<void> => {
  try{
    const user = await UserModel.findById(userId);
    if(!user){
      throw new AppError('User not found', 404, ErrorType.NOT_FOUND);
    }
  
    user.refreshTokens = [];
    await user.save();
  }catch(error){
    logger.error(`Error removing all refresh tokens for user: ${userId}`, error);
    throw error;
  }
}
