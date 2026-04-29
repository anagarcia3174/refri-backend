import { StatusCodes } from 'http-status-codes';
import AppError, { ErrorCode } from '../../src/utils/app-error.util';

describe('AppError', () => {
  it('should create an error with default status code', () => {
    const error = new AppError('Test error', undefined, ErrorCode.SERVER_ERROR);
    
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(error.code).toBe(ErrorCode.SERVER_ERROR);
    expect(error.stack).toBeDefined();
  });

  it('should create an error with custom status code', () => {
    const error = new AppError(
      'Not found error',
      StatusCodes.NOT_FOUND,
      ErrorCode.NO_USER
    );
    
    expect(error.message).toBe('Not found error');
    expect(error.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(error.code).toBe(ErrorCode.NO_USER);
  });

  it('should create an error with validation error code', () => {
    const error = new AppError(
      'Invalid input',
      StatusCodes.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
    
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('should create an error with authentication error code', () => {
    const error = new AppError(
      'Invalid credentials',
      StatusCodes.UNAUTHORIZED,
      ErrorCode.INVALID_CREDENTIALS
    );
    
    expect(error.message).toBe('Invalid credentials');
    expect(error.statusCode).toBe(StatusCodes.UNAUTHORIZED);
    expect(error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
  });

  it('should create an error with token error code', () => {
    const error = new AppError(
      'Invalid token',
      StatusCodes.UNAUTHORIZED,
      ErrorCode.INVALID_TOKEN
    );
    
    expect(error.message).toBe('Invalid token');
    expect(error.statusCode).toBe(StatusCodes.UNAUTHORIZED);
    expect(error.code).toBe(ErrorCode.INVALID_TOKEN);
  });

  it('should create an error with the default message if an empty message is provided', () => {
    const error = new AppError(
      '',
      StatusCodes.INTERNAL_SERVER_ERROR,
      ErrorCode.SERVER_ERROR
    );
    
    expect(error.message).toBe('Internal server error');
  });

}); 