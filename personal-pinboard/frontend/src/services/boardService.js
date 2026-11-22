import api from './api';
import { appStore } from './store';

export const boardService = {
  async getUserBoards(userId) {
    try {
      const response = await api.get(`/boards/user/${userId}`);
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    return appStore.getBoards(userId);
  },

  async getBoardById(id) {
    try {
      const response = await api.get(`/boards/${id}`);
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    return appStore.getBoardById(id);
  },

  async createBoard(data) {
    try {
      const response = await api.post('/boards', data);
      if (response?.data?.data) {
        appStore.addBoard(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
    throw new Error('Failed to create board');
  },

  async updateBoard(id, data) {
    try {
      const response = await api.put(`/boards/${id}`, data);
      if (response?.data?.data) {
        appStore.updateBoard(id, response.data.data);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
    throw new Error('Failed to update board');
  },

  async deleteBoard(id) {
    try {
      await api.delete(`/boards/${id}`);
      appStore.deleteBoard(id);
      return { success: true };
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async savePinToBoard(boardId, pinId) {
    try {
      const response = await api.post(`/boards/${boardId}/pins`, { pin_id: pinId });
      if (response?.data?.data) {
        appStore.savePinToBoard(boardId, pinId);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
    throw new Error('Failed to save pin to board');
  },

  async removePinFromBoard(boardId, pinId) {
    try {
      await api.delete(`/boards/${boardId}/pins/${pinId}`);
      appStore.removePinFromBoard(boardId, pinId);
      return { success: true };
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
};
