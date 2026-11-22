import { isPostgresConnected, pool, getLocalDb, saveLocalDb } from '../config/db.js';

export const Pin = {
  async find(params = {}) {
    if (isPostgresConnected && pool) {
      let sql = 'SELECT * FROM pins WHERE 1=1';
      const sqlParams = [];
      let paramIdx = 1;

      if (!params.includeHidden) {
        sql += ' AND is_hidden = false';
      }
      if (params.search) {
        sql += ` AND (LOWER(title) LIKE $${paramIdx} OR LOWER(description) LIKE $${paramIdx})`;
        sqlParams.push(`%${params.search.toLowerCase()}%`);
        paramIdx++;
      }
      const catId = params.categoryId || params.category_id;
      if (catId && catId !== 'null' && catId !== 'undefined' && !isNaN(Number(catId))) {
        sql += ` AND category_id = $${paramIdx++}`;
        sqlParams.push(Number(catId));
      }
      const bId = params.boardId || params.board_id || params.board;
      if (bId && bId !== 'null' && bId !== 'undefined' && !isNaN(Number(bId))) {
        sql += ` AND board_id = $${paramIdx++}`;
        sqlParams.push(Number(bId));
      }
      const uId = params.userId || params.user_id;
      if (uId && uId !== 'null' && uId !== 'undefined' && !isNaN(Number(uId))) {
        sql += ` AND user_id = $${paramIdx++}`;
        sqlParams.push(Number(uId));
      }
      if (params.type && params.type !== 'all') {
        sql += ` AND LOWER(type) = $${paramIdx++}`;
        sqlParams.push(params.type.toLowerCase());
      }
      if (params.privacy === 'private') {
        sql += ' AND is_private = true';
      } else if (params.privacy === 'public') {
        sql += ' AND is_private = false';
      } else if (params.viewerId) {
        sql += ` AND (is_private = false OR user_id = $${paramIdx++})`;
        sqlParams.push(Number(params.viewerId));
      } else if (!params.userId && !params.user_id) {
        sql += ' AND is_private = false';
      }

      const likedBy = params.likedByUserId || params.liked_by_user_id;
      if (likedBy && likedBy !== 'null' && likedBy !== 'undefined') {
        sql += ` AND (liked_by @> $${paramIdx++}::jsonb OR liked_by @> $${paramIdx++}::jsonb)`;
        sqlParams.push(JSON.stringify([Number(likedBy)]));
        sqlParams.push(JSON.stringify([String(likedBy)]));
      }

      if (params.sort === 'popular') {
        sql += ' ORDER BY likes_count DESC, id DESC';
      } else if (params.sort === 'views') {
        sql += ' ORDER BY views_count DESC, id DESC';
      } else {
        sql += ' ORDER BY created_at DESC, id DESC';
      }

      const res = await pool.query(sql, sqlParams);
      return res.rows.map((row) => ({
        ...row,
        user: typeof row.user_data === 'string' ? JSON.parse(row.user_data) : row.user_data,
        category: typeof row.category_data === 'string' ? JSON.parse(row.category_data) : row.category_data,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
        liked_by: typeof row.liked_by === 'string' ? JSON.parse(row.liked_by) : row.liked_by || [],
        ratings: typeof row.ratings === 'string' ? JSON.parse(row.ratings) : row.ratings || [],
      }));
    }

    const db = getLocalDb();
    let result = [...db.pins];

    if (!params.includeHidden) {
      result = result.filter((p) => !p.is_hidden);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    if (params.type && params.type !== 'all') {
      result = result.filter((p) => (p.type || 'image').toLowerCase() === params.type.toLowerCase());
    }
    if (params.privacy === 'private') {
      result = result.filter((p) => p.is_private);
    } else if (params.privacy === 'public') {
      result = result.filter((p) => !p.is_private);
    } else if (params.viewerId) {
      result = result.filter((p) => !p.is_private || String(p.user_id) === String(params.viewerId));
    } else if (!params.userId && !params.user_id) {
      result = result.filter((p) => !p.is_private);
    }
    const fallbackCatId = params.categoryId || params.category_id;
    if (fallbackCatId && fallbackCatId !== 'null' && fallbackCatId !== 'undefined') {
      result = result.filter((p) => String(p.category_id) === String(fallbackCatId));
    }
    const fallbackBId = params.boardId || params.board_id || params.board;
    if (fallbackBId && fallbackBId !== 'null' && fallbackBId !== 'undefined') {
      result = result.filter((p) => String(p.board_id) === String(fallbackBId));
    }
    if (params.tag) {
      const tagLower = params.tag.toLowerCase();
      result = result.filter((p) => p.tags && p.tags.some((t) => t.toLowerCase() === tagLower));
    }
    const fallbackUId = params.userId || params.user_id;
    if (fallbackUId && fallbackUId !== 'null' && fallbackUId !== 'undefined') {
      result = result.filter((p) => String(p.user_id) === String(fallbackUId));
    }
    if (params.likedByUserId) {
      result = result.filter((p) => p.liked_by && p.liked_by.some((uid) => String(uid) === String(params.likedByUserId)));
    }

    if (params.sort === 'popular') {
      result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (params.sort === 'views') {
      result.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return result;
  },

  async findById(id) {
    if (isPostgresConnected && pool) {
      const numId = Number(id);
      if (isNaN(numId)) return null;
      const res = await pool.query('SELECT * FROM pins WHERE id = $1', [numId]);
      if (!res.rows[0]) return null;
      const row = res.rows[0];
      return {
        ...row,
        user: typeof row.user_data === 'string' ? JSON.parse(row.user_data) : row.user_data,
        category: typeof row.category_data === 'string' ? JSON.parse(row.category_data) : row.category_data,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
        liked_by: typeof row.liked_by === 'string' ? JSON.parse(row.liked_by) : row.liked_by || [],
        ratings: typeof row.ratings === 'string' ? JSON.parse(row.ratings) : row.ratings || [],
      };
    }

    const db = getLocalDb();
    return db.pins.find((p) => String(p.id) === String(id)) || null;
  },

  async findOne(query = {}) {
    const pins = await this.find(query);
    return pins[0] || null;
  },

  async create(data) {
    if (isPostgresConnected && pool) {
      const sql = `
        INSERT INTO pins (
          title, description, image_url, destination_url, user_id, user_data,
          board_id, board_name, category_id, category_data, tags, type,
          is_private, is_hidden, likes_count, liked_by, views_count,
          rating_avg, rating_count, ratings_count, ratings, comments_count, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, NOW()
        ) RETURNING *
      `;
      const params = [
        data.title,
        data.description || '',
        data.image_url,
        data.destination_url || '',
        data.user_id ? Number(data.user_id) : null,
        JSON.stringify(data.user || {}),
        data.board_id ? Number(data.board_id) : null,
        data.board_name || '',
        data.category_id ? Number(data.category_id) : null,
        JSON.stringify(data.category || {}),
        JSON.stringify(data.tags || []),
        data.type || 'image',
        Boolean(data.is_private),
        Boolean(data.is_hidden),
        0,
        JSON.stringify([]),
        0,
        5.0,
        0,
        0,
        JSON.stringify([]),
        0,
      ];
      const res = await pool.query(sql, params);
      const row = res.rows[0];
      return {
        ...row,
        user: data.user,
        category: data.category,
        tags: data.tags || [],
        liked_by: [],
      };
    }

    const db = getLocalDb();
    const newId = Date.now();
    const newPin = {
      id: newId,
      title: data.title,
      description: data.description || '',
      image_url: data.image_url,
      destination_url: data.destination_url || '',
      user_id: data.user_id ? Number(data.user_id) : null,
      user: data.user || null,
      board_id: data.board_id ? Number(data.board_id) : null,
      board_name: data.board_name || '',
      category_id: data.category_id ? Number(data.category_id) : null,
      category: data.category || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      type: data.type || 'image',
      is_private: Boolean(data.is_private),
      is_hidden: Boolean(data.is_hidden),
      likes_count: 0,
      liked_by: [],
      views_count: 0,
      rating_avg: 5.0,
      rating_count: 0,
      ratings_count: 0,
      ratings: [],
      comments_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.pins.unshift(newPin);
    saveLocalDb();
    return newPin;
  },

  async findByIdAndUpdate(id, updates = {}) {
    const ALLOWED_PIN_COLUMNS = new Set([
      'title',
      'description',
      'image_url',
      'destination_url',
      'board_id',
      'board_name',
      'category_id',
      'category_data',
      'category',
      'tags',
      'type',
      'is_private',
      'is_hidden',
      'likes_count',
      'liked_by',
      'views_count',
      'rating_avg',
      'rating_count',
      'ratings_count',
      'ratings',
      'comments_count',
      'user_data',
      'user',
    ]);

    const sanitizedUpdates = {};
    for (const [key, val] of Object.entries(updates)) {
      if (ALLOWED_PIN_COLUMNS.has(key)) {
        sanitizedUpdates[key] = val;
      }
    }

    const keys = Object.keys(sanitizedUpdates);
    if (keys.length === 0) return await this.findById(id);

    if (isPostgresConnected && pool) {
      const setClauses = [];
      const params = [];
      let idx = 1;

      for (const [key, val] of Object.entries(sanitizedUpdates)) {
        if (key === 'user' || key === 'user_data') {
          setClauses.push(`user_data = $${idx++}`);
          params.push(JSON.stringify(val));
        } else if (key === 'category' || key === 'category_data') {
          setClauses.push(`category_data = $${idx++}`);
          params.push(JSON.stringify(val));
        } else if (key === 'tags' || key === 'liked_by' || key === 'ratings') {
          setClauses.push(`${key} = $${idx++}`);
          params.push(JSON.stringify(val));
        } else {
          setClauses.push(`${key} = $${idx++}`);
          params.push(val);
        }
      }

      params.push(Number(id) || id);
      const sql = `UPDATE pins SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
      const res = await pool.query(sql, params);
      if (!res.rows[0]) return null;

      const row = res.rows[0];
      return {
        ...row,
        user: typeof row.user_data === 'string' ? JSON.parse(row.user_data) : row.user_data,
        category: typeof row.category_data === 'string' ? JSON.parse(row.category_data) : row.category_data,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
        liked_by: typeof row.liked_by === 'string' ? JSON.parse(row.liked_by) : row.liked_by || [],
        ratings: typeof row.ratings === 'string' ? JSON.parse(row.ratings) : row.ratings || [],
      };
    }

    const db = getLocalDb();
    const index = db.pins.findIndex((p) => String(p.id) === String(id));
    if (index === -1) return null;

    db.pins[index] = {
      ...db.pins[index],
      ...sanitizedUpdates,
      updated_at: new Date().toISOString(),
    };
    saveLocalDb();
    return db.pins[index];
  },

  async incrementViews(id) {
    if (isPostgresConnected && pool) {
      const numId = Number(id);
      if (isNaN(numId)) return 1;
      const res = await pool.query(
        'UPDATE pins SET views_count = COALESCE(views_count, 0) + 1 WHERE id = $1 RETURNING views_count',
        [numId]
      );
      return res.rows[0]?.views_count || 1;
    }
    const db = getLocalDb();
    const pin = db.pins.find((p) => String(p.id) === String(id));
    if (pin) {
      pin.views_count = (pin.views_count || 0) + 1;
      saveLocalDb();
      return pin.views_count;
    }
    return 1;
  },

  async toggleLikePin(pinId, userId) {
    if (isPostgresConnected && pool) {
      const numId = Number(pinId);
      if (isNaN(numId)) return null;
      const pinRes = await pool.query('SELECT liked_by, likes_count FROM pins WHERE id = $1', [numId]);
      if (!pinRes.rows[0]) return null;
      let likedBy = Array.isArray(pinRes.rows[0].liked_by)
        ? pinRes.rows[0].liked_by
        : JSON.parse(pinRes.rows[0].liked_by || '[]');
      const alreadyLiked = likedBy.some((uid) => String(uid) === String(userId));
      let newLikesCount;
      if (alreadyLiked) {
        likedBy = likedBy.filter((uid) => String(uid) !== String(userId));
        newLikesCount = Math.max(0, (pinRes.rows[0].likes_count || 1) - 1);
      } else {
        likedBy.push(Number(userId) || userId);
        newLikesCount = (pinRes.rows[0].likes_count || 0) + 1;
      }
      const updateRes = await pool.query(
        'UPDATE pins SET liked_by = $1, likes_count = $2 WHERE id = $3 RETURNING *',
        [JSON.stringify(likedBy), newLikesCount, numId]
      );
      const row = updateRes.rows[0];
      return {
        ...row,
        liked_by: likedBy,
        likes_count: newLikesCount,
        is_liked: !alreadyLiked,
      };
    }
    const db = getLocalDb();
    const pin = db.pins.find((p) => String(p.id) === String(pinId));
    if (!pin) return null;
    let likedBy = Array.isArray(pin.liked_by) ? [...pin.liked_by] : [];
    const alreadyLiked = likedBy.some((uid) => String(uid) === String(userId));
    if (alreadyLiked) {
      pin.liked_by = likedBy.filter((uid) => String(uid) !== String(userId));
      pin.likes_count = Math.max(0, (pin.likes_count || 1) - 1);
    } else {
      likedBy.push(userId);
      pin.liked_by = likedBy;
      pin.likes_count = (pin.likes_count || 0) + 1;
    }
    saveLocalDb();
    return {
      ...pin,
      is_liked: !alreadyLiked,
    };
  },

  async findByIdAndDelete(id) {
    if (isPostgresConnected && pool) {
      const numId = Number(id);
      if (isNaN(numId)) return null;
      const res = await pool.query('DELETE FROM pins WHERE id = $1 RETURNING *', [numId]);
      return res.rows[0] || null;
    }

    const db = getLocalDb();
    const index = db.pins.findIndex((p) => String(p.id) === String(id));
    if (index === -1) return null;
    const deleted = db.pins.splice(index, 1)[0];
    saveLocalDb();
    return deleted;
  },

  async countDocuments(filter = {}) {
    if (isPostgresConnected && pool) {
      let sql = 'SELECT COUNT(*) FROM pins WHERE 1=1';
      const params = [];
      if (filter.is_hidden === false) sql += ' AND is_hidden = false';
      const res = await pool.query(sql, params);
      return parseInt(res.rows[0].count, 10);
    }
    const pins = await this.find(filter);
    return pins.length;
  },
};

export default Pin;
