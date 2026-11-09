import api from './api';
import { appStore } from './store';
import { MOCK_BOARDS } from '../data/mockData';

export const userService = {
  async getProfile(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    const users = appStore.getUsers();
    const user = appStore.getUserById(userId) || users.find(u => String(u.id) === String(userId)) || users[1] || {
      id: 2,
      username: 'user',
      full_name: 'Pinboard User',
      email: 'user@pinboard.dev',
      role: 'user',
      avatar_url: null,
    };
    const userBoards = appStore.getBoards(user.id);
    const userPins = appStore.getPins().filter(p => p.user_id === user.id);
    return {
      ...user,
      boards: userBoards,
      pins: userPins,
    };
  },

  async updateProfile(data) {
    try {
      const response = await api.put('/users/profile', data);
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    let currentUserId = 2;
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id) currentUserId = parsed.id;
      }
    } catch (e) {}

    const updated = appStore.updateUserProfile(currentUserId, data);
    return updated || data;
  },

  async changePassword({ currentPassword, newPassword }) {
    const response = await api.put('/users/password', { currentPassword, newPassword });
    return response?.data;
  },

  async getAdminStats() {
    try {
      const response = await api.get('/admin/stats');
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    const users = appStore.getUsers();
    const pins = appStore.getPins();
    const comments = appStore.comments || [];
    const reports = appStore.getReports();
    return {
      totalUsers: users.length,
      totalPins: pins.length,
      totalBoards: appStore.boards ? appStore.boards.length : MOCK_BOARDS.length,
      totalComments: comments.length,
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      activeUsers: users.filter(u => u.status === 'active' || !u.status).length,
    };
  },

  async getAdminUsers(params = {}) {
    try {
      const response = await api.get('/admin/users', { params });
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    let users = appStore.getUsers();
    if (params.search) {
      const q = params.search.toLowerCase();
      users = users.filter(
        u => u.username.toLowerCase().includes(q) ||
             u.email.toLowerCase().includes(q) ||
             (u.full_name && u.full_name.toLowerCase().includes(q))
      );
    }
    if (params.role) {
      users = users.filter(u => u.role === params.role);
    }
    if (params.status) {
      users = users.filter(u => (u.status || 'active') === params.status);
    }
    return {
      users,
      pagination: { page: 1, limit: 10, total: users.length, totalPages: 1 },
    };
  },

  async updateUserRole(userId, role) {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role });
      if (response?.data?.data) {
        appStore.updateUserRole(userId, role);
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    appStore.updateUserRole(userId, role);
    return { success: true };
  },

  async updateUserStatus(userId, status) {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, { status });
      if (response?.data?.data) {
        appStore.updateUserStatus(userId, status);
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    appStore.updateUserStatus(userId, status);
    return { success: true };
  },

  async deleteUser(userId) {
    try {
      await api.delete(`/admin/users/${userId}`);
    } catch (error) {
      // Graceful fallback to appStore
    }

    appStore.deleteUser(userId);
    return { success: true };
  },

  async createUser(userData) {
    try {
      const response = await api.post('/admin/users', userData);
      if (response?.data?.data) {
        appStore.addUser(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    return appStore.addUser(userData);
  },

  async resetData() {
    try {
      await api.post('/admin/reset-demo-data');
    } catch (e) {}
    return appStore.resetToDefaultData();
  },

  async getReports(params = {}) {
    try {
      const response = await api.get('/admin/reports', { params });
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    let reports = appStore.getReports();
    if (params.status) {
      reports = reports.filter(r => r.status === params.status);
    }
    return reports;
  },

  async updateReportStatus(id, status) {
    try {
      const response = await api.put(`/admin/reports/${id}/status`, { status });
      if (response?.data?.data) {
        appStore.updateReportStatus(id, status);
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    return appStore.updateReportStatus(id, status);
  },

  async getSettings() {
    try {
      const response = await api.get('/admin/settings');
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    return appStore.getSettings();
  },

  async updateSettings(data) {
    try {
      const response = await api.put('/admin/settings', data);
      if (response?.data?.data) {
        appStore.updateSettings(data);
        return response.data.data;
      }
    } catch (error) {
      // Graceful fallback to appStore
    }

    return appStore.updateSettings(data);
  },

  async getAuditLogs() {
    return appStore.getAuditLogs();
  },

  async clearAuditLogs() {
    return appStore.clearAuditLogs();
  },
};
