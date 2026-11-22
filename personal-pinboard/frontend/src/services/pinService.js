import api from './api';
import { appStore } from './store';

export const pinService = {
  async getAllPins(params = {}) {
    try {
      const response = await api.get('/pins', { params });
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    let filtered = appStore.getPins();
    if (!params.includeHidden) {
      filtered = filtered.filter(p => !p.is_hidden);
    }
    if (params.recentlyViewed) {
      return appStore.getRecentlyViewedPins();
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        p => p.title.toLowerCase().includes(q) ||
             (p.description && p.description.toLowerCase().includes(q)) ||
             (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    if (params.type && params.type !== 'all') {
      filtered = filtered.filter(p => (p.type || 'image').toLowerCase() === params.type.toLowerCase());
    }
    if (params.privacy === 'private') {
      filtered = filtered.filter(p => p.is_private);
    } else if (params.privacy === 'public') {
      filtered = filtered.filter(p => !p.is_private);
    }
    if (params.categoryId) {
      filtered = filtered.filter(p => p.category_id === Number(params.categoryId));
    }
    if (params.boardId || params.board) {
      const bId = Number(params.boardId || params.board);
      filtered = filtered.filter(p => p.board_id === bId);
    }
    if (params.tag) {
      filtered = filtered.filter(p => p.tags && p.tags.includes(params.tag.toLowerCase()));
    }
    if (params.userId) {
      filtered = filtered.filter(p => p.user_id === Number(params.userId));
    }
    if (params.likedByUserId) {
      filtered = filtered.filter(p => p.is_liked);
    }
    return filtered;
  },

  async getPinById(id) {
    try {
      const response = await api.get(`/pins/${id}`);
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    const pin = appStore.getPinById(id);
    if (pin) return pin;

    return null;
  },

  async createPin(data) {
    try {
      const response = await api.post('/pins', data);
      if (response?.data?.data) {
        appStore.addPin(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message && error.response.status !== 500 && error.response.status !== 404) {
        throw new Error(error.response.data.message);
      }
      console.warn('Backend unavailable, falling back to local persistent store for pin creation');
    }

    let currentUserId = 2;
    let currentUser = null;
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        currentUser = JSON.parse(saved);
        if (currentUser?.id) currentUserId = currentUser.id;
      }
    } catch (_) {}

    const newPin = {
      id: Date.now(),
      title: data.title,
      description: data.description || '',
      image_url: data.image_url,
      destination_url: data.destination_url || '',
      board_id: data.board_id ? Number(data.board_id) : null,
      board_name: data.board_name || '',
      category_id: data.category_id ? Number(data.category_id) : null,
      category_name: data.category_name || (data.category?.name || 'Uncategorized'),
      tags: Array.isArray(data.tags) ? data.tags : [],
      type: data.type || 'image',
      is_private: Boolean(data.is_private),
      is_hidden: false,
      user_id: currentUserId,
      user: currentUser || { id: currentUserId, username: 'creator', full_name: 'Creator' },
      author_name: currentUser?.full_name || currentUser?.username || 'Creator',
      author_avatar: currentUser?.avatar_url || null,
      username: currentUser?.username || 'creator',
      likes_count: 0,
      views_count: 0,
      rating_avg: 5.0,
      ratings_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    appStore.addPin(newPin);
    return newPin;
  },

  async updatePin(id, data) {
    try {
      const response = await api.put(`/pins/${id}`, data);
      if (response?.data?.data) {
        appStore.updatePin(id, response.data.data);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message && error.response.status !== 500 && error.response.status !== 404) {
        throw new Error(error.response.data.message);
      }
      console.warn('Backend unavailable, falling back to local store for pin update');
    }

    const updated = appStore.updatePin(id, data);
    return updated || data;
  },

  async deletePin(id) {
    try {
      await api.delete(`/pins/${id}`);
    } catch (error) {
      if (error?.response?.data?.message && error.response.status !== 500 && error.response.status !== 404) {
        throw new Error(error.response.data.message);
      }
      console.warn('Backend unavailable, falling back to local store for pin deletion');
    }
    appStore.deletePin(id);
    return { success: true };
  },

  async toggleLike(id) {
    try {
      const response = await api.post(`/pins/${id}/like`);
      if (response?.data?.data) {
        appStore.toggleLike(id);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message && error.response.status !== 500 && error.response.status !== 404) {
        throw new Error(error.response.data.message);
      }
      console.warn('Backend unavailable, falling back to local store for toggle like');
    }
    return appStore.toggleLike(id);
  },

  async ratePin(id, score, userId = 2) {
    try {
      const response = await api.post(`/pins/${id}/rate`, { score });
      if (response?.data?.data) {
        appStore.ratePin(id, userId, score);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message && error.response.status !== 500 && error.response.status !== 404) {
        throw new Error(error.response.data.message);
      }
    }
    return appStore.ratePin(id, userId, score);
  },

  async getComments(id) {
    try {
      const response = await api.get(`/pins/${id}/comments`);
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    return appStore.getComments(id);
  },

  async addComment(id, { content, rating = null, user }) {
    try {
      const response = await api.post(`/pins/${id}/comments`, { content, rating });
      if (response?.data?.data) {
        appStore.addComment(id, response.data.data);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message && error.response.status !== 500 && error.response.status !== 404) {
        throw new Error(error.response.data.message);
      }
    }
    return appStore.addComment(id, { content, rating, user });
  },

  async updateComment(id, commentId, { content }) {
    try {
      const response = await api.put(`/pins/${id}/comments/${commentId}`, { content });
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message && error.response.status !== 500 && error.response.status !== 404) {
        throw new Error(error.response.data.message);
      }
    }
    return appStore.updateComment(commentId, content);
  },

  async deleteComment(id, commentId) {
    try {
      await api.delete(`/pins/${id}/comments/${commentId}`);
    } catch (error) {
      if (error?.response?.data?.message && error.response.status !== 500 && error.response.status !== 404) {
        throw new Error(error.response.data.message);
      }
    }
    appStore.deleteComment(commentId);
    return { success: true };
  },

  async reportPin(id, data, user) {
    try {
      const response = await api.post(`/pins/${id}/report`, data);
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message && error.response.status !== 500 && error.response.status !== 404) {
        throw new Error(error.response.data.message);
      }
    }
    return appStore.addReport({ pin_id: id, ...data, user });
  },

  recordPinView(id) {
    appStore.addRecentlyViewedPin(id);
  },

  getRecentlyViewedPins() {
    return appStore.getRecentlyViewedPins();
  },
};
