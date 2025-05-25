import jwt from 'jsonwebtoken';


/**
 * Creates a JWT token
 * @param userId - The payload to include in the token
 * @param secret - The secret key to sign the token with
 * @param expiresIn - Token expiration time (e.g., '1h', '7d', '30m')
 * @returns The signed JWT token
 */
export const createToken = (
  userId: string,
  secret: string,
  expiresIn: number
): string => {
  

  return jwt.sign({userId}, secret, {expiresIn});
};

