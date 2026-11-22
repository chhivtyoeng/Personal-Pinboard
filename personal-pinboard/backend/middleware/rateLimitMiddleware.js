import rateLimit from 'express-rate-limit';

// Standard login rate limiter: 20 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

// OTP request and verification limiter: 10 attempts per 15 minutes
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests or verification attempts. Please try again later.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

// Safety report abuse prevention limiter: 15 reports per 15 minutes
export const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many reports submitted. Please wait before submitting another report.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

export default {
  authLimiter,
  otpLimiter,
  reportLimiter,
};
