import { isPostgresConnected, pool, getLocalDb, saveLocalDb } from '../config/db.js';

export const Comment = {
  async find(filter = {}) {
    if (isPostgresConnected && pool) {
      let sql = 'SELECT * FROM comments WHERE 1=1';
      const params = [];
      let idx = 1;

      const targetPinId = filter.pin_id || filter.pinId;
      if (targetPinId && targetPinId !== 'null' && targetPinId !== 'undefined' && !isNaN(Number(targetPinId))) {
        sql += ` AND pin_id = $${idx++}`;
        params.push(Number(targetPinId));
      }
      const targetUserId = filter.user_id || filter.userId;
      if (targetUserId && targetUserId !== 'null' && targetUserId !== 'undefined' && !isNaN(Number(targetUserId))) {
        sql += ` AND user_id = $${idx++}`;
        params.push(Number(targetUserId));
      }
      sql += ' ORDER BY created_at DESC';
      const res = await pool.query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        user: typeof row.user_data === 'string' ? JSON.parse(row.user_data) : row.user_data,
      }));
    }

    const db = getLocalDb();
    let result = [...db.comments];
    if (filter.pin_id) {
      result = result.filter((c) => String(c.pin_id) === String(filter.pin_id));
    }
    if (filter.user_id) {
      result = result.filter((c) => String(c.user_id) === String(filter.user_id));
    }
    result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return result;
  },

  async findById(id) {
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT * FROM comments WHERE id = $1', [Number(id) || id]);
      if (!res.rows[0]) return null;
      const row = res.rows[0];
      return {
        ...row,
        user: typeof row.user_data === 'string' ? JSON.parse(row.user_data) : row.user_data,
      };
    }

    const db = getLocalDb();
    return db.comments.find((c) => String(c.id) === String(id)) || null;
  },

  async findOne(query = {}) {
    const comments = await this.find(query);
    return comments[0] || null;
  },

  async create(data) {
    if (isPostgresConnected && pool) {
      const sql = `
        INSERT INTO comments (pin_id, user_id, user_data, content, rating, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      const params = [
        Number(data.pin_id),
        Number(data.user_id) || 2,
        JSON.stringify(data.user || {}),
        data.content || data.text || '',
        data.rating ? Number(data.rating) : null,
      ];
      const res = await pool.query(sql, params);
      const row = res.rows[0];
      return {
        ...row,
        user: data.user,
      };
    }

    const db = getLocalDb();
    const newId = Date.now();
    const newComment = {
      id: newId,
      pin_id: data.pin_id,
      user_id: data.user_id,
      user: data.user || null,
      content: data.content || data.text || '',
      rating: data.rating ? Number(data.rating) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.comments.unshift(newComment);
    saveLocalDb();
    return newComment;
  },

  async findByIdAndUpdate(id, updates = {}) {
    if (isPostgresConnected && pool) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return await this.findById(id);

      const setClauses = [];
      const params = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        if (key === 'user' || key === 'user_data') {
          setClauses.push(`user_data = $${idx++}`);
          params.push(JSON.stringify(val));
        } else {
          setClauses.push(`${key} = $${idx++}`);
          params.push(val);
        }
      }

      params.push(Number(id) || id);
      const sql = `UPDATE comments SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
      const res = await pool.query(sql, params);
      if (!res.rows[0]) return null;
      const row = res.rows[0];
      return {
        ...row,
        user: typeof row.user_data === 'string' ? JSON.parse(row.user_data) : row.user_data,
      };
    }

    const db = getLocalDb();
    const index = db.comments.findIndex((c) => String(c.id) === String(id));
    if (index === -1) return null;

    db.comments[index] = {
      ...db.comments[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveLocalDb();
    return db.comments[index];
  },

  async findByIdAndDelete(id) {
    if (isPostgresConnected && pool) {
      const res = await pool.query('DELETE FROM comments WHERE id = $1 RETURNING *', [Number(id) || id]);
      return res.rows[0] || null;
    }

    const db = getLocalDb();
    const index = db.comments.findIndex((c) => String(c.id) === String(id));
    if (index === -1) return null;
    const deleted = db.comments.splice(index, 1)[0];
    saveLocalDb();
    return deleted;
  },

  async deleteMany(filter = {}) {
    if (isPostgresConnected && pool) {
      if (filter.pin_id) {
        await pool.query('DELETE FROM comments WHERE pin_id = $1', [Number(filter.pin_id)]);
      }
      return { acknowledged: true };
    }

    const db = getLocalDb();
    if (filter.pin_id) {
      db.comments = db.comments.filter((c) => String(c.pin_id) !== String(filter.pin_id));
      saveLocalDb();
    }
    return { acknowledged: true };
  },

  async countDocuments(filter = {}) {
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT COUNT(*) FROM comments');
      return parseInt(res.rows[0].count, 10);
    }
    const comments = await this.find(filter);
    return comments.length;
  },
};

export default Comment;
