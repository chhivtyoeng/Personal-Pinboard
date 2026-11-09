import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import connectDB, { closeDB } from './config/db.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database (MongoDB or local persistent engine)
connectDB();

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true); // Dev convenience
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directories exist
const uploadDir = path.join(__dirname, 'uploads');
const pinsUploadDir = path.join(uploadDir, 'pins');
const avatarsUploadDir = path.join(uploadDir, 'avatars');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(pinsUploadDir)) fs.mkdirSync(pinsUploadDir, { recursive: true });
if (!fs.existsSync(avatarsUploadDir)) fs.mkdirSync(avatarsUploadDir, { recursive: true });

// Static Files - Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Personal Pinboard REST API Server',
    status: 'running',
    docs: '/api/health',
  });
});

// Mount all API routes under /api
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Personal Pinboard Server running on port ${PORT}`);
  console.log(`📡 API Endpoints mounted at http://localhost:${PORT}/api`);
  console.log(`📁 Static files served at http://localhost:${PORT}/uploads`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
});

// ==========================================
// Graceful Shutdown & Process Signal Handling
// ==========================================
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 [SHUTDOWN] Received signal: ${signal}. Initiating graceful shutdown...`);

  // Force close after 10s if connections refuse to drain
  const forceExitTimeout = setTimeout(() => {
    console.error('⚠️ [SHUTDOWN] Forcefully shutting down because cleanup took too long (10s timeout).');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  try {
    // 1. Stop receiving new HTTP requests and finish active requests
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error('❌ [SHUTDOWN] Error closing HTTP server:', err);
        } else {
          console.log('✅ [SHUTDOWN] HTTP server closed gracefully (all active connections finished).');
        }
        resolve();
      });
    });

    // 2. Cleanly close Database connection pool
    await closeDB();

    console.log('✨ [SHUTDOWN] Graceful shutdown completed cleanly. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error('❌ [SHUTDOWN] Error during shutdown process:', error);
    process.exit(1);
  }
};

// Docker / Kubernetes / Process Termination Signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught Exceptions & Unhandled Rejections
process.on('unhandledRejection', async (err) => {
  console.error(`💥 [ERROR] Unhandled Rejection:`, err);
  await gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', async (err) => {
  console.error(`💥 [ERROR] Uncaught Exception:`, err);
  await gracefulShutdown('uncaughtException');
});

export default app;
