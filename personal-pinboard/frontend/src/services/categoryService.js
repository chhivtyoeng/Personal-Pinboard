import api from './api';
import { appStore } from './store';

export const categoryService = {
  async getCategories() {
    try {
      const response = await api.get('/categories');
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    return appStore.getCategories();
  },

  async getCategoryById(id) {
    try {
      const response = await api.get(`/categories/${id}`);
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    return appStore.getCategoryById(id);
  },

  async createCategory(data) {
    try {
      const response = await api.post('/categories', data);
      if (response?.data?.data) {
        appStore.addCategory(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    return appStore.addCategory(data);
  },

  async updateCategory(id, data) {
    try {
      const response = await api.put(`/categories/${id}`, data);
      if (response?.data?.data) {
        appStore.updateCategory(id, response.data.data);
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    return appStore.updateCategory(id, data);
  },

  async deleteCategory(id) {
    try {
      await api.delete(`/categories/${id}`);
    } catch (error) {
      // Graceful fallback to appStore
    }

    appStore.deleteCategory(id);
    return { success: true };
  },

  async addMemberToCategory(categoryId, friend) {
    return appStore.addMemberToCategory(categoryId, friend);
  },

  async removeMemberFromCategory(categoryId, friendId) {
    return appStore.removeMemberFromCategory(categoryId, friendId);
  },
};
