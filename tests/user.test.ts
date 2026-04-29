import mongoose from "mongoose";
import { z } from "zod"
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import dotenv from "dotenv";
import { UserModel } from "../src/models/user.model";

dotenv.config({ path: ".env.test"});

const envSchema = z.object({
  MONGODB_URI: z.string().url()
});

const env = envSchema.parse(process.env)

beforeEach(async () => {
    await mongoose.connect(env.MONGODB_URI);
    // Clear the users collection before each test
    await UserModel.deleteMany({});
});
  
afterEach(async () => {
    await mongoose.connection.close();
});

describe('User Model', () => {
    const validUserData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
    };

    describe('User Creation', () => {
        it('should create a new user successfully', async () => {
            const user = new UserModel(validUserData);
            const savedUser = await user.save();
            
            expect(savedUser._id).toBeDefined();
            expect(savedUser.username).toBe(validUserData.username);
            expect(savedUser.email).toBe(validUserData.email);
            expect(savedUser.password).not.toBe(validUserData.password); // Password should be hashed
            expect(savedUser.isVerified).toBe(false);
            expect(savedUser.refreshTokens).toEqual([]);
        });

        it('should fail to create user with duplicate email', async () => {
            await UserModel.create(validUserData);
            
            const duplicateUser = new UserModel({
                ...validUserData,
                username: 'differentuser'
            });

            await expect(duplicateUser.save()).rejects.toThrow(/duplicate key error/);
            await expect(duplicateUser.save()).rejects.toMatchObject({
                code: 11000,
                keyPattern: { email: 1 }
            });
        });

        it('should fail to create user with duplicate username', async () => {
            await UserModel.create(validUserData);
            
            const duplicateUser = new UserModel({
                ...validUserData,
                email: 'different@example.com'
            });

            await expect(duplicateUser.save()).rejects.toThrow(/duplicate key error/);
            await expect(duplicateUser.save()).rejects.toMatchObject({
                code: 11000,
                keyPattern: { username: 1 }
            });
        });
    });

    describe('Password Handling', () => {
        it('should hash password before saving', async () => {
            const user = new UserModel(validUserData);
            const savedUser = await user.save();
            
            expect(savedUser.password).not.toBe(validUserData.password);
            expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
        });

        it('should correctly compare passwords', async () => {
            const user = new UserModel(validUserData);
            const savedUser = await user.save();
            
            const isMatch = await savedUser.comparePassword(validUserData.password);
            expect(isMatch).toBe(true);

            const wrongMatch = await savedUser.comparePassword('wrongpassword');
            expect(wrongMatch).toBe(false);
        });
    });

    describe('Static Methods', () => {
        beforeEach(async () => {
            await UserModel.create(validUserData);
        });

        it('should find user by email', async () => {
            const foundUser = await UserModel.findByEmail(validUserData.email);
            expect(foundUser).toBeDefined();
            expect(foundUser?.email).toBe(validUserData.email);
        });

        it('should find user by username', async () => {
            const foundUser = await UserModel.findByUsername(validUserData.username);
            expect(foundUser).toBeDefined();
            expect(foundUser?.username).toBe(validUserData.username);
        });

        it('should return null for non-existent email', async () => {
            const foundUser = await UserModel.findByEmail('nonexistent@example.com');
            expect(foundUser).toBeNull();
        });

        it('should return null for non-existent username', async () => {
            const foundUser = await UserModel.findByUsername('nonexistentuser');
            expect(foundUser).toBeNull();
        });
    });
});

