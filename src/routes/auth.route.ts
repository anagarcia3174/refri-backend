import { Router } from 'express';
import { register, login, refreshToken, logout, verifyEmail, resendVerification, changePassword, forgotPassword, resetPassword, showResetPasswordForm, getAuthStatus } from '../controllers/auth.controller';
import { registerValidation, loginValidation, changePasswordValidation, forgotPasswordValidation, resetPasswordValidation } from '../middleware/validators';
import { validate } from '../middleware/validate';
import { authLimiter, resendVerificationLimiter, verificationLimiter } from '../middleware/rateLimiter';
import { verifyToken } from '../middleware/jwtVerification';

const router = Router();

// Auth status route - checks if user is authenticated
router.get('/status', verifyToken, getAuthStatus);

// Auth routes
router.post('/register', authLimiter,registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);

//If refresh token is valid, user recieves new access and refresh tokens
router.get('/refreshToken', refreshToken);

//This is called when user clicks logout button on frontend
router.get('/logout', logout);

//This is called when user clicks on verify email link in their email
router.get('/verify-email', verificationLimiter, verifyEmail);

//If access token is valid, user can resend their verification email
router.get('/resend-verification', resendVerificationLimiter, verifyToken, resendVerification);

//If access token is valid, user can change password
router.post('/change-password', verifyToken, changePasswordValidation, validate, changePassword);

//This is called when user clicks forgot password button on frontend
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);

//This is called when user clicks on reset password link in email after clicking forgot password button
router.get('/reset-password', showResetPasswordForm);

//This is called when user submits new password after they click on reset password link in email.
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);


export default router;