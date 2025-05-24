import { UserModel } from "../models/userModel";
import { CreateUserData, IUser, UserResponse } from "../types/user.types";
import AppError from "../utils/AppError";

export const createUser = async (
  data: CreateUserData
): Promise<UserResponse> => {
  // Check if email exists
  const existingEmail = await UserModel.findOne({ email: data.email });
  if (existingEmail) {
    throw new AppError('Email is already in use.', 409, 'email-taken');
  }

  // Check if username exists
  const existingUsername = await UserModel.findOne({
    username: data.username,
  });
  if (existingUsername) {
    throw new AppError('Username is already in use.', 409, 'username-taken');
  }

  // Create new user
  const user = await UserModel.create(data);

  // Remove password and map _id to id
  const { refreshTokens, password, _id, ...rest } = user.toObject();
  const userResponse: UserResponse = {
    id: _id.toString(),
    ...rest,
  };
  return userResponse;
};

export const getUserToLogin = async (email: string): Promise<IUser | null> => {
  const user = await UserModel.findOne({ email }).select("+password");
  return user;
};

export const getUserById = async (userId: string): Promise<UserResponse> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404, 'no-user');
  }

  // Remove password and map _id to id
  const { refreshTokens, password, _id, ...rest } = user.toObject();
  const userResponse: UserResponse = {
    id: _id.toString(),
    ...rest,
  };

  return userResponse;
};

export const addRefreshToken = async (
  userId: string,
  refreshToken: string
): Promise<UserResponse> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404, 'no-user');
  }

  user.refreshTokens.push(refreshToken);

  const updatedUser = await user.save();

  const { refreshTokens, password, _id, ...rest } = updatedUser.toObject();
  const userResponse: UserResponse = {
    id: _id.toString(),
    ...rest
  }

  return userResponse;
};

export const getUserByRefreshToken = async (refreshToken: string): Promise<UserResponse | null> => {
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
};

export const removeRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  const user = await UserModel.findById(userId);
  if(!user){
    throw new AppError('User not found.', 404, 'no-user');
  }

  user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
  await user.save();
};

export const removeAllRefreshTokens = async (userId: string): Promise<void> => {
  const user = await UserModel.findById(userId);
  if(!user){
    throw new AppError('User not found.', 404, 'no-user');
  }

  user.refreshTokens = [];
  await user.save();
};

export const updateUserEmailVerification = async (userId: string, isVerified: boolean) => {
  await UserModel.findByIdAndUpdate(userId, {isVerified}, {new: isVerified});
};