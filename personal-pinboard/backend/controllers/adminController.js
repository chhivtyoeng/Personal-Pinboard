import User from '../models/User.js';
import Pin from '../models/Pin.js';
import Board from '../models/Board.js';
import Comment from '../models/Comment.js';
import Report from '../models/Report.js';
import Category from '../models/Category.js';
import Setting from '../models/Setting.js';
import AuditLog from '../models/AuditLog.js';
import { getLocalDb, saveLocalDb } from '../config/db.js';
import {
  SEED_USERS,
  SEED_CATEGORIES,
  SEED_BOARDS,
  SEED_PINS,
  SEED_COMMENTS,
  SEED_REPORTS,
  SEED_SETTINGS,
} from '../config/seedData.js';

// @desc    Get Admin KPIs and platform metrics
// @route   GET /api/admin/stats
// @access  Admin
export const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const activeCreators = await User.countDocuments({ status: 'active', role: 'user' });
    const totalPins = await Pin.countDocuments();
    const totalBoards = await Board.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const totalCategories = await Category.countDocuments();

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        activeCreators,
        totalPins,
        totalBoards,
        totalComments,
        totalReports,
        pendingReports,
        totalCategories,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user management list
// @route   GET /api/admin/users
// @access  Admin
export const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 50 } = req.query;
    let users = await User.find({ search, role, status });

    // Remove passwords and sensitive reset tokens from response
    const sanitizedUsers = users.map((u) => {
      const userObj = u.toObject ? u.toObject() : { ...u };
      delete userObj.password;
      delete userObj.reset_password_token;
      delete userObj.reset_password_expires;
      delete userObj.otp_code_hash;
      delete userObj.otp_expires;
      return userObj;
    });

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = sanitizedUsers.length;
    const paginated = sanitizedUsers.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: {
        users: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:userId/role
// @access  Admin
export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"',
      });
    }

    const updated = await User.findByIdAndUpdate(userId, { role });
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await AuditLog.create({
      action: 'UPDATE_USER_ROLE',
      performed_by: req.user,
      target_type: 'user',
      target_id: userId,
      details: `Changed role to ${role}`,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (active / suspended)
// @route   PUT /api/admin/users/:userId/status
// @access  Admin
export const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "suspended"',
      });
    }

    const updated = await User.findByIdAndUpdate(userId, { status });
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await AuditLog.create({
      action: 'UPDATE_USER_STATUS',
      performed_by: req.user,
      target_type: 'user',
      target_id: userId,
      details: `Changed account status to ${status}`,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:userId
// @access  Admin
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await User.findByIdAndDelete(userId);

    await AuditLog.create({
      action: 'DELETE_USER',
      performed_by: req.user,
      target_type: 'user',
      target_id: userId,
      details: `Deleted user ${user.username}`,
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user by Admin
// @route   POST /api/admin/users
// @access  Admin
export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!email || !username) {
      return res.status(400).json({
        success: false,
        message: 'Username and email are required',
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const cleanUsername = String(username).trim().replace(/[^a-zA-Z0-9_.-]/g, '_');
    if (cleanUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters',
      });
    }

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken',
      });
    }

    const userPassword = password && String(password).length >= 6 ? String(password) : 'password123';
    const userRole = role === 'admin' ? 'admin' : 'user';

    const newUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: userPassword,
      full_name: (full_name || cleanUsername).trim(),
      role: userRole,
    });

    await AuditLog.create({
      action: 'CREATE_USER',
      performed_by: req.user,
      target_type: 'user',
      target_id: newUser.id,
      details: `Created new user ${newUser.username} with role ${newUser.role}`,
    });

    const userObj = newUser.toObject ? newUser.toObject() : { ...newUser };
    delete userObj.password;
    delete userObj.reset_password_token;
    delete userObj.reset_password_expires;
    delete userObj.otp_code_hash;
    delete userObj.otp_expires;

    res.status(201).json({
      success: true,
      data: userObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get content violation reports
// @route   GET /api/admin/reports
// @access  Admin
export const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find(req.query);
    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report status
// @route   PUT /api/admin/reports/:id/status
// @access  Admin
export const updateReportStatus = async (req, res, next) => {
  try {
    const { status, resolution_notes } = req.body;
    const reportId = req.params.id || req.params.reportId;
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    const updated = await Report.findByIdAndUpdate(
      reportId,
      {
        status,
        resolution_notes: resolution_notes || report.resolution_notes,
      },
      { new: true }
    );

    await AuditLog.create({
      action: 'UPDATE_REPORT_STATUS',
      performed_by: req.user,
      target_type: 'report',
      target_id: String(reportId),
      details: `Updated report status to ${status}`,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete content violation report
// @route   DELETE /api/admin/reports/:id
// @access  Admin
export const deleteReport = async (req, res, next) => {
  try {
    const reportId = req.params.id || req.params.reportId;
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    await Report.findByIdAndDelete(reportId);

    await AuditLog.create({
      action: 'DELETE_REPORT',
      performed_by: req.user,
      target_type: 'report',
      target_id: String(reportId),
      details: `Admin deleted report #${reportId} for pin "${report.pin_title || report.pin_id}"`,
    });

    res.json({
      success: true,
      message: 'Report deleted successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin delete pin
// @route   DELETE /api/admin/pins/:id
// @access  Admin
export const deleteAdminPin = async (req, res, next) => {
  try {
    const pinId = req.params.id || req.params.pinId;
    const pin = await Pin.findById(pinId);
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found',
      });
    }

    await Pin.findByIdAndDelete(pinId);
    await Comment.deleteMany({ pin_id: pinId });
    if (Report.deleteMany) {
      await Report.deleteMany({ pin_id: pinId });
    }

    await AuditLog.create({
      action: 'ADMIN_DELETE_PIN',
      performed_by: req.user,
      target_type: 'pin',
      target_id: String(pinId),
      details: `Admin removed pin "${pin.title}"`,
    });

    res.json({
      success: true,
      message: 'Pin deleted successfully by admin',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform settings
// @route   GET /api/admin/settings
// @access  Admin / Public
export const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.getSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update platform settings
// @route   PUT /api/admin/settings
// @access  Admin
export const updateSettings = async (req, res, next) => {
  try {
    const updated = await Setting.updateSettings(req.body);

    await AuditLog.create({
      action: 'UPDATE_SETTINGS',
      performed_by: req.user,
      target_type: 'settings',
      target_id: 'global',
      details: JSON.stringify(req.body),
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Admin
export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find();
    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear audit logs
// @route   DELETE /api/admin/audit-logs
// @access  Admin
export const clearAuditLogs = async (req, res, next) => {
  try {
    await AuditLog.clearAll();
    res.json({
      success: true,
      message: 'Audit logs cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset database to default demo data
// @route   POST /api/admin/reset-demo-data
// @access  Admin
export const resetDemoData = async (req, res, next) => {
  try {
    const db = getLocalDb();
    db.users = [...SEED_USERS];
    db.categories = [...SEED_CATEGORIES];
    db.boards = [...SEED_BOARDS];
    db.pins = [...SEED_PINS];
    db.comments = [...SEED_COMMENTS];
    db.reports = [...SEED_REPORTS];
    db.settings = { ...SEED_SETTINGS };
    db.auditLogs = [
      {
        id: Date.now(),
        action: 'RESET_DATA',
        performed_by: req.user || { username: 'admin' },
        target_type: 'system',
        target_id: 'demo_reset',
        details: 'System restored to default initial dataset.',
        created_at: new Date().toISOString(),
      },
    ];
    saveLocalDb();

    res.json({
      success: true,
      message: 'Demo dataset has been restored successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getStats,
  getUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  createUser,
  getReports,
  updateReportStatus,
  deleteReport,
  deleteAdminPin,
  getSettings,
  updateSettings,
  getAuditLogs,
  clearAuditLogs,
  resetDemoData,
};
