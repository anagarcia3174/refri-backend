import { UserModel } from "../models/userModel";
import { CreateUserData, IUser, UserResponse } from "../types/user.types";
import AppError from "../utils/AppError";

/**
 * Creates a new user in the database
 * @param {CreateUserData} data - The user data containing username, email, and password
 * @returns {Promise<string>} The ID of the created user
 * @throws {AppError} If email or username is already taken
 */
export const createUser = async (
  data: CreateUserData
): Promise<string> => {
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
  return user._id.toString();
};

/**
 * Retrieves a user by email for login purposes
 * @param {string} email - The email address of the user
 * @returns {Promise<IUser | null>} The user with password field included, or null if not found
 */
export const getUserToLogin = async (email: string): Promise<IUser | null> => {
  const user = await UserModel.findOne({ email }).select("+password");
  return user;
};

/**
 * Retrieves a user by their ID
 * @param {string} userId - The ID of the user to retrieve
 * @returns {Promise<UserResponse>} The user without sensitive data
 * @throws {AppError} If user is not found
 */
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

/**
 * Adds a refresh token to a user's refresh tokens array
 * @param {string} userId - The ID of the user
 * @param {string} refreshToken - The refresh token to add
 * @returns {Promise<string>} The user ID
 * @throws {AppError} If user is not found
 */
export const addRefreshToken = async (
  userId: string,
  refreshToken: string
): Promise<string> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404, 'no-user');
  }

  user.refreshTokens.push(refreshToken);
  await user.save();
  return user._id.toString();
};

/**
 * Retrieves a user by their refresh token
 * @param {string} refreshToken - The refresh token to search for
 * @returns {Promise<string | null>} The user ID, or null if not found
 */
export const getUserByRefreshToken = async (refreshToken: string): Promise<string | null> => {
  const user = await UserModel.findOne({refreshTokens: {$in: [refreshToken]}});
  if(!user){
    return null;
  }
  return user._id.toString();
};

/**
 * Removes a specific refresh token from a user's refresh tokens array
 * @param {string} userId - The ID of the user
 * @param {string} refreshToken - The refresh token to remove
 * @returns {Promise<string>} The user ID
 * @throws {AppError} If user is not found
 */
export const removeRefreshToken = async (userId: string, refreshToken: string): Promise<string> => {
  const user = await UserModel.findById(userId);
  if(!user){
    throw new AppError('User not found.', 404, 'no-user');
  }

  user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
  await user.save();
  return user._id.toString();
};

/**
 * Removes all refresh tokens from a user's refresh tokens array
 * @param {string} userId - The ID of the user
 * @returns {Promise<string>} The user ID
 * @throws {AppError} If user is not found
 */
export const removeAllRefreshTokens = async (userId: string): Promise<string> => {
  const user = await UserModel.findById(userId);
  if(!user){
    throw new AppError('User not found.', 404, 'no-user');
  }

  user.refreshTokens = [];
  await user.save();
  return user._id.toString();
};

/**
 * Updates a user's email verification status
 * @param {string} userId - The ID of the user
 * @param {boolean} isVerified - The new verification status
 * @returns {Promise<string>} The user ID
 */
export const updateUserEmailVerification = async (userId: string, isVerified: boolean): Promise<string> => {
  const user = await UserModel.findByIdAndUpdate(userId, {isVerified}, {new: true});
  if (!user) {
    throw new AppError('User not found.', 404, 'no-user');
  }
  return user._id.toString();
};