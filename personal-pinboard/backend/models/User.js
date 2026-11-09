import bcrypt from 'bcryptjs';
import { isPostgresConnected, pool, getLocalDb, saveLocalDb } from '../config/db.js';

export const User = {
  async find(filter = {}) {
    if (isPostgresConnected && pool) {
      let sql = 'SELECT * FROM users WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (filter.role) {
        sql += ` AND role = $${paramIndex++}`;
        params.push(filter.role);
      }
      if (filter.status) {
        sql += ` AND status = $${paramIndex++}`;
        params.push(filter.status);
      }
      if (filter.search) {
        sql += ` AND (LOWER(username) LIKE $${paramIndex} OR LOWER(email) LIKE $${paramIndex} OR LOWER(full_name) LIKE $${paramIndex})`;
        params.push(`%${filter.search.toLowerCase()}%`);
        paramIndex++;
      }
      sql += ' ORDER BY id ASC';
      const res = await pool.query(sql, params);
      return res.rows;
    }

    const db = getLocalDb();
    let result = [...db.users];
    if (filter.role) {
      result = result.filter((u) => u.role === filter.role);
    }
    if (filter.status) {
      result = result.filter((u) => (u.status || 'active') === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.full_name && u.full_name.toLowerCase().includes(q))
      );
    }
    return result;
  },

  async findById(id) {
    if (isPostgresConnected && pool) {
      const numId = Number(id);
      if (isNaN(numId)) return null;
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [numId]);
      return res.rows[0] || null;
    }
    const db = getLocalDb();
    return db.users.find((u) => String(u.id) === String(id)) || null;
  },

  async findOne(query = {}) {
    if (isPostgresConnected && pool) {
      if (query.email) {
        const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [query.email]);
        if (res.rows[0]) return res.rows[0];
      }
      if (query.username) {
        const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [query.username]);
        if (res.rows[0]) return res.rows[0];
      }
      if (query.id) {
        const res = await pool.query('SELECT * FROM users WHERE id = $1', [Number(query.id) || query.id]);
        if (res.rows[0]) return res.rows[0];
      }
      return null;
    }

    const db = getLocalDb();
    return (
      db.users.find((u) => {
        if (query.email && u.email?.toLowerCase() === query.email?.toLowerCase()) return true;
        if (query.username && u.username?.toLowerCase() === query.username?.toLowerCase()) return true;
        if (query.id && String(u.id) === String(query.id)) return true;
        return false;
      }) || null
    );
  },

  async create(data) {
    const hashedPassword = data.password.startsWith('$2')
      ? data.password
      : bcrypt.hashSync(data.password, 10);

    if (isPostgresConnected && pool) {
      const sql = `
        INSERT INTO users (username, email, password, full_name, avatar_url, bio, role, status, pins_count, boards_count, auth_provider, created_at, last_login)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `;
      const params = [
        data.username,
        data.email.toLowerCase(),
        hashedPassword,
        data.full_name || data.username,
        data.avatar_url || null,
        data.bio || '',
        data.role || 'user',
        data.status || 'active',
        0,
        0,
        data.auth_provider || 'local',
      ];
      const res = await pool.query(sql, params);
      return res.rows[0];
    }

    const db = getLocalDb();
    const newUser = {
      id: Date.now(),
      username: data.username,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      full_name: data.full_name || data.username,
      avatar_url: data.avatar_url || null,
      bio: data.bio || '',
      role: data.role || 'user',
      status: data.status || 'active',
      pins_count: 0,
      boards_count: 0,
      auth_provider: data.auth_provider || 'local',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveLocalDb();
    return newUser;
  },

  async findByIdAndUpdate(id, updates = {}) {
    if (isPostgresConnected && pool) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return await this.findById(id);

      const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      const params = [...Object.values(updates), Number(id) || id];

      const sql = `UPDATE users SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`;
      const res = await pool.query(sql, params);
      return res.rows[0] || null;
    }

    const db = getLocalDb();
    const index = db.users.findIndex((u) => String(u.id) === String(id));
    if (index === -1) return null;

    db.users[index] = {
      ...db.users[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveLocalDb();
    return db.users[index];
  },

  async findByIdAndDelete(id) {
    if (isPostgresConnected && pool) {
      const numId = Number(id);
      if (isNaN(numId)) return null;
      await pool.query('DELETE FROM pins WHERE user_id = $1', [numId]);
      await pool.query('DELETE FROM boards WHERE user_id = $1', [numId]);
      await pool.query('DELETE FROM comments WHERE user_id = $1', [numId]);
      const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [numId]);
      return res.rows[0] || null;
    }

    const db = getLocalDb();
    const index = db.users.findIndex((u) => String(u.id) === String(id));
    if (index === -1) return null;
    const deleted = db.users.splice(index, 1)[0];
    db.pins = db.pins.filter((p) => String(p.user_id) !== String(id));
    db.boards = db.boards.filter((b) => String(b.user_id) !== String(id));
    db.comments = db.comments.filter((c) => String(c.user_id) !== String(id));
    saveLocalDb();
    return deleted;
  },

  async countDocuments(filter = {}) {
    if (isPostgresConnected && pool) {
      let sql = 'SELECT COUNT(*) FROM users WHERE 1=1';
      const params = [];
      let idx = 1;
      if (filter.status) {
        sql += ` AND status = $${idx++}`;
        params.push(filter.status);
      }
      if (filter.role) {
        sql += ` AND role = $${idx++}`;
        params.push(filter.role);
      }
      const res = await pool.query(sql, params);
      return parseInt(res.rows[0].count, 10);
    }
    const users = await this.find(filter);
    return users.length;
  },
};

export default User;
