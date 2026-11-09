import express from 'express';
import {
  getStats,
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getReports,
  updateReportStatus,
  deleteReport,
  deleteAdminPin,
  getSettings,
  updateSettings,
  getAuditLogs,
  clearAuditLogs,
  resetDemoData,
} from '../controllers/adminController.js';
import { deleteCategory } from '../controllers/categoryController.js';
import protect from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';

const router = express.Router();

// Apply auth + admin guard to all admin routes
router.use(protect, adminOnly);

router.get('/stats', getStats);

router.route('/users')
  .get(getUsers)
  .post(createUser);

router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);
router.delete('/users/:id', deleteUser);

// Pins moderation
router.delete('/pins/:id', deleteAdminPin);
router.delete('/pins/:pinId', deleteAdminPin);

// Categories moderation
router.delete('/categories/:id', deleteCategory);
router.delete('/categories/:categoryId', deleteCategory);

// Reports
router.get('/reports', getReports);
router.put('/reports/:id/status', updateReportStatus);
router.put('/reports/:id', updateReportStatus);
router.delete('/reports/:id', deleteReport);
router.delete('/reports/:reportId', deleteReport);

router.route('/settings')
  .get(getSettings)
  .put(updateSettings);

router.route('/audit-logs')
  .get(getAuditLogs)
  .delete(clearAuditLogs);

router.post('/reset-demo-data', resetDemoData);

export default router;
