import {
  MOCK_USERS,
  MOCK_FRIENDS,
  MOCK_CATEGORIES,
  MOCK_BOARDS,
  MOCK_PINS,
  MOCK_COMMENTS,
  MOCK_REPORTS,
  MOCK_SETTINGS,
} from '../data/mockData';

const KEYS = {
  PINS: 'pinboard_pins_v3',
  COMMENTS: 'pinboard_comments_v3',
  REPORTS: 'pinboard_reports_v3',
  USERS: 'pinboard_users_v3',
  FRIENDS: 'pinboard_friends_v3',
  CATEGORIES: 'pinboard_categories_v3',
  BOARDS: 'pinboard_boards_v3',
  SETTINGS: 'pinboard_settings_v3',
  NOTIFICATIONS: 'pinboard_notifications_v4',
  RECENTLY_VIEWED: 'pinboard_recently_viewed_pins_v2',
  AUDIT_LOGS: 'pinboard_audit_logs_v3',
};

const DEFAULT_AUDIT_LOGS = [];

const INITIAL_NOTIFICATIONS = [];

function load(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

function notify() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('pinboard-store-update'));
  }
}

const PURGE_ORPHANED_DATA_KEY = 'pinboard_purged_test_activity_v11';
if (typeof window !== 'undefined' && localStorage.getItem(PURGE_ORPHANED_DATA_KEY) !== 'true') {
  localStorage.setItem(PURGE_ORPHANED_DATA_KEY, 'true');
  save(KEYS.PINS, []);
  save(KEYS.BOARDS, []);
  save(KEYS.COMMENTS, []);
  save(KEYS.REPORTS, []);
  save(KEYS.USERS, MOCK_USERS);
  try {
    localStorage.removeItem('pinboard_pins_v2');
    localStorage.removeItem('pinboard_users_v2');
    localStorage.removeItem('pinboard_boards_v2');
    localStorage.removeItem('pinboard_comments_v2');
    localStorage.removeItem('pinboard_pins');
    localStorage.removeItem('pinboard_users');
    localStorage.removeItem('pinboard_boards');
    localStorage.removeItem('pinboard_comments');
  } catch (_) {}
}

