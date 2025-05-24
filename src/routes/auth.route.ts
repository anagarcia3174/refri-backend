import { Router } from 'express';
import { register, login, refreshToken, logout, verifyEmail, resendVerification } from '../controllers/auth.controller';
import { registerValidation, loginValidation } from '../middleware/validators';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { verifyToken } from '../middleware/jwtVerification';

const router = Router();

// Auth routes
router.post('/register', authLimiter,registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.get('/refreshToken', refreshToken);
router.get('/logout', logout);
router.get('/verify-email', verifyEmail);
router.get('/resend-verification', authLimiter, verifyToken, resendVerification);


export default router;