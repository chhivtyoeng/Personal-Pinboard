import express from 'express';
import authRoutes from './authRoutes.js';
import pinRoutes from './pinRoutes.js';
import boardRoutes from './boardRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import userRoutes from './userRoutes.js';
import adminRoutes from './adminRoutes.js';
import { checkDBHealth } from '../config/db.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/pins', pinRoutes);
router.use('/boards', boardRoutes);
router.use('/categories', categoryRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', async (req, res) => {
  const dbHealth = await checkDBHealth();
  const isHealthy = dbHealth.status === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'online' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(1)}s`,
    service: 'Personal Pinboard API',
    database: dbHealth,
  });
});

export default router;
