import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Board from '../models/Board.js';
import Pin from '../models/Pin.js';

// @desc    Get user profile with pins and boards
// @route   GET /api/users/:userId
// @access  Public
export const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    let user = await User.findById(userId);

    if (!user) {
      user = await User.findOne({ username: userId });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const currentUserId = req.user?.id || req.user?._id;
    const isOwner = String(currentUserId) === String(user.id || user._id);

    // Fetch user boards
    const allBoards = await Board.find({ user_id: user.id || user._id });
    const visibleBoards = isOwner ? allBoards : allBoards.filter((b) => !b.is_private);

    // Fetch user pins
    const allPins = await Pin.find({ userId: user.id || user._id });
    const visiblePins = isOwner ? allPins : allPins.filter((p) => !p.is_private);

    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    delete userObj.reset_password_token;
    delete userObj.reset_password_expires;
    delete userObj.otp_code_hash;
    delete userObj.otp_expires;

    res.json({
      success: true,
      data: {
        ...userObj,
        boards: visibleBoards,
        pins: visiblePins,
        pins_count: visiblePins.length,
        boards_count: visibleBoards.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const currentUserId = req.user.id || req.user._id;
    const { full_name, bio, avatar_url, username, email } = req.body;

    const updates = {};
    if (full_name !== undefined) {
      updates.full_name = String(full_name).trim();
    }
    if (bio !== undefined) {
      updates.bio = String(bio).slice(0, 500);
    }
    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url && String(avatar_url).trim() !== '' ? String(avatar_url).trim() : null;
    }

    if (username !== undefined) {
      const cleanUsername = String(username).trim().replace(/[^a-zA-Z0-9_.-]/g, '_');
      if (cleanUsername.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username must be at least 3 characters',
        });
      }
      const existingUser = await User.findOne({ username: cleanUsername });
      if (existingUser && String(existingUser.id) !== String(currentUserId)) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken by another account',
        });
      }
      updates.username = cleanUsername;
    }

    if (email !== undefined) {
      const cleanEmail = String(email).toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail && String(existingEmail.id) !== String(currentUserId)) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already in use by another account',
        });
      }
      updates.email = cleanEmail;
    }

    const updatedUser = await User.findByIdAndUpdate(currentUserId, updates, { new: true });

    const userObj = updatedUser.toObject ? updatedUser.toObject() : { ...updatedUser };
    delete userObj.password;
    delete userObj.reset_password_token;
    delete userObj.reset_password_expires;
    delete userObj.otp_code_hash;
    delete userObj.otp_expires;

    res.json({
      success: true,
      data: userObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const currentUserId = req.user.id || req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required',
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let isMatch = false;
    if (user.password && user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(currentPassword, user.password);
    } else if (user.password) {
      isMatch = currentPassword === user.password;
    }

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(currentUserId, { password: hashedPassword });

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow or unfollow user
// @route   POST /api/users/:userId/follow
// @access  Private
export const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id || req.user?._id;

    if (String(userId) === String(currentUserId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Toggle follow state
    res.json({
      success: true,
      message: `You are now following ${targetUser.full_name || targetUser.username}`,
      is_following: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
export const uploadAvatar = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file uploaded',
    });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const fileUrl = `${protocol}://${host}/uploads/avatars/${req.file.filename}`;

  res.status(201).json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
    },
  });
};

export default {
  getUserProfile,
  updateProfile,
  changePassword,
  followUser,
  uploadAvatar,
};
