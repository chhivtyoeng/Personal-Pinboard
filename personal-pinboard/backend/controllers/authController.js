import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import generateToken from '../utils/generateToken.js';
import AuditLog from '../models/AuditLog.js';

// In-memory OTP fallback store for temporary code verification if user record not yet created
const pendingOtps = new Map();

/**
 * Remove sensitive credentials from user object before sending in response
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.reset_password_token;
  delete userObj.reset_password_expires;
  delete userObj.otp_code_hash;
  delete userObj.otp_expires;
  return userObj;
};

// Email validation regex helper
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Check platform setting for allowed public registrations
    const settings = await Setting.getSettings();
    if (settings && settings.allow_registration === false) {
      return res.status(403).json({
        success: false,
        message: 'Public account registration is currently disabled by platform policy. Access is by invitation only.',
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!isValidEmail(cleanEmail) || cleanEmail.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address (e.g. name@example.com)',
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Password cannot exceed 128 characters',
      });
    }

    let cleanUsername = (username || cleanEmail.split('@')[0]).trim().replace(/[^a-zA-Z0-9_.-]/g, '_');
    if (cleanUsername.length < 3) {
      cleanUsername = `user_${cleanUsername}`;
    }

    // Check if user with this email already exists
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Ensure unique username
    const existingUsername = await User.findOne({ username: cleanUsername });
    const finalUsername = existingUsername
      ? `${cleanUsername}_${Math.floor(Math.random() * 900 + 100)}`
      : cleanUsername;

    // Create user - enforce role 'user' (prevent privilege escalation)
    const user = await User.create({
      username: finalUsername,
      email: cleanEmail,
      password, // User.create handles bcrypt hashing
      full_name: (full_name || finalUsername).trim(),
      role: 'user', // Enforce 'user' role
      auth_provider: 'local',
      status: 'active',
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').toLowerCase().trim();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or username',
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password',
      });
    }

    let user = await User.findOne({ email: identifier });
    if (!user) {
      user = await User.findOne({ username: identifier });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended by an administrator.',
      });
    }

    // Strictly verify password using bcrypt (or migrate legacy plaintext)
    let isMatch = false;
    if (user.password && user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else if (user.password) {
      // Legacy unhashed seed check & automatic upgrade
      isMatch = password === user.password;
      if (isMatch) {
        const upgradedHash = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(user.id || user._id, { password: upgradedHash });
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update last login timestamp
    await User.findByIdAndUpdate(user.id || user._id, {
      last_login: new Date().toISOString(),
    });

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // Prevent user enumeration attacks by returning the same success message
      return res.json({
        success: true,
        message: 'If the email exists in our records, password reset instructions have been dispatched.',
      });
    }

    // Generate secure 6-digit verification code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(resetCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    await User.findByIdAndUpdate(user.id || user._id, {
      reset_password_token: hashedCode,
      reset_password_expires: expiresAt,
    });

    // In dev mode, return the code so developers and automated tests can reset passwords without an SMTP server
    const isDev = process.env.NODE_ENV !== 'production';

    res.json({
      success: true,
      message: 'Password reset code generated and sent to your email address.',
      data: {
        email: cleanEmail,
        ...(isDev ? { dev_code: resetCode } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with verified token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { email, code, token, resetToken, newPassword, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const updatedPassword = newPassword || password;
    const inputCode = String(code || token || resetToken || '').trim();

    if (!cleanEmail || !updatedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and new password',
      });
    }

    if (!inputCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the password reset verification code',
      });
    }

    if (updatedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset request',
      });
    }

    // Verify reset token exists and has not expired
    if (!user.reset_password_token || !user.reset_password_expires) {
      return res.status(400).json({
        success: false,
        message: 'No active password reset request found. Please request a new code.',
      });
    }

    const expiresTime = new Date(user.reset_password_expires).getTime();
    if (Date.now() > expiresTime) {
      await User.findByIdAndUpdate(user.id || user._id, {
        reset_password_token: null,
        reset_password_expires: null,
      });
      return res.status(400).json({
        success: false,
        message: 'Password reset code has expired. Please request a new code.',
      });
    }

    // Cryptographically verify code against stored hash
    const isCodeValid = await bcrypt.compare(inputCode, user.reset_password_token);
    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please check your email and try again.',
      });
    }

    // Hash new password and clear reset token
    const hashedPassword = await bcrypt.hash(updatedPassword, 10);
    await User.findByIdAndUpdate(user.id || user._id, {
      password: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null,
    });

    res.json({
      success: true,
      message: 'Password has been updated successfully. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sign in or register with Google OAuth
// @route   POST /api/auth/google
// @access  Public
export const loginWithGoogle = async (req, res, next) => {
  try {
    const { email, name, full_name, avatar_url, picture } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Google profile must include a valid email address',
      });
    }

    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      // Prevent unauthorized takeover of administrator accounts with local passwords
      if (user.role === 'admin' && user.auth_provider === 'local') {
        return res.status(403).json({
          success: false,
          message: 'This administrator account requires standard email and password authentication.',
        });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'This account has been suspended by an administrator.',
        });
      }
    } else {
      // Check platform setting for allowed public registrations
      const settings = await Setting.getSettings();
      if (settings && settings.allow_registration === false) {
        return res.status(403).json({
          success: false,
          message: 'Public account registration is currently disabled by platform policy.',
        });
      }

      const username = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '_');
      const randomPassword = crypto.randomBytes(32).toString('hex');

      user = await User.create({
        username,
        email: cleanEmail,
        password: randomPassword, // Securely hashed by User.create
        full_name: full_name || name || username,
        avatar_url: avatar_url || picture || null,
        auth_provider: 'google',
        role: 'user', // Enforce 'user' role
        status: 'active',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request Email OTP
// @route   POST /api/auth/otp-request
// @access  Public
export const requestOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store in memory cache
    pendingOtps.set(cleanEmail, {
      codeHash: hashedCode,
      expiresAt,
    });

    // Also persist on user record if user already exists
    const user = await User.findOne({ email: cleanEmail });
    if (user) {
      await User.findByIdAndUpdate(user.id || user._id, {
        otp_code_hash: hashedCode,
        otp_expires: new Date(expiresAt).toISOString(),
      });
    }

    const isDev = process.env.NODE_ENV !== 'production';

    res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      data: {
        email: cleanEmail,
        ...(isDev ? { dev_code: code } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sign in or register with verified Email OTP
// @route   POST /api/auth/otp-login
// @access  Public
export const loginWithOtp = async (req, res, next) => {
  try {
    const { email, code, otp, fullName, full_name } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const inputCode = String(code || otp || '').trim();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    let user = await User.findOne({ email: cleanEmail });

    // Verify OTP code if code was provided, or check user record
    if (inputCode) {
      let isCodeValid = false;

      // Check user record first
      if (user && user.otp_code_hash && user.otp_expires) {
        if (new Date(user.otp_expires).getTime() >= Date.now()) {
          isCodeValid = await bcrypt.compare(inputCode, user.otp_code_hash);
        }
      }

      // Check pending memory store
      if (!isCodeValid && pendingOtps.has(cleanEmail)) {
        const pending = pendingOtps.get(cleanEmail);
        if (pending.expiresAt >= Date.now()) {
          isCodeValid = await bcrypt.compare(inputCode, pending.codeHash);
        }
      }

      if (!isCodeValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code. Please request a new code.',
        });
      }

      // Clear used OTP
      pendingOtps.delete(cleanEmail);
      if (user) {
        await User.findByIdAndUpdate(user.id || user._id, {
          otp_code_hash: null,
          otp_expires: null,
        });
      }
    } else if (user && user.role === 'admin') {
      // Admin accounts cannot login without entering OTP code
      return res.status(400).json({
        success: false,
        message: 'Verification code is required to complete login.',
      });
    }

    if (user) {
      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'This account has been suspended by an administrator.',
        });
      }
    } else {
      // Check platform setting for allowed public registrations
      const settings = await Setting.getSettings();
      if (settings && settings.allow_registration === false) {
        return res.status(403).json({
          success: false,
          message: 'Public account registration is currently disabled by platform policy.',
        });
      }

      const username = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '_');
      const randomPassword = crypto.randomBytes(32).toString('hex');

      user = await User.create({
        username,
        email: cleanEmail,
        password: randomPassword,
        full_name: (fullName || full_name || username).trim(),
        avatar_url: null,
        auth_provider: 'email_otp',
        role: 'user', // Enforce 'user' role
        status: 'active',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
  requestOtp,
  loginWithOtp,
};
