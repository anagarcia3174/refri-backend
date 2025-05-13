import { Router } from 'express';
import { register, login, handleRefreshToken, handleLogout } from '../controllers/authController';
import { registerValidation, loginValidation } from '../middleware/validators';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { checkAuth } from '../controllers/authController';
import { verifyToken } from '../middleware/jwtVerification';

const router = Router();

// Auth routes
router.post('/register', authLimiter,registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.get('/refreshToken', handleRefreshToken);
router.get('/logout', handleLogout);
router.get('/check', verifyToken, checkAuth);
export default router; 