import { isPostgresConnected, pool, getLocalDb, saveLocalDb } from '../config/db.js';

export const Board = {
  async find(filter = {}) {
    if (isPostgresConnected && pool) {
      let sql = 'SELECT * FROM boards WHERE 1=1';
      const params = [];
      let idx = 1;

      const targetUserId = filter.user_id || filter.userId;
      if (targetUserId) {
        sql += ` AND user_id = $${idx++}`;
        params.push(Number(targetUserId));
      }
      if (filter.is_private !== undefined) {
        sql += ` AND is_private = $${idx++}`;
        params.push(Boolean(filter.is_private));
      }
      sql += ' ORDER BY created_at DESC';
      const res = await pool.query(sql, params);
      return res.rows.map((b) => ({
        ...b,
        preview_images: typeof b.preview_images === 'string' ? JSON.parse(b.preview_images) : b.preview_images || [],
        pin_ids: typeof b.pin_ids === 'string' ? JSON.parse(b.pin_ids) : b.pin_ids || [],
      }));
    }

    const db = getLocalDb();
    let result = [...db.boards];
    const targetUserId = filter.user_id || filter.userId;
    if (targetUserId) {
      result = result.filter((b) => String(b.user_id) === String(targetUserId));
    }
    if (filter.is_private !== undefined) {
      result = result.filter((b) => Boolean(b.is_private) === Boolean(filter.is_private));
    }
    return result;
  },

  async findById(id) {
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT * FROM boards WHERE id = $1', [Number(id) || id]);
      if (!res.rows[0]) return null;
      const b = res.rows[0];
      return {
        ...b,
        preview_images: typeof b.preview_images === 'string' ? JSON.parse(b.preview_images) : b.preview_images || [],
        pin_ids: typeof b.pin_ids === 'string' ? JSON.parse(b.pin_ids) : b.pin_ids || [],
      };
    }

    const db = getLocalDb();
    return db.boards.find((b) => String(b.id) === String(id)) || null;
  },

  async findOne(query = {}) {
    const boards = await this.find(query);
    return boards[0] || null;
  },

  async create(data) {
    if (isPostgresConnected && pool) {
      const sql = `
        INSERT INTO boards (user_id, name, description, cover_image_url, preview_images, is_private, pins_count, pin_ids, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `;
      const params = [
        Number(data.user_id) || 2,
        data.name,
        data.description || '',
        data.cover_image_url || data.cover_image || '',
        JSON.stringify(data.preview_images || []),
        Boolean(data.is_private || data.is_secret),
        0,
        JSON.stringify([]),
      ];
      const res = await pool.query(sql, params);
      const row = res.rows[0];
      return {
        ...row,
        preview_images: data.preview_images || [],
        pin_ids: [],
      };
    }

    const db = getLocalDb();
    const newId = Date.now();
    const newBoard = {
      id: newId,
      name: data.name,
      description: data.description || '',
      cover_image_url: data.cover_image_url || data.cover_image || '',
      preview_images: data.preview_images || [],
      user_id: data.user_id,
      is_private: Boolean(data.is_private || data.is_secret),
      pins_count: 0,
      pin_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.boards.unshift(newBoard);
    saveLocalDb();
    return newBoard;
  },

  async findByIdAndUpdate(id, updates = {}) {
    if (isPostgresConnected && pool) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return await this.findById(id);

      const setClauses = [];
      const params = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        if (key === 'preview_images' || key === 'pin_ids') {
          setClauses.push(`${key} = $${idx++}`);
          params.push(JSON.stringify(val));
        } else {
          setClauses.push(`${key} = $${idx++}`);
          params.push(val);
        }
      }

      params.push(Number(id) || id);
      const sql = `UPDATE boards SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
      const res = await pool.query(sql, params);
      if (!res.rows[0]) return null;
      const b = res.rows[0];
      return {
        ...b,
        preview_images: typeof b.preview_images === 'string' ? JSON.parse(b.preview_images) : b.preview_images || [],
        pin_ids: typeof b.pin_ids === 'string' ? JSON.parse(b.pin_ids) : b.pin_ids || [],
      };
    }

    const db = getLocalDb();
    const index = db.boards.findIndex((b) => String(b.id) === String(id));
    if (index === -1) return null;

    db.boards[index] = {
      ...db.boards[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveLocalDb();
    return db.boards[index];
  },

  async findByIdAndDelete(id) {
    if (isPostgresConnected && pool) {
      const res = await pool.query('DELETE FROM boards WHERE id = $1 RETURNING *', [Number(id) || id]);
      return res.rows[0] || null;
    }

    const db = getLocalDb();
    const index = db.boards.findIndex((b) => String(b.id) === String(id));
    if (index === -1) return null;
    const deleted = db.boards.splice(index, 1)[0];
    saveLocalDb();
    return deleted;
  },

  async countDocuments(filter = {}) {
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT COUNT(*) FROM boards');
      return parseInt(res.rows[0].count, 10);
    }
    const boards = await this.find(filter);
    return boards.length;
  },
};

export default Board;
