import { isPostgresConnected, pool, getLocalDb, saveLocalDb } from '../config/db.js';

export const Report = {
  async find(filter = {}) {
    if (isPostgresConnected && pool) {
      let sql = 'SELECT * FROM reports WHERE 1=1';
      const params = [];
      let idx = 1;

      if (filter.status) {
        sql += ` AND status = $${idx++}`;
        params.push(filter.status);
      }
      if (filter.pin_id) {
        sql += ` AND pin_id = $${idx++}`;
        params.push(Number(filter.pin_id));
      }
      sql += ' ORDER BY created_at DESC';
      const res = await pool.query(sql, params);
      return res.rows;
    }

    const db = getLocalDb();
    let result = [...db.reports];
    if (filter.status) {
      result = result.filter((r) => r.status === filter.status);
    }
    if (filter.pin_id) {
      result = result.filter((r) => String(r.pin_id) === String(filter.pin_id));
    }
    result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return result;
  },

  async findById(id) {
    if (isPostgresConnected && pool) {
      const numId = Number(id);
      if (isNaN(numId)) return null;
      const res = await pool.query('SELECT * FROM reports WHERE id = $1', [numId]);
      return res.rows[0] || null;
    }

    const db = getLocalDb();
    return db.reports.find((r) => String(r.id) === String(id)) || null;
  },

  async findOne(query = {}) {
    const reports = await this.find(query);
    return reports[0] || null;
  },

  async create(data) {
    if (isPostgresConnected && pool) {
      const sql = `
        INSERT INTO reports (
          pin_id, pin_title, pin_image, pin_author,
          reporter_id, reporter_username, reporter_email,
          reason, details, status, resolution_notes, created_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10, $11, NOW()
        ) RETURNING *
      `;
      const params = [
        Number(data.pin_id),
        data.pin_title || '',
        data.pin_image || '',
        data.pin_author || '',
        Number(data.reporter_id) || 2,
        data.reporter_username || '',
        data.reporter_email || '',
        data.reason,
        data.details || '',
        data.status || 'pending',
        data.resolution_notes || '',
      ];
      const res = await pool.query(sql, params);
      return res.rows[0];
    }

    const db = getLocalDb();
    const newId = Date.now();
    const newReport = {
      id: newId,
      pin_id: data.pin_id,
      pin_title: data.pin_title || '',
      pin_image: data.pin_image || '',
      pin_author: data.pin_author || '',
      reporter_id: data.reporter_id,
      reporter_username: data.reporter_username || '',
      reporter_email: data.reporter_email || '',
      reason: data.reason,
      details: data.details || '',
      status: data.status || 'pending',
      resolution_notes: data.resolution_notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.reports.unshift(newReport);
    saveLocalDb();
    return newReport;
  },

  async findByIdAndUpdate(id, updates = {}) {
    if (isPostgresConnected && pool) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return await this.findById(id);

      const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      const params = [...Object.values(updates), Number(id) || id];

      const sql = `UPDATE reports SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`;
      const res = await pool.query(sql, params);
      return res.rows[0] || null;
    }

    const db = getLocalDb();
    const index = db.reports.findIndex((r) => String(r.id) === String(id));
    if (index === -1) return null;

    db.reports[index] = {
      ...db.reports[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveLocalDb();
    return db.reports[index];
  },

  async findByIdAndDelete(id) {
    if (isPostgresConnected && pool) {
      const numId = Number(id);
      if (isNaN(numId)) return null;
      const res = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING *', [numId]);
      return res.rows[0] || null;
    }

    const db = getLocalDb();
    const index = db.reports.findIndex((r) => String(r.id) === String(id));
    if (index === -1) return null;
    const deleted = db.reports.splice(index, 1)[0];
    saveLocalDb();
    return deleted;
  },

  async deleteMany(filter = {}) {
    if (isPostgresConnected && pool) {
      if (filter.pin_id) {
        const numPinId = Number(filter.pin_id);
        if (isNaN(numPinId)) return [];
        const res = await pool.query('DELETE FROM reports WHERE pin_id = $1 RETURNING *', [numPinId]);
        return res.rows;
      }
      const res = await pool.query('DELETE FROM reports RETURNING *');
      return res.rows;
    }

    const db = getLocalDb();
    if (filter.pin_id) {
      const removed = [];
      db.reports = db.reports.filter((r) => {
        if (String(r.pin_id) === String(filter.pin_id)) {
          removed.push(r);
          return false;
        }
        return true;
      });
      saveLocalDb();
      return removed;
    }
    const removed = [...db.reports];
    db.reports = [];
    saveLocalDb();
    return removed;
  },

  async countDocuments(filter = {}) {
    if (isPostgresConnected && pool) {
      let sql = 'SELECT COUNT(*) FROM reports WHERE 1=1';
      const params = [];
      if (filter.status) {
        sql += ' AND status = $1';
        params.push(filter.status);
      }
      const res = await pool.query(sql, params);
      return parseInt(res.rows[0].count, 10);
    }
    const reports = await this.find(filter);
    return reports.length;
  },
};

export default Report;
