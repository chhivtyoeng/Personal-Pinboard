import api from './api';
import { MOCK_USERS } from '../data/mockData';

// Storage helper for frontend fallback user registration & persistence
const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem('pinboard_registered_users');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveStoredUser = (user) => {
  try {
    const existing = getStoredUsers();
    const updated = [user, ...existing.filter((u) => u.email?.toLowerCase() !== user.email?.toLowerCase())];
    localStorage.setItem('pinboard_registered_users', JSON.stringify(updated));
  } catch (e) {}
};

export const authService = {
  // Register new account (Calls backend with offline fallback)
  async register(data) {
    try {
      const response = await api.post('/auth/register', data);
      if (response?.data?.data) {
        saveStoredUser(response.data.data.user);
        return response.data.data;
      }
    } catch (error) {
      // If server returned a business validation error (e.g. 400 email exists), rethrow it
      if (error?.response?.data?.message && error.response.status !== 500 && error.response.status !== 404) {
        throw new Error(error.response.data.message);
      }
    }

    // Graceful fallback
    const email = (data.email || '').toLowerCase().trim();
    const username = data.username?.trim() || (email ? email.split('@')[0] : 'creator');
    const fullName = data.full_name?.trim() || username;

    const newUser = {
      id: Date.now(),
      username,
      email,
      full_name: fullName,
      role: 'user',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      created_at: new Date().toISOString(),
    };

    saveStoredUser(newUser);

    return {
      user: newUser,
      token: 'frontend-jwt-token-' + newUser.id,
    };
  },

  // Login (Calls backend with offline fallback)
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response?.data?.data) {
        saveStoredUser(response.data.data.user);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message && error.response.status !== 500 && error.response.status !== 404) {
        throw new Error(error.response.data.message);
      }
    }

    // Fallback logic
    const rawInput = (credentials.email || credentials.username || '').trim();
    const normalizedInput = rawInput.toLowerCase();
    // Only grant admin role if the input exactly matches a known admin identifier,
    // not just any string that contains the word 'admin' (prevents privilege escalation)
    const isAdmin = normalizedInput === 'admin' || normalizedInput === 'admin@pinboard.dev';

    const storedUsers = getStoredUsers();
    const matchedStored = storedUsers.find(
      (u) =>
        u.email?.toLowerCase() === normalizedInput ||
        u.username?.toLowerCase() === normalizedInput ||
        u.full_name?.toLowerCase() === normalizedInput
    );

    const matchedMock = MOCK_USERS.find(
      (u) =>
        u.email?.toLowerCase() === normalizedInput ||
        u.username?.toLowerCase() === normalizedInput ||
        u.full_name?.toLowerCase() === normalizedInput
    );

    let username = matchedStored?.username || matchedMock?.username;
    let fullName = matchedStored?.full_name || matchedMock?.full_name;

    if (!fullName) {
      if (rawInput.includes('@')) {
        const prefix = rawInput.split('@')[0];
        username = prefix.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
        fullName = prefix
          .split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ') || prefix;
      } else {
        username = rawInput.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_') || 'creator';
        fullName = rawInput
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    if (isAdmin && !fullName) fullName = 'System Administrator';
    if (normalizedInput.includes('sarah') && !fullName) fullName = 'Sarah Jenkins';

    const user = {
      id: matchedStored?.id || matchedMock?.id || (isAdmin ? 1 : Date.now()),
      username: username || 'creator',
      email: rawInput.includes('@') ? rawInput : `${username}@pinboard.dev`,
      full_name: fullName || 'Pinboard Curator',
      role: isAdmin ? 'admin' : (matchedStored?.role || matchedMock?.role || 'user'),
      avatar_url:
        matchedStored?.avatar_url ||
        matchedMock?.avatar_url ||
        (isAdmin
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
      bio:
        matchedStored?.bio ||
        matchedMock?.bio ||
        'Product & visual creator exploring aesthetic ideas.',
    };

    saveStoredUser(user);

    return {
      user,
      token: 'frontend-jwt-token-' + user.id,
    };
  },

  // Get current user profile from token
  async getMe() {
    try {
      const response = await api.get('/auth/me');
      if (response?.data?.data) {
        return response.data.data;
      }
    } catch (error) {}

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {}
    }
    return MOCK_USERS[1];
  },

  // Google Sign-in / Registration
  async loginWithGoogle(profile) {
    try {
      const payload = typeof profile === 'object' ? profile : { email: profile };
      const response = await api.post('/auth/google', payload);
      if (response?.data?.data) {
        saveStoredUser(response.data.data.user);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }

    const email = (typeof profile === 'object' ? profile.email : profile || '').toLowerCase().trim();
    const name = (typeof profile === 'object' ? profile.name : '') || (email ? email.split('@')[0] : 'Google User');
    const avatarUrl = (typeof profile === 'object' ? profile.avatar_url : null) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    const username = email ? email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') : 'google_user';

    const storedUsers = getStoredUsers();
    const existing = storedUsers.find((u) => u.email?.toLowerCase() === email);

    const user = {
      id: existing?.id || Date.now(),
      username: existing?.username || username,
      email,
      full_name: existing?.full_name || name,
      role: existing?.role || 'user',
      avatar_url: avatarUrl || existing?.avatar_url,
      auth_provider: 'google',
      created_at: existing?.created_at || new Date().toISOString(),
    };

    saveStoredUser(user);
    return {
      user,
      token: 'jwt-google-' + user.id,
    };
  },

  // Email OTP Login / Registration
  async loginWithOtp(email, fullName = '', code = '') {
    try {
      const response = await api.post('/auth/otp-login', { email, fullName, code });
      if (response?.data?.data) {
        saveStoredUser(response.data.data.user);
        return response.data.data;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    const username = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    const name = fullName?.trim() || username;

    const storedUsers = getStoredUsers();
    const existing = storedUsers.find((u) => u.email?.toLowerCase() === cleanEmail);

    const user = {
      id: existing?.id || Date.now(),
      username: existing?.username || username,
      email: cleanEmail,
      full_name: existing?.full_name || name,
      role: existing?.role || 'user',
      avatar_url: existing?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      auth_provider: 'email_otp',
      created_at: existing?.created_at || new Date().toISOString(),
    };

    saveStoredUser(user);
    return {
      user,
      token: 'jwt-otp-' + user.id,
    };
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(email, code, newPassword) {
    const response = await api.post('/auth/reset-password', { email, code, newPassword });
    return response.data;
  },
};

export default authService;