class AppStore {
  constructor() {
    const loadedUsers = load(KEYS.USERS, MOCK_USERS);
    // Sanitize users: keep only admin accounts, purge any orphaned test accounts
    const sanitizedUsers = (Array.isArray(loadedUsers) && loadedUsers.length > 0)
      ? loadedUsers.filter((u) => u.role === 'admin' || u.username === 'admin')
      : [...MOCK_USERS];
    this.users = sanitizedUsers.length > 0 ? sanitizedUsers : [...MOCK_USERS];
    save(KEYS.USERS, this.users);

    const loadedPins = load(KEYS.PINS, []);
    // Sanitize pins: filter out pins created by tytytest1 or test users
    this.pins = Array.isArray(loadedPins)
      ? loadedPins.filter((p) => p.username !== 'tytytest1' && p.user?.username !== 'tytytest1')
      : [];
    save(KEYS.PINS, this.pins);

    const loadedCats = load(KEYS.CATEGORIES, null);
    this.categories = Array.isArray(loadedCats) ? loadedCats : [...MOCK_CATEGORIES];
    const loadedBoards = load(KEYS.BOARDS, []);
    this.boards = Array.isArray(loadedBoards) ? loadedBoards : [];
    save(KEYS.BOARDS, this.boards);

    const loadedComments = load(KEYS.COMMENTS, []);
    this.comments = Array.isArray(loadedComments) ? loadedComments : [];
    save(KEYS.COMMENTS, this.comments);

    const loadedReports = load(KEYS.REPORTS, []);
    this.reports = Array.isArray(loadedReports) ? loadedReports : [];
    save(KEYS.REPORTS, this.reports);
    this.friends = load(KEYS.FRIENDS, []);
    this.notifications = load(KEYS.NOTIFICATIONS, []);
    this.settings = load(KEYS.SETTINGS, MOCK_SETTINGS);
    this.auditLogs = load(KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
  }

  clearAllData() {
    this.pins = [];
    this.boards = [];
    this.categories = [];
    this.comments = [];
    this.reports = [];
    this.friends = [];
    this.notifications = [];
    save(KEYS.PINS, []);
    save(KEYS.BOARDS, []);
    save(KEYS.CATEGORIES, []);
    save(KEYS.COMMENTS, []);
    save(KEYS.REPORTS, []);
    save(KEYS.FRIENDS, []);
    save(KEYS.NOTIFICATIONS, []);
    save(KEYS.RECENTLY_VIEWED, []);
    notify();
    return true;
  }

  // Pins
  getPins() {
    return [...this.pins];
  }

  getPinById(id) {
    return this.pins.find(p => p.id === Number(id)) || null;
  }

  addPin(pin) {
    this.pins = [pin, ...this.pins];
    save(KEYS.PINS, this.pins);

    if (pin.board_id) {
      this.boards = this.boards.map(b => {
        if (b.id === Number(pin.board_id)) {
          const boardPins = this.pins.filter(p => p.board_id === Number(b.id));
          return {
            ...b,
            pins_count: boardPins.length,
            preview_images: boardPins.slice(0, 3).map(p => p.image_url),
          };
        }
        return b;
      });
      save(KEYS.BOARDS, this.boards);
    }

    if (pin.category_id) {
      this.categories = this.categories.map(c => {
        if (c.id === Number(pin.category_id)) {
          return {
            ...c,
            pins_count: (c.pins_count || 0) + 1,
          };
        }
        return c;
      });
      save(KEYS.CATEGORIES, this.categories);
    }

    this.addNotification({
      title: `Created new pin "${pin.title || 'Untitled'}"`,
      type: 'pin',
      link: `/pins/${pin.id}`,
    });

    notify();
    return pin;
  }

  updatePin(id, updates) {
    this.pins = this.pins.map(p => p.id === Number(id) ? { ...p, ...updates } : p);
    save(KEYS.PINS, this.pins);
    notify();
    return this.getPinById(id);
  }

  deletePin(id) {
    const pinToDelete = this.pins.find(p => String(p.id) === String(id));
    this.pins = this.pins.filter(p => String(p.id) !== String(id));
    this.comments = this.comments.filter(c => String(c.pin_id) !== String(id));
    this.reports = this.reports.filter(r => String(r.pin_id) !== String(id));
    save(KEYS.PINS, this.pins);
    save(KEYS.COMMENTS, this.comments);
    save(KEYS.REPORTS, this.reports);

    if (pinToDelete && pinToDelete.board_id) {
      const boardPins = this.pins.filter(p => String(p.board_id) === String(pinToDelete.board_id));
      this.boards = this.boards.map(b => {
        if (String(b.id) === String(pinToDelete.board_id)) {
          return {
            ...b,
            pins_count: boardPins.length,
            preview_images: boardPins.slice(0, 3).map(p => p.image_url),
          };
        }
        return b;
      });
      save(KEYS.BOARDS, this.boards);
    }

    if (pinToDelete && pinToDelete.category_id) {
      this.categories = this.categories.map(c => {
        if (String(c.id) === String(pinToDelete.category_id)) {
          return {
            ...c,
            pins_count: Math.max(0, (c.pins_count || 1) - 1),
          };
        }
        return c;
      });
      save(KEYS.CATEGORIES, this.categories);
    }

    notify();
    return true;
  }

  toggleLike(pinId, userId = 2) {
    let likedState = false;
    let nextCount = 0;
    const uid = Number(userId) || 2;
    this.pins = this.pins.map(p => {
      if (String(p.id) === String(pinId)) {
        likedState = !p.is_liked;
        nextCount = likedState ? (p.likes_count || 0) + 1 : Math.max(0, (p.likes_count || 0) - 1);
        let likedBy = Array.isArray(p.liked_by) ? [...p.liked_by] : [];
        if (likedState) {
          if (!likedBy.includes(uid)) likedBy.push(uid);
        } else {
          likedBy = likedBy.filter(id => id !== uid);
        }
        return {
          ...p,
          is_liked: likedState,
          likes_count: nextCount,
          liked_by: likedBy,
        };
      }
      return p;
    });
    save(KEYS.PINS, this.pins);
    notify();
    return { liked: likedState, likes_count: nextCount };
  }

  ratePin(pinId, userId, score) {
    let ratingAvg = score;
    let ratingsCount = 1;
    this.pins = this.pins.map(p => {
      if (String(p.id) === String(pinId)) {
        const prevCount = p.ratings_count || 0;
        const prevAvg = p.rating_avg || score;
        const hadRated = p.user_rating != null;
        
        let newCount = hadRated ? prevCount : prevCount + 1;
        let newAvg = hadRated
          ? Math.round((((prevAvg * prevCount) - p.user_rating + score) / Math.max(1, newCount)) * 10) / 10
          : Math.round((((prevAvg * prevCount) + score) / Math.max(1, newCount)) * 10) / 10;
        
        ratingAvg = newAvg;
        ratingsCount = newCount;
        return {
          ...p,
          user_rating: score,
          rating_avg: newAvg,
          ratings_count: newCount,
        };
      }
      return p;
    });
    save(KEYS.PINS, this.pins);
    notify();
    return { user_rating: score, rating_avg: ratingAvg, ratings_count: ratingsCount };
  }

  // Comments
  getComments(pinId) {
    return this.comments
      .filter(c => c.pin_id === Number(pinId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  addComment(pinId, { user_id, username, user_name, user_avatar, content, rating = null }) {
    const newComment = {
      id: Date.now(),
      pin_id: Number(pinId) || pinId,
      user_id,
      username,
      user_name: user_name || username,
      user_avatar: user_avatar || null,
      content,
      rating,
      created_at: new Date().toISOString(),
    };
    this.comments = [newComment, ...this.comments];
    save(KEYS.COMMENTS, this.comments);

    // Update pin comments count
    this.pins = this.pins.map(p => {
      if (String(p.id) === String(pinId)) {
        return { ...p, comments_count: (p.comments_count || 0) + 1 };
      }
      return p;
    });
    save(KEYS.PINS, this.pins);
    notify();
    return newComment;
  }

  updateComment(commentId, content) {
    this.comments = this.comments.map(c => String(c.id) === String(commentId) ? { ...c, content, updated_at: new Date().toISOString() } : c);
    save(KEYS.COMMENTS, this.comments);
    notify();
    return this.comments.find(c => String(c.id) === String(commentId));
  }

  deleteComment(commentId) {
    const comment = this.comments.find(c => String(c.id) === String(commentId));
    if (comment) {
      const pinId = comment.pin_id;
      this.comments = this.comments.filter(c => String(c.id) !== String(commentId));
      save(KEYS.COMMENTS, this.comments);

      this.pins = this.pins.map(p => {
        if (String(p.id) === String(pinId)) {
          return { ...p, comments_count: Math.max(0, (p.comments_count || 1) - 1) };
        }
        return p;
      });
      save(KEYS.PINS, this.pins);
      notify();
    }
    return true;
  }

  // Reports
  getReports() {
    return [...this.reports].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  addReport({ pin_id, reporter_id, reporter_username, reporter_email, reason, details }) {
    const pin = this.getPinById(pin_id);
    const newReport = {
      id: Date.now(),
      pin_id: Number(pin_id),
      pin_title: pin ? pin.title : 'Saved Pin',
      pin_image: pin ? pin.image_url : '',
      reporter_id,
      reporter_username,
      reporter_email: reporter_email || `${reporter_username}@example.com`,
      reason,
      details: details || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.reports = [newReport, ...this.reports];
    save(KEYS.REPORTS, this.reports);
    return newReport;
  }

  updateReportStatus(reportId, status) {
    this.reports = this.reports.map(r => String(r.id) === String(reportId) ? { ...r, status, updated_at: new Date().toISOString() } : r);
    save(KEYS.REPORTS, this.reports);
    this.addAuditLog('Moderate Report', `Report #${reportId} (${status})`, 'Success');
    notify();
    return this.reports.find(r => String(r.id) === String(reportId));
  }

  deleteReport(reportId) {
    this.reports = this.reports.filter(r => String(r.id) !== String(reportId));
    save(KEYS.REPORTS, this.reports);
    this.addAuditLog('Delete Report', `Report #${reportId}`, 'Success');
    notify();
    return true;
  }

  // Users
  getUsers() {
    return [...this.users];
  }

  getUserById(id) {
    return this.users.find(u => String(u.id) === String(id)) || null;
  }

  updateUserProfile(userId, updates) {
    this.users = this.users.map(u => String(u.id) === String(userId) ? { ...u, ...updates } : u);
    save(KEYS.USERS, this.users);
    notify();
    return this.users.find(u => String(u.id) === String(userId));
  }

  updateUserRole(userId, role) {
    const user = this.users.find(u => String(u.id) === String(userId));
    this.users = this.users.map(u => String(u.id) === String(userId) ? { ...u, role } : u);
    save(KEYS.USERS, this.users);
    this.addAuditLog('Update User Role', `${user ? `@${user.username}` : `User #${userId}`} -> ${role}`, 'Success');
    notify();
    return true;
  }

  updateUserStatus(userId, status) {
    const user = this.users.find(u => String(u.id) === String(userId));
    this.users = this.users.map(u => String(u.id) === String(userId) ? { ...u, status } : u);
    save(KEYS.USERS, this.users);
    this.addAuditLog('Update User Status', `${user ? `@${user.username}` : `User #${userId}`} -> ${status}`, 'Success');
    notify();
    return true;
  }

  deleteUser(userId) {
    const user = this.users.find(u => String(u.id) === String(userId));
    this.users = this.users.filter(u => String(u.id) !== String(userId));
    save(KEYS.USERS, this.users);
    this.addAuditLog('Delete User', user ? `@${user.username}` : `User #${userId}`, 'Success');
    notify();
    return true;
  }

  addUser(userData) {
    const cleanUsername = (userData.username || 'new_user').toLowerCase().replace(/\s+/g, '_');
    const newUser = {
      id: Date.now(),
      username: cleanUsername,
      email: userData.email || `${cleanUsername}@pinboard.dev`,
      full_name: userData.full_name || 'New Member',
      bio: userData.bio || 'Pinboard community curator.',
      role: userData.role || 'user',
      avatar_url: userData.avatar_url || null,
      pins_count: 0,
      boards_count: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };
    this.users = [newUser, ...this.users];
    save(KEYS.USERS, this.users);
    notify();
    return newUser;
  }

  // Private Friends Circle (Max 5 Friends)
  getFriends(userId = 2) {
    return [...this.friends].slice(0, 5);
  }

  getFriendById(friendId) {
    const fid = Number(friendId);
    return this.friends.find(f => f.friend_id === fid || f.id === fid) || null;
  }

  addFriend(friendData) {
    if (this.friends.length >= 5) {
      throw new Error('Maximum 5 friends allowed in your private sharing circle.');
    }

    const fid = Number(friendData.friend_id || friendData.id);
    const existing = this.friends.find(f => f.friend_id === fid || f.id === fid);
    if (existing) {
      throw new Error('This user is already in your 5-friend sharing circle.');
    }

    const userProfile = this.users.find(u => u.id === fid);
    const newFriend = {
      id: fid,
      user_id: 2,
      friend_id: fid,
      username: friendData.username || userProfile?.username || `friend_${fid}`,
      full_name: friendData.full_name || userProfile?.full_name || 'Friend',
      avatar_url: friendData.avatar_url || userProfile?.avatar_url || null,
      bio: friendData.bio || userProfile?.bio || 'Curator in your private 5-friend circle.',
      shared_categories: friendData.shared_categories || ['Architecture & Spaces'],
      status: 'connected',
      online: true,
      mutual_pins_count: userProfile?.pins_count || 5,
      mutual_boards_count: userProfile?.boards_count || 2,
      added_at: new Date().toISOString(),
    };

    this.friends = [...this.friends, newFriend].slice(0, 5);
    save(KEYS.FRIENDS, this.friends);
    this.addNotification({
      title: `Added @${newFriend.username} to your 5-friend sharing circle`,
      type: 'friend',
      link: `/profile/${fid}`,
      user_name: newFriend.full_name,
    });
    notify();
    return newFriend;
  }

  removeFriend(friendId) {
    const fid = Number(friendId);
    const friend = this.friends.find(f => f.friend_id === fid || f.id === fid);
    this.friends = this.friends.filter(f => f.friend_id !== fid && f.id !== fid);
    save(KEYS.FRIENDS, this.friends);
    if (friend) {
      this.addNotification({
        title: `Removed @${friend.username} from your 5-friend sharing circle`,
        type: 'friend',
        link: '/settings',
      });
    }
    notify();
    return true;
  }

  getSuggestedFriends(currentUserId = 2) {
    const currentFriendIds = new Set(this.friends.map(f => f.friend_id || f.id));
    currentFriendIds.add(Number(currentUserId));
    // Users that are not Sarah and not already in friends
    return this.users.filter(u => !currentFriendIds.has(u.id));
  }

  // Categories
  getCategories() {
    return [...this.categories];
  }

  addCategory(category) {
    const newCat = {
      id: Date.now(),
      slug: (category.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      pins_count: 0,
      type: category.type || 'personal',
      members: Array.isArray(category.members) ? category.members.slice(0, 5) : [],
      created_at: new Date().toISOString(),
      ...category,
    };
    this.categories = [...this.categories, newCat];
    save(KEYS.CATEGORIES, this.categories);
    notify();
    return newCat;
  }

  addMemberToCategory(categoryId, friend) {
    this.categories = this.categories.map(c => {
      if (c.id === Number(categoryId)) {
        const members = c.members || [];
        if (members.length >= 5) {
          throw new Error('Maximum 5 people per group category.');
        }
        if (members.some(m => m.id === friend.id)) {
          return c;
        }
        return {
          ...c,
          type: 'group',
          members: [...members, friend],
        };
      }
      return c;
    });
    save(KEYS.CATEGORIES, this.categories);
    notify();
    return this.categories.find(c => c.id === Number(categoryId));
  }

  removeMemberFromCategory(categoryId, friendId) {
    this.categories = this.categories.map(c => {
      if (c.id === Number(categoryId)) {
        return {
          ...c,
          members: (c.members || []).filter(m => m.id !== Number(friendId)),
        };
      }
      return c;
    });
    save(KEYS.CATEGORIES, this.categories);
    notify();
    return this.categories.find(c => c.id === Number(categoryId));
  }

  getCategoryById(id) {
    return this.categories.find(c => String(c.id) === String(id) || c.slug === id) || null;
  }

  updateCategory(id, updates) {
    this.categories = this.categories.map(c => String(c.id) === String(id) ? { ...c, ...updates } : c);
    save(KEYS.CATEGORIES, this.categories);
    notify();
    return this.categories.find(c => String(c.id) === String(id));
  }

  deleteCategory(id) {
    this.categories = this.categories.filter(c => String(c.id) !== String(id));
    save(KEYS.CATEGORIES, this.categories);
    notify();
    return true;
  }

  // Boards
  getBoards(userId) {
    if (userId != null) {
      return this.boards.filter(b => String(b.user_id) === String(userId));
    }
    return [...this.boards];
  }

  getBoardById(id) {
    const board = this.boards.find(b => String(b.id) === String(id));
    if (!board) return null;
    const pins = this.pins.filter(p => String(p.board_id) === String(id));
    return { ...board, pins };
  }

  addBoard(boardData) {
    let currentUserId = 2;
    if (typeof localStorage !== 'undefined') {
      try {
        const u = localStorage.getItem('user');
        if (u) {
          const parsed = JSON.parse(u);
          if (parsed?.id) currentUserId = parsed.id;
        }
      } catch (e) {}
    }

    const newBoard = {
      id: Date.now(),
      user_id: boardData.user_id || currentUserId,
      pins_count: 0,
      preview_images: [],
      pin_ids: [],
      created_at: new Date().toISOString(),
      ...boardData,
    };
    this.boards = [newBoard, ...this.boards];
    save(KEYS.BOARDS, this.boards);
    notify();
    return newBoard;
  }

  updateBoard(id, updates) {
    this.boards = this.boards.map(b => String(b.id) === String(id) ? { ...b, ...updates } : b);
    save(KEYS.BOARDS, this.boards);
    notify();
    return this.boards.find(b => String(b.id) === String(id));
  }

  deleteBoard(id) {
    this.boards = this.boards.filter(b => String(b.id) !== String(id));
    // Clear board association from pins
    this.pins = this.pins.map(p => String(p.board_id) === String(id) ? { ...p, board_id: null, board_name: null } : p);
    save(KEYS.BOARDS, this.boards);
    save(KEYS.PINS, this.pins);
    notify();
    return true;
  }

  savePinToBoard(boardId, pinId) {
    const pin = this.pins.find(p => String(p.id) === String(pinId));
    const board = this.boards.find(b => String(b.id) === String(boardId));
    if (!pin || !board) return null;

    pin.board_id = Number(boardId) || boardId;
    pin.board_name = board.name;
    pin.is_liked = true; // Also mark as saved/favorite

    const boardPins = this.pins.filter(p => String(p.board_id) === String(boardId));
    board.pins_count = boardPins.length;
    board.preview_images = boardPins.slice(0, 3).map(p => p.image_url);
    if (!board.cover_image_url && pin.image_url) {
      board.cover_image_url = pin.image_url;
    }

    if (!Array.isArray(board.pin_ids)) board.pin_ids = [];
    if (!board.pin_ids.some(id => String(id) === String(pinId))) {
      board.pin_ids.push(Number(pinId) || pinId);
    }

    save(KEYS.PINS, this.pins);
    save(KEYS.BOARDS, this.boards);
    this.addNotification({
      title: `Saved "${pin.title || 'Pin'}" to board "${board.name}"`,
      type: 'save',
      link: `/pins/${pin.id}`,
    });
    notify();
    return { board, pin };
  }

  removePinFromBoard(boardId, pinId) {
    const pin = this.pins.find(p => String(p.id) === String(pinId));
    const board = this.boards.find(b => String(b.id) === String(boardId));
    if (pin && String(pin.board_id) === String(boardId)) {
      pin.board_id = null;
      pin.board_name = null;
    }
    if (board) {
      const boardPins = this.pins.filter(p => String(p.board_id) === String(boardId));
      board.pins_count = boardPins.length;
      board.preview_images = boardPins.slice(0, 3).map(p => p.image_url);
      if (Array.isArray(board.pin_ids)) {
        board.pin_ids = board.pin_ids.filter(id => String(id) !== String(pinId));
      }
    }
    save(KEYS.PINS, this.pins);
    save(KEYS.BOARDS, this.boards);
    notify();
    return true;
  }

  // Settings & Policies
  getSettings() {
    return { ...this.settings };
  }

  updateSettings(updates) {
    const prev = { ...this.settings };
    this.settings = { ...this.settings, ...updates };
    save(KEYS.SETTINGS, this.settings);

    // Dynamic Audit Trail logging based on what was changed
    if (updates.maintenance_mode !== undefined && updates.maintenance_mode !== prev.maintenance_mode) {
      this.addAuditLog(
        updates.maintenance_mode ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode',
        'System Lockdown Policy',
        'Applied'
      );
    } else if (updates.allow_registration !== undefined && updates.allow_registration !== prev.allow_registration) {
      this.addAuditLog(
        updates.allow_registration ? 'Enable Public Registration' : 'Disable Public Registration',
        'Account Access Policy',
        'Applied'
      );
    } else if (updates.enable_comments !== undefined && updates.enable_comments !== prev.enable_comments) {
      this.addAuditLog(
        updates.enable_comments ? 'Enable Pin Comments' : 'Disable Pin Comments',
        'Interaction Policy',
        'Applied'
      );
    } else if (updates.enable_ratings !== undefined && updates.enable_ratings !== prev.enable_ratings) {
      this.addAuditLog(
        updates.enable_ratings ? 'Enable Pin Ratings' : 'Disable Pin Ratings',
        'Interaction Policy',
        'Applied'
      );
    } else if (updates.require_moderation_threshold !== undefined && updates.require_moderation_threshold !== prev.require_moderation_threshold) {
      this.addAuditLog(
        'Update Moderation Threshold',
        `${updates.require_moderation_threshold} reports`,
        'Applied'
      );
    } else {
      this.addAuditLog('Update Platform Policies', 'Global Settings', 'Success');
    }

    notify();
    return { ...this.settings };
  }

  // Live Audit Trail
  getAuditLogs() {
    return [...this.auditLogs];
  }

  addAuditLog(action, target, status = 'Success') {
    let adminName = 'Admin';
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('user');
        if (saved) {
          const parsed = JSON.parse(saved);
          adminName = parsed.full_name || parsed.username || 'Admin';
        }
      } catch (e) {}
    }

    const newLog = {
      id: Date.now() + Math.random(),
      time: 'Just now',
      timestamp: Date.now(),
      admin: adminName,
      action,
      target: String(target || 'System'),
      status,
    };
    this.auditLogs = [newLog, ...this.auditLogs].slice(0, 50);
    save(KEYS.AUDIT_LOGS, this.auditLogs);
    notify();
    return newLog;
  }

  clearAuditLogs() {
    this.auditLogs = [];
    save(KEYS.AUDIT_LOGS, []);
    notify();
    return [];
  }

  // Activity Notifications
  getNotifications() {
    return [...this.notifications];
  }

  getUnreadNotificationsCount() {
    return this.notifications.filter(n => !n.is_read).length;
  }

  markAllNotificationsAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
    save(KEYS.NOTIFICATIONS, this.notifications);
    notify();
    return [...this.notifications];
  }

  markNotificationAsRead(id) {
    this.notifications = this.notifications.map(n =>
      n.id === Number(id) ? { ...n, is_read: true } : n
    );
    save(KEYS.NOTIFICATIONS, this.notifications);
    notify();
    return [...this.notifications];
  }

  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== Number(id));
    save(KEYS.NOTIFICATIONS, this.notifications);
    notify();
    return [...this.notifications];
  }

  addNotification(notif) {
    const newNotif = {
      id: Date.now(),
      title: notif.title || 'New activity notification',
      time: 'Just now',
      timestamp: Date.now(),
      is_read: false,
      type: notif.type || 'system',
      link: notif.link || '/pins',
      user_name: notif.user_name || null,
      ...notif,
    };
    this.notifications = [newNotif, ...this.notifications].slice(0, 30);
    save(KEYS.NOTIFICATIONS, this.notifications);
    notify();
    return newNotif;
  }

  clearNotifications() {
    this.notifications = [];
    save(KEYS.NOTIFICATIONS, this.notifications);
    notify();
    return [];
  }

  // Recently Viewed Pins
  getRecentlyViewedPins() {
    const ids = load(KEYS.RECENTLY_VIEWED, []);
    return ids
      .map(id => this.pins.find(p => p.id === Number(id)))
      .filter(Boolean);
  }

  addRecentlyViewedPin(pinId) {
    const idNum = Number(pinId);
    if (!idNum) return;
    const current = load(KEYS.RECENTLY_VIEWED, []);
    const updated = [idNum, ...current.filter(id => id !== idNum)].slice(0, 24);
    save(KEYS.RECENTLY_VIEWED, updated);
    notify();
  }

  resetToDefaultData() {
    this.users = [...MOCK_USERS];
    this.pins = [...MOCK_PINS];
    this.categories = [...MOCK_CATEGORIES];
    this.boards = [...MOCK_BOARDS];
    this.comments = [...MOCK_COMMENTS];
    this.reports = [...MOCK_REPORTS];
    this.friends = [...MOCK_FRIENDS];
    this.notifications = [];
    this.settings = { ...MOCK_SETTINGS };
    this.auditLogs = [
      { id: Date.now(), time: 'Just now', timestamp: Date.now(), admin: 'Alex Rivera (Admin)', action: 'Factory Reset', target: 'All Mock Datasets', status: 'Restored' },
      ...DEFAULT_AUDIT_LOGS.slice(0, 3)
    ];
    save(KEYS.USERS, this.users);
    save(KEYS.PINS, this.pins);
    save(KEYS.CATEGORIES, this.categories);
    save(KEYS.BOARDS, this.boards);
    save(KEYS.COMMENTS, this.comments);
    save(KEYS.REPORTS, this.reports);
    save(KEYS.FRIENDS, this.friends);
    save(KEYS.NOTIFICATIONS, this.notifications);
    save(KEYS.RECENTLY_VIEWED, []);
    save(KEYS.SETTINGS, this.settings);
    save(KEYS.AUDIT_LOGS, this.auditLogs);
    notify();
    return true;
  }
}

export const appStore = new AppStore();
