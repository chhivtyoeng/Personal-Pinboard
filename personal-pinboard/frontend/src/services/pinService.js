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
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
    throw new Error('Failed to create pin');
  },

  async updatePin(id, data) {
    try {
      const response = await api.put(`/pins/${id}`, data);
      if (response?.data?.data) {
        appStore.updatePin(id, response.data.data);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
    throw new Error('Failed to update pin');
  },

  async deletePin(id) {
    try {
      await api.delete(`/pins/${id}`);
      appStore.deletePin(id);
      return { success: true };
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async toggleLike(id) {
    try {
      const response = await api.post(`/pins/${id}/like`);
      if (response?.data?.data) {
        appStore.toggleLike(id);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
    throw new Error('Failed to toggle like');
  },

  async ratePin(id, score, userId = 2) {
    try {
      const response = await api.post(`/pins/${id}/rate`, { score });
      if (response?.data?.data) {
        appStore.ratePin(id, userId, score);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
    throw new Error('Failed to submit rating');
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
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
    throw new Error('Failed to post comment');
  },

  async updateComment(id, commentId, { content }) {
    try {
      const response = await api.put(`/pins/${id}/comments/${commentId}`, { content });
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
    throw new Error('Failed to update comment');
  },

  async deleteComment(id, commentId) {
    try {
      await api.delete(`/pins/${id}/comments/${commentId}`);
      appStore.deleteComment(commentId);
      return { success: true };
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async reportPin(id, data, user) {
    try {
      const response = await api.post(`/pins/${id}/report`, data);
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
    throw new Error('Failed to submit report');
  },

  recordPinView(id) {
    appStore.addRecentlyViewedPin(id);
  },

  getRecentlyViewedPins() {
    return appStore.getRecentlyViewedPins();
  },
};
