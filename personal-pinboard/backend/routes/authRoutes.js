import express from 'express';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
  requestOtp,
  loginWithOtp,
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/google', authLimiter, loginWithGoogle);
router.post('/otp-request', otpLimiter, requestOtp);
router.post('/otp-login', otpLimiter, loginWithOtp);

export default router;
