import { Document } from 'mongoose';

// Model Types
export interface IUser extends Document {
  username: string;
  email: string;
  isVerified: boolean;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request Types
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Response Types
export interface UserResponse {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Service Types
export interface CreateUserData {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
  isVerified?: boolean;
}

// Error Types
export interface UserError {
  field: 'username' | 'email' | 'password';
  message: string;
} 