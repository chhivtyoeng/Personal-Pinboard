import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SEED_USERS,
  SEED_CATEGORIES,
  SEED_BOARDS,
  SEED_PINS,
  SEED_COMMENTS,
  SEED_REPORTS,
  SEED_SETTINGS,
  SEED_AUDIT_LOGS,
} from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'pinboard_db.json');

export let isPostgresConnected = false;
export let pool = null;

// Local JSON persistent storage cache (zero-downtime fallback)
let localDatabase = null;

export const initLocalDb = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    localDatabase = {
      users: [...SEED_USERS],
      categories: [...SEED_CATEGORIES],
      boards: [...SEED_BOARDS],
      pins: [...SEED_PINS],
      comments: [...SEED_COMMENTS],
      reports: [...SEED_REPORTS],
      settings: { ...SEED_SETTINGS },
      auditLogs: [...SEED_AUDIT_LOGS],
    };
    saveLocalDb();
    console.log('[DB] Local database initialized with complete seed data.');
  } else {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      localDatabase = JSON.parse(content);
      console.log('[DB] Local persistent database loaded successfully.');
    } catch (e) {
      localDatabase = {
        users: [...SEED_USERS],
        categories: [...SEED_CATEGORIES],
        boards: [...SEED_BOARDS],
        pins: [...SEED_PINS],
        comments: [...SEED_COMMENTS],
        reports: [...SEED_REPORTS],
        settings: { ...SEED_SETTINGS },
        auditLogs: [...SEED_AUDIT_LOGS],
      };
      saveLocalDb();
    }
  }
};

export const getLocalDb = () => {
  if (!localDatabase) {
    initLocalDb();
  }
  return localDatabase;
};

export const saveLocalDb = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(localDatabase, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to save local database:', err);
  }
};

// PostgreSQL Schema Migration Runner
const initPostgresTables = async (client) => {
  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(150),
      avatar_url TEXT,
      bio TEXT,
      role VARCHAR(50) DEFAULT 'user',
      status VARCHAR(50) DEFAULT 'active',
      pins_count INT DEFAULT 0,
      boards_count INT DEFAULT 0,
      auth_provider VARCHAR(50) DEFAULT 'local',
      reset_password_token VARCHAR(255),
      reset_password_expires TIMESTAMP,
      otp_code_hash VARCHAR(255),
      otp_expires TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code_hash VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP;

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(150) UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      pins_count INT DEFAULT 0,
      type VARCHAR(50) DEFAULT 'personal',
      members JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS boards (
      id SERIAL PRIMARY KEY,
      user_id INT,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      cover_image_url TEXT,
      preview_images JSONB DEFAULT '[]'::jsonb,
      is_private BOOLEAN DEFAULT false,
      pins_count INT DEFAULT 0,
      pin_ids JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pins (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      destination_url TEXT,
      user_id INT NOT NULL,
      user_data JSONB,
      board_id INT,
      board_name VARCHAR(150),
      category_id INT,
      category_data JSONB,
      tags JSONB DEFAULT '[]'::jsonb,
      type VARCHAR(50) DEFAULT 'image',
      is_private BOOLEAN DEFAULT false,
      is_hidden BOOLEAN DEFAULT false,
      likes_count INT DEFAULT 0,
      liked_by JSONB DEFAULT '[]'::jsonb,
      views_count INT DEFAULT 0,
      rating_avg NUMERIC(3, 2) DEFAULT 5.0,
      rating_count INT DEFAULT 0,
      ratings_count INT DEFAULT 0,
      ratings JSONB DEFAULT '[]'::jsonb,
      comments_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      pin_id INT NOT NULL,
      user_id INT NOT NULL,
      user_data JSONB,
      content TEXT NOT NULL,
      rating INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      pin_id INT NOT NULL,
      pin_title VARCHAR(255),
      pin_image TEXT,
      pin_author VARCHAR(150),
      reporter_id INT NOT NULL,
      reporter_username VARCHAR(100),
      reporter_email VARCHAR(255),
      reason VARCHAR(255) NOT NULL,
      details TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      resolution_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      platform_name VARCHAR(150) DEFAULT 'Personal Pinboard',
      allow_registration BOOLEAN DEFAULT true,
      enable_comments BOOLEAN DEFAULT true,
      enable_ratings BOOLEAN DEFAULT true,
      require_moderation_threshold INT DEFAULT 3,
      maintenance_mode BOOLEAN DEFAULT false,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      performed_by JSONB,
      target_type VARCHAR(100),
      target_id VARCHAR(100),
      details TEXT,
      ip_address VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await client.query(schemaSQL);
  console.log('[DB] PostgreSQL schemas and tables verified/created successfully.');

  // Check if users table is populated; if not, seed initial data
  const userCheck = await client.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCheck.rows[0].count, 10) === 0) {
    console.log('[DB] Seeding PostgreSQL with initial datasets...');

    for (const u of SEED_USERS) {
      await client.query(
        `INSERT INTO users (username, email, password, full_name, avatar_url, bio, role, status, pins_count, boards_count, auth_provider, created_at, last_login)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (email) DO NOTHING`,
        [u.username, u.email, u.password, u.full_name, u.avatar_url, u.bio, u.role, u.status, u.pins_count, u.boards_count, 'local', u.created_at, u.last_login]
      );
    }

    for (const c of SEED_CATEGORIES) {
      await client.query(
        `INSERT INTO categories (name, slug, description, image_url, pins_count, type, members)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO NOTHING`,
        [c.name, c.slug, c.description, c.image_url, c.pins_count, c.type, JSON.stringify(c.members || [])]
      );
    }

    for (const b of SEED_BOARDS) {
      await client.query(
        `INSERT INTO boards (user_id, name, description, cover_image_url, preview_images, is_private, pins_count, pin_ids, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [b.user_id, b.name, b.description, b.cover_image_url, JSON.stringify(b.preview_images || []), b.is_private, b.pins_count, JSON.stringify(b.pin_ids || []), b.created_at]
      );
    }

    for (const p of SEED_PINS) {
      await client.query(
        `INSERT INTO pins (title, description, image_url, destination_url, user_id, user_data, board_id, board_name, category_id, category_data, tags, type, is_private, is_hidden, likes_count, liked_by, views_count, rating_avg, rating_count, ratings_count, ratings, comments_count, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
        [p.title, p.description, p.image_url, p.destination_url, p.user_id, JSON.stringify(p.user || {}), p.board_id, p.board_name, p.category_id, JSON.stringify(p.category || {}), JSON.stringify(p.tags || []), p.type, p.is_private, p.is_hidden, p.likes_count, JSON.stringify(p.liked_by || []), p.views_count, p.rating_avg, p.rating_count, p.ratings_count, JSON.stringify(p.ratings || []), p.comments_count, p.created_at]
      );
    }

    for (const com of SEED_COMMENTS) {
      await client.query(
        `INSERT INTO comments (pin_id, user_id, user_data, content, rating, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [com.pin_id, com.user_id, JSON.stringify(com.user || {}), com.content, com.rating, com.created_at]
      );
    }

    for (const r of SEED_REPORTS) {
      await client.query(
        `INSERT INTO reports (pin_id, pin_title, pin_image, pin_author, reporter_id, reporter_username, reporter_email, reason, details, status, resolution_notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [r.pin_id, r.pin_title, r.pin_image, r.pin_author, r.reporter_id, r.reporter_username, r.reporter_email, r.reason, r.details, r.status, r.resolution_notes || '', r.created_at]
      );
    }

    await client.query(
      `INSERT INTO settings (platform_name, allow_registration, enable_comments, enable_ratings, require_moderation_threshold, maintenance_mode)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [SEED_SETTINGS.platform_name, SEED_SETTINGS.allow_registration, SEED_SETTINGS.enable_comments, SEED_SETTINGS.enable_ratings, SEED_SETTINGS.require_moderation_threshold, SEED_SETTINGS.maintenance_mode]
    );

    console.log('[DB] PostgreSQL seeded successfully with initial users, pins, and categories!');
  }
};

export const connectDB = async (maxRetries = 5, initialDelay = 2000) => {
  initLocalDb();

  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'personal_pinboard'}`;

  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`[DB] Attempting connection to PostgreSQL (Attempt ${attempt}/${maxRetries})...`);
      pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 4000,
        ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
      });

      const client = await pool.connect();
      const testResult = await client.query('SELECT NOW()');
      console.log(`🐘 [DB] PostgreSQL Connected Successfully! (${testResult.rows[0].now})`);
      isPostgresConnected = true;

      await initPostgresTables(client);
      client.release();
      return; // Connection and initialization succeeded
    } catch (err) {
      console.warn(`⚠️  [DB] Connection attempt ${attempt} failed: ${err.message}`);
      if (pool) {
        try {
          await pool.end();
        } catch (_) {}
        pool = null;
      }

      if (attempt < maxRetries) {
        console.log(`⏳ [DB] Retrying connection in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 10000);
      }
    }
  }

  isPostgresConnected = false;
  console.warn(`⚠️  [DB] All ${maxRetries} PostgreSQL connection attempts failed.`);
  console.log('⚡ [DB] Operating seamlessly with local persistent JSON database engine.');
};

export const closeDB = async () => {
  if (pool) {
    try {
      console.log('🛑 [DB] Closing PostgreSQL connection pool...');
      await pool.end();
      isPostgresConnected = false;
      pool = null;
      console.log('✅ [DB] PostgreSQL pool closed cleanly.');
    } catch (err) {
      console.error('❌ [DB] Error while closing PostgreSQL pool:', err);
    }
  }
};

export const checkDBHealth = async () => {
  if (isPostgresConnected && pool) {
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      const latency = Date.now() - start;
      return {
        status: 'healthy',
        type: 'postgresql',
        latency: `${latency}ms`,
      };
    } catch (err) {
      return {
        status: 'degraded',
        type: 'postgresql_error',
        message: err.message,
      };
    }
  }

  return {
    status: 'healthy',
    type: 'local_json',
    file: DB_FILE,
  };
};

export const query = (text, params) => {
  if (!isPostgresConnected || !pool) {
    throw new Error('PostgreSQL is not connected');
  }
  return pool.query(text, params);
};

export default connectDB;
