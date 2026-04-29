// Mock environment variables before importing the module
process.env = {
  ...process.env,
  MONGO_URL: "mongodb://localhost:27017/test-db",
};

import mongoose from 'mongoose';
import { connectDB } from '../../src/utils/db-connection.util';
import AppError, { ErrorCode } from '../../src/utils/app-error.util';
import { StatusCodes } from 'http-status-codes';
import { mock } from 'node:test';
import { logger } from '../../src/utils/logger.util';

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    on: jest.fn(),
  },
}));
jest.mock('../../src/utils/logger.util', () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
  }));

describe('Database Connection Utility', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    // Clean up after all tests
    jest.restoreAllMocks();
  });

  describe('Successful Connection Scenarios', () => {
    it('should connect successfully on first try', async () => {
      // Mock successful connection
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);
      
      // Wait for the connection to complete
      await connectDB();

      // Verify mongoose.connect was called with correct parameters
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test-db',
        {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      );
      expect(logger.info).toHaveBeenCalledWith('MongoDB connected successfully');
      // Verify event listeners were set up
      expect(mongoose.connection.on).toHaveBeenCalledTimes(3);
      expect(mongoose.connection.on).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    });

    it('should connect successfully on second try', async () => {
      // Mock first connection failure and second connection success
      (mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);

      // Start the connection process
      const connectPromise = connectDB();

      // Fast-forward the retry timer
      await jest.advanceTimersByTimeAsync(5000);

      // Wait for the connection to complete
      await connectPromise;

      // Verify mongoose.connect was called twice
      expect(mongoose.connect).toHaveBeenCalledTimes(2);
      
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'MongoDB connection failed (1/5):',
        expect.any(Error)
      );
      
      // Verify retry message was logged
      expect(logger.info).toHaveBeenCalledWith('Retrying in 5 seconds...');
      
      // Verify success message was logged
      expect(logger.info).toHaveBeenCalledWith('MongoDB connected successfully');
      
      // Verify both calls used correct parameters
      expect(mongoose.connect).toHaveBeenNthCalledWith(1,
        'mongodb://localhost:27017/test-db',
        {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      );
      expect(mongoose.connect).toHaveBeenNthCalledWith(2,
        'mongodb://localhost:27017/test-db',
        {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      );
    });

    it('should connect successfully after multiple retries', async () => {
      // Test implementation
      
      // Mock multiple connection failures and final success
      (mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection failed 1'))
        .mockRejectedValueOnce(new Error('Connection failed 2'))
        .mockRejectedValueOnce(new Error('Connection failed 3'))
        .mockResolvedValueOnce(undefined);

      // Start the connection process
      const connectPromise = connectDB();

      // Fast-forward through multiple retry attempts
      await jest.advanceTimersByTimeAsync(5000); // First retry
      await jest.advanceTimersByTimeAsync(5000); // Second retry
      await jest.advanceTimersByTimeAsync(5000); // Third retry

      // Wait for the connection to complete
      await connectPromise;

      // Verify mongoose.connect was called four times
      expect(mongoose.connect).toHaveBeenCalledTimes(4);

      // Verify error logs for each failure
      expect(logger.error).toHaveBeenNthCalledWith(1,
        'MongoDB connection failed (1/5):',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenNthCalledWith(2,
        'MongoDB connection failed (2/5):',
        expect.any(Error)
      );
      expect(logger.error).toHaveBeenNthCalledWith(3,
        'MongoDB connection failed (3/5):',
        expect.any(Error)
      );

      // Verify retry messages were logged
      expect(logger.info).toHaveBeenCalledWith('Retrying in 5 seconds...');

      // Verify final success message
      expect(logger.info).toHaveBeenCalledWith('MongoDB connected successfully');

      // Verify all connection attempts used correct parameters
      for (let i = 1; i <= 4; i++) {
        expect(mongoose.connect).toHaveBeenNthCalledWith(i,
          'mongodb://localhost:27017/test-db',
          {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
          }
        );
      }
    });
  });

  describe('Failure Scenarios', () => {
    it('should fail after maximum retries', async () => {
      // Test implementation
    });

    it('should handle connection error during active connection', async () => {
      // Test implementation
    });

    it('should handle disconnection event', async () => {
      // Test implementation
    });
  });

  describe('Environment and Configuration', () => {
    it('should fail when MONGO_URL is missing', async () => {
      // Test implementation
    });

    it('should fail when MONGO_URL is invalid', async () => {
      // Test implementation
    });

    it('should use correct connection options', async () => {
      // Test implementation
    });
  });

  describe('Event Handling', () => {
    it('should set up error event handler correctly', async () => {
      // Test implementation
    });

    it('should set up disconnection event handler correctly', async () => {
      // Test implementation
    });

    it('should attempt reconnection after disconnection', async () => {
      // Test implementation
    });
  });

  describe('Error Types', () => {
    it('should handle network errors appropriately', async () => {
      // Test implementation
    });

    it('should handle authentication errors appropriately', async () => {
      // Test implementation
    });

    it('should handle timeout errors appropriately', async () => {
      // Test implementation
    });
  });

  describe('Cleanup', () => {
    it('should handle cleanup on process exit', async () => {
      // Test implementation
    });

    it('should handle errors during process exit', async () => {
      // Test implementation
    });
  });
}); 