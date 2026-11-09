import { isPostgresConnected, pool, getLocalDb, saveLocalDb } from '../config/db.js';

export const Category = {
  async find(filter = {}) {
    if (isPostgresConnected && pool) {
      let sql = 'SELECT * FROM categories WHERE 1=1';
      const params = [];
      if (filter.slug) {
        sql += ' AND slug = $1';
        params.push(filter.slug);
      }
      sql += ' ORDER BY id ASC';
      const res = await pool.query(sql, params);
      return res.rows.map((c) => ({
        ...c,
        members: typeof c.members === 'string' ? JSON.parse(c.members) : c.members || [],
      }));
    }

    const db = getLocalDb();
    let result = [...db.categories];
    if (filter.slug) {
      result = result.filter((c) => c.slug === filter.slug);
    }
    return result;
  },

  async findById(id) {
    if (isPostgresConnected && pool) {
      const numId = Number(id);
      if (isNaN(numId)) return null;
      const res = await pool.query('SELECT * FROM categories WHERE id = $1', [numId]);
      if (!res.rows[0]) return null;
      const c = res.rows[0];
      return {
        ...c,
        members: typeof c.members === 'string' ? JSON.parse(c.members) : c.members || [],
      };
    }

    const db = getLocalDb();
    return db.categories.find((c) => String(c.id) === String(id)) || null;
  },

  async findOne(query = {}) {
    if (isPostgresConnected && pool) {
      if (query.slug) {
        const res = await pool.query('SELECT * FROM categories WHERE slug = $1', [query.slug]);
        if (res.rows[0]) {
          const c = res.rows[0];
          return {
            ...c,
            members: typeof c.members === 'string' ? JSON.parse(c.members) : c.members || [],
          };
        }
      }
      if (query.id) {
        return await this.findById(query.id);
      }
      return null;
    }

    const db = getLocalDb();
    return (
      db.categories.find((c) => {
        if (query.slug && c.slug === query.slug) return true;
        if (query.id && String(c.id) === String(query.id)) return true;
        return false;
      }) || null
    );
  },

  async create(data) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (isPostgresConnected && pool) {
      const sql = `
        INSERT INTO categories (name, slug, description, image_url, pins_count, type, members, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;
      const params = [
        data.name,
        slug,
        data.description || '',
        data.image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
        0,
        data.type || 'personal',
        JSON.stringify(data.members || []),
      ];
      const res = await pool.query(sql, params);
      const row = res.rows[0];
      return {
        ...row,
        members: data.members || [],
      };
    }

    const db = getLocalDb();
    const newId = Date.now();
    const newCategory = {
      id: newId,
      name: data.name,
      slug,
      description: data.description || '',
      image_url: data.image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      pins_count: 0,
      type: data.type || 'personal',
      members: data.members || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.categories.push(newCategory);
    saveLocalDb();
    return newCategory;
  },

  async findByIdAndUpdate(id, updates = {}) {
    if (isPostgresConnected && pool) {
      const keys = Object.keys(updates);
      if (keys.length === 0) return await this.findById(id);

      const setClauses = [];
      const params = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        if (key === 'members') {
          setClauses.push(`members = $${idx++}`);
          params.push(JSON.stringify(val));
        } else {
          setClauses.push(`${key} = $${idx++}`);
          params.push(val);
        }
      }

      params.push(Number(id) || id);
      const sql = `UPDATE categories SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
      const res = await pool.query(sql, params);
      if (!res.rows[0]) return null;
      const c = res.rows[0];
      return {
        ...c,
        members: typeof c.members === 'string' ? JSON.parse(c.members) : c.members || [],
      };
    }

    const db = getLocalDb();
    const index = db.categories.findIndex((c) => String(c.id) === String(id));
    if (index === -1) return null;

    db.categories[index] = {
      ...db.categories[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveLocalDb();
    return db.categories[index];
  },

  async findByIdAndDelete(id) {
    if (isPostgresConnected && pool) {
      const numId = Number(id);
      if (isNaN(numId)) return null;
      const res = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [numId]);
      return res.rows[0] || null;
    }

    const db = getLocalDb();
    const index = db.categories.findIndex((c) => String(c.id) === String(id));
    if (index === -1) return null;
    const deleted = db.categories.splice(index, 1)[0];
    saveLocalDb();
    return deleted;
  },

  async countDocuments(filter = {}) {
    if (isPostgresConnected && pool) {
      const res = await pool.query('SELECT COUNT(*) FROM categories');
      return parseInt(res.rows[0].count, 10);
    }
    const categories = await this.find(filter);
    return categories.length;
  },
};

export default Category;
