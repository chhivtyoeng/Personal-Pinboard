import { isPostgresConnected, pool, getLocalDb, saveLocalDb } from '../config/db.js';
import { SEED_SETTINGS } from '../config/seedData.js';

export const Setting = {
  async getSettings() {
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT * FROM settings ORDER BY id ASC LIMIT 1');
      if (res.rows[0]) return res.rows[0];

      // Insert default if empty
      const insertRes = await pool.query(
        `INSERT INTO settings (platform_name, allow_registration, enable_comments, enable_ratings, require_moderation_threshold, maintenance_mode)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [SEED_SETTINGS.platform_name, SEED_SETTINGS.allow_registration, SEED_SETTINGS.enable_comments, SEED_SETTINGS.enable_ratings, SEED_SETTINGS.require_moderation_threshold, SEED_SETTINGS.maintenance_mode]
      );
      return insertRes.rows[0];
    }

    const db = getLocalDb();
    if (!db.settings) {
      db.settings = { ...SEED_SETTINGS };
      saveLocalDb();
    }
    return db.settings;
  },

  async updateSettings(data) {
    const ALLOWED_SETTING_COLUMNS = new Set([
      'platform_name',
      'allow_registration',
      'enable_comments',
      'enable_ratings',
      'require_moderation_threshold',
      'maintenance_mode',
    ]);

    const sanitizedData = {};
    for (const [key, val] of Object.entries(data)) {
      if (ALLOWED_SETTING_COLUMNS.has(key)) {
        sanitizedData[key] = val;
      }
    }

    if (isPostgresConnected && pool) {
      const current = await this.getSettings();
      const keys = Object.keys(sanitizedData);
      if (keys.length === 0) return current;

      const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      const params = [...Object.values(sanitizedData), current.id];

      const sql = `UPDATE settings SET ${setClauses}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`;
      const res = await pool.query(sql, params);
      return res.rows[0];
    }

    const db = getLocalDb();
    db.settings = {
      ...(db.settings || SEED_SETTINGS),
      ...sanitizedData,
      updated_at: new Date().toISOString(),
    };
    saveLocalDb();
    return db.settings;
  },
};

export default Setting;
