import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { registerValidation, loginValidation } from '../middleware/validators';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Auth routes
router.post('/register', authLimiter,registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);

export default router; 