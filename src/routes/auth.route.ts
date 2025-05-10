import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { registerValidation, loginValidation } from '../middleware/validators';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { checkAuth } from '../controllers/authController';
import { verifyToken } from '../middleware/authVerification';

const router = Router();

// Auth routes
router.post('/register', authLimiter,registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);

// Protected route to check auth status
router.get('/check', verifyToken, checkAuth);

export default router; 