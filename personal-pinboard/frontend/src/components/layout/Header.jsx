import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Avatar, Button, ActionIcon, Badge, Group, Indicator } from '@mantine/core';
import {
  IconPin,
  IconPlus,
  IconUser,
  IconBookmark,
  IconLogout,
  IconShield,
  IconMenu2,
  IconBell,
  IconSettings,
  IconHeart,
  IconMessageCircle,
  IconStar,
  IconSearch,
  IconX,
  IconSun,
  IconMoon,
  IconArrowLeft,
  IconCheck,
  IconTrash,
  IconUsers,
  IconUserPlus,
  IconClock,
  IconSparkles,
  IconFolderPlus,
  IconFlame,
  IconArrowRight,
  IconLogin,
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { appStore } from '../../services/store';
import SearchInput from '../common/SearchInput';
import GlobalSearchModal from '../common/GlobalSearchModal';
import ThemeToggle from '../common/ThemeToggle';
import AuthModal from '../common/AuthModal';
import LogoutConfirmModal from '../common/LogoutConfirmModal';
import SearchUserModal from '../common/SearchUserModal';
import ReturnToLandingModal from '../common/ReturnToLandingModal';
import { toast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';

export default function Header({ onToggleSidebar }) {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { theme, isDark, toggleTheme } = useTheme();
  const isGuest = user?.username === 'explorer' || !user?.id;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [searchUserModalOpen, setSearchUserModalOpen] = useState(false);
  const [returnToLandingOpen, setReturnToLandingOpen] = useState(false);

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false);
    logout();
    navigate('/', { replace: true });
    toast.info('You have logged out successfully.');
  };

  const [notifications, setNotifications] = useState(() => appStore.getNotifications());

  React.useEffect(() => {
    const handleUpdate = () => {
      setNotifications(appStore.getNotifications());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('pinboard-store-update', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('pinboard-store-update', handleUpdate);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const [notifFilter, setNotifFilter] = useState('all'); // 'all' | 'unread'

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    const updated = appStore.markAllNotificationsAsRead();
    setNotifications(updated);
    toast.success('All marked as read');
  };

  const handleClearAllNotifications = (e) => {
    e.stopPropagation();
    const updated = appStore.clearNotifications();
    setNotifications(updated);
    toast.info('Notifications cleared');
  };

  const handleDismissNotification = (e, id) => {
    e.stopPropagation();
    const updated = appStore.removeNotification(id);
    setNotifications(updated);
  };

  const handleNotificationClick = (item) => {
    appStore.markNotificationAsRead(item.id);
    setNotifications(appStore.getNotifications());
    if (item.link) {
      navigate(item.link);
    }
  };

  const getNotificationConfig = (item) => {
    const type = item?.type || '';
    const title = (item?.title || '').toLowerCase();

    if (type === 'friend' || title.includes('friend') || title.includes('sharing circle')) {
      return {
        icon: IconUsers,
        label: 'Circle',
        color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-900/50',
        badge: 'bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300',
      };
    }
    if (type === 'save' || title.includes('saved') || title.includes('board')) {
      return {
        icon: IconBookmark,
        label: 'Board',
        color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-900/50',
        badge: 'bg-amber-100/90 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300',
      };
    }
    if (type === 'like' || title.includes('liked')) {
      return {
        icon: IconHeart,
        label: 'Liked',
        color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/70 dark:border-rose-900/50',
        badge: 'bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300',
      };
    }
    if (type === 'comment' || title.includes('comment')) {
      return {
        icon: IconMessageCircle,
        label: 'Comment',
        color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200/70 dark:border-sky-900/50',
        badge: 'bg-sky-100/90 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300',
      };
    }
    if (type === 'pin' || title.includes('pin')) {
      return {
        icon: IconPin,
        label: 'Pin',
        color: 'text-brand-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/70 dark:border-rose-900/50',
        badge: 'bg-rose-100/90 dark:bg-rose-950/80 text-brand-700 dark:text-rose-300',
      };
    }
    return {
      icon: IconSparkles,
      label: 'Activity',
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-900/50',
      badge: 'bg-indigo-100/90 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300',
    };
  };

  const renderFormattedTitle = (title) => {
    if (!title) return null;
    const parts = title.split(/(@[a-zA-Z0-9_]+|"[^"]+")/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className="font-bold text-slate-900 dark:text-white bg-slate-100/90 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-[11px] inline-block mx-0.5 border border-slate-200/60 dark:border-slate-700/60"
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('"') && part.endsWith('"')) {
        return (
          <span key={i} className="font-bold text-slate-900 dark:text-white">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const desktopSearchRef = useRef(null);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [recentDesktopSearches, setRecentDesktopSearches] = useState(() => {
    try {
      const stored = localStorage.getItem('pinboard_recent_searches_v2');
      return stored ? JSON.parse(stored) : ['Architecture', 'UI Design', 'Minimal'];
    } catch {
      return ['Architecture', 'UI Design'];
    }
  });
  const [allPins, setAllPins] = useState(() => appStore.getPins() || []);

  useEffect(() => {
    const handlePinsUpdate = () => {
      setAllPins(appStore.getPins() || []);
    };
    window.addEventListener('storage', handlePinsUpdate);
    window.addEventListener('pinboard-store-update', handlePinsUpdate);
    return () => {
      window.removeEventListener('storage', handlePinsUpdate);
      window.removeEventListener('pinboard-store-update', handlePinsUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target)) {
        setDesktopSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveDesktopRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentDesktopSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    setRecentDesktopSearches(updated);
    try {
      localStorage.setItem('pinboard_recent_searches_v2', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleRemoveRecentSearch = (e, termToRemove) => {
    e.stopPropagation();
    const updated = recentDesktopSearches.filter((s) => s.toLowerCase() !== termToRemove.toLowerCase());
    setRecentDesktopSearches(updated);
    try {
      localStorage.setItem('pinboard_recent_searches_v2', JSON.stringify(updated));
    } catch (err) {}
  };

  const handleClearRecentSearches = (e) => {
    e.stopPropagation();
    setRecentDesktopSearches([]);
    try {
      localStorage.removeItem('pinboard_recent_searches_v2');
    } catch (err) {}
  };

  const handleExecuteDesktopSearch = (term) => {
    const finalTerm = term !== undefined ? term : searchTerm;
    if (!finalTerm || !finalTerm.trim()) return;
    const clean = finalTerm.trim();
    saveDesktopRecentSearch(clean);
    setDesktopSearchOpen(false);
    setSearchTerm(clean);
    navigate(`/pins?search=${encodeURIComponent(clean)}`);
  };

  const handleDesktopKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      handleExecuteDesktopSearch();
    } else if (e.key === 'Escape') {
      setDesktopSearchOpen(false);
    }
  };

  const desktopTrimmed = searchTerm.trim().toLowerCase();
  const desktopMatchingPins = desktopTrimmed
    ? allPins
        .filter((p) => {
          const title = (p.title || '').toLowerCase();
          const desc = (p.description || '').toLowerCase();
          const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
          return title.includes(desktopTrimmed) || desc.includes(desktopTrimmed) || tags.includes(desktopTrimmed);
        })
        .slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 flex items-center shadow-2xs transition-colors duration-200">
      <div className="flex items-center justify-between gap-2.5 sm:gap-4 max-w-7xl w-full mx-auto">

        {/* Left: Mobile Sidebar Drawer Toggle & Clean Brand Mark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            data-sidebar-toggle="true"
            aria-label="Toggle navigation drawer"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs active:scale-90 transition-all cursor-pointer md:hidden shrink-0"
          >
            <IconMenu2 size={19} stroke={2.5} />
          </button>

          <button
            type="button"
            onClick={() => setReturnToLandingOpen(true)}
            className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer select-none text-left bg-transparent border-0 p-0"
            title="Return to Landing Page"
            aria-label="Return to landing page"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30 ring-2 ring-brand-500/20 group-hover:scale-105 group-active:scale-95 transition-all duration-200 shrink-0">
              <IconPin size={23} stroke={2.6} className="text-white shrink-0" />
            </div>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center leading-none">
              Pinboard<span className="text-brand-600">.</span>
            </span>
            {location.pathname.startsWith('/admin') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/80 dark:border-brand-900/60 shadow-2xs shrink-0">
                <IconShield size={10} stroke={2.5} />
                Admin
              </span>
            )}
          </button>
        </div>

        {/* Center: Large Centered Search Bar with Autocomplete Dropdown (Desktop & Tablet) */}
        <div className="flex-1 max-w-2xl mx-2 hidden sm:block relative" ref={desktopSearchRef} onKeyDown={handleDesktopKeyDown}>
          <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              if (!desktopSearchOpen) setDesktopSearchOpen(true);
            }}
            onFocus={() => setDesktopSearchOpen(true)}
            onClear={() => setSearchTerm('')}
            placeholder="Search pins, ideas, boards..."
            size="md"
          />

          {/* Desktop Autocomplete Popover */}
          {desktopSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3),0_0_1px_1px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] p-4 sm:p-5 z-50 animate-in fade-in zoom-in-[0.98] duration-150 space-y-4 max-h-[440px] overflow-y-auto modal-scrollbar">
              {desktopTrimmed.length === 0 ? (
                <>
                  {/* Recent Searches */}
                  {recentDesktopSearches.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <IconClock size={13} stroke={2.4} />
                          Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={handleClearRecentSearches}
                          className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                        >
                          <IconTrash size={11} stroke={2} />
                          <span>Clear all</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentDesktopSearches.map((term) => (
                          <div
                            key={term}
                            onClick={() => handleExecuteDesktopSearch(term)}
                            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/60 dark:border-slate-700/60 shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none active:scale-95"
                          >
                            <IconClock size={12} className="text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
                            <span>{term}</span>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveRecentSearch(e, term)}
                              aria-label={`Remove ${term}`}
                              className="w-3.5 h-3.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors ml-0.5"
                            >
                              <IconX size={9} stroke={2.8} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentDesktopSearches.length > 0 && (
                    <div className="h-px bg-slate-100 dark:border-t dark:border-slate-800/80 my-1" />
                  )}

                  {/* Trending Topics */}
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <IconFlame size={13} stroke={2.4} className="text-amber-500" />
                      Trending on Pinboard
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Architecture', tag: 'Architecture', icon: '🏛️' },
                        { name: 'UI Design', tag: 'UI Design', icon: '🎨' },
                        { name: 'Minimalist', tag: 'Minimal', icon: '🌿' },
                        { name: 'Photography', tag: 'Photography', icon: '📸' },
                        { name: 'Modern Art', tag: 'Art', icon: '🖌️' },
                        { name: 'Interior', tag: 'Interior', icon: '🛋️' },
                        { name: 'Coffee & Cafes', tag: 'Coffee', icon: '☕' },
                        { name: 'Technology', tag: 'Tech', icon: '💻' },
                      ].map((topic) => (
                        <button
                          key={topic.name}
                          type="button"
                          onClick={() => handleExecuteDesktopSearch(topic.tag)}
                          className="px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-rose-50/70 dark:hover:bg-rose-950/30 hover:border-brand-500/40 hover:text-brand-600 dark:hover:text-brand-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                        >
                          <span className="text-sm">{topic.icon}</span>
                          <span>{topic.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Live Matching Pins */
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/90">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Matches for <span className="font-bold text-slate-900 dark:text-white">"{searchTerm}"</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExecuteDesktopSearch()}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 cursor-pointer transition-colors group"
                    >
                      <span>View all</span>
                      <IconArrowRight size={13} stroke={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {desktopMatchingPins.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      {desktopMatchingPins.map((pin) => (
                        <div
                          key={pin.id}
                          onClick={() => {
                            saveDesktopRecentSearch(pin.title || 'Pin');
                            setDesktopSearchOpen(false);
                            navigate(`/pins/${pin.id}`);
                          }}
                          className="p-2 rounded-2xl hover:bg-slate-100/90 dark:hover:bg-slate-800/80 flex items-center gap-3 transition-colors cursor-pointer group border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60"
                        >
                          {pin.image_url ? (
                            <img
                              src={pin.image_url}
                              alt={pin.title || 'Pin'}
                              className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200/50 dark:border-slate-700/50">
                              <IconPin size={18} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {pin.title || 'Untitled Pin'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {pin.category_name && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                                  {pin.category_name}
                                </span>
                              )}
                              {pin.author?.full_name && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                  by {pin.author.full_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-7 h-7 rounded-full bg-transparent group-hover:bg-brand-50 dark:group-hover:bg-brand-950/50 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors shrink-0">
                            <IconArrowRight size={14} stroke={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-7 px-4 text-center space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
                        <IconSearch size={18} stroke={2} />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No instant matches found for "{searchTerm}"
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Press Enter to search across all visual pins and boards.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleExecuteDesktopSearch()}
                    className="w-full py-2.5 px-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    <IconSearch size={14} stroke={2.5} />
                    <span>Search everywhere for "{searchTerm}"</span>
                  </button>
                </div>
              )}

              {/* Footer Shortcut Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 select-none">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-medium">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-semibold shadow-2xs">Enter</kbd>
                    <span>to search</span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-semibold shadow-2xs">Esc</kbd>
                    <span>to close</span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Pinboard Search
                </span>
              </div>
            </div>
          )}
        </div>

          {/* Right: Search Trigger, Theme Switcher, Notifications, Create & Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Clickable Admin Portal indicator */}
            {user?.role === 'admin' && (
              <Link to="/admin" title="Open Admin Portal">
                <Badge
                  variant="filled"
                  color="red"
                  size="sm"
                  leftSection={<IconShield size={12} />}
                  className="bg-brand-600 hover:bg-brand-700 font-bold uppercase tracking-wider shadow-xs hidden lg:inline-flex cursor-pointer transition-colors"
                >
                  Admin Portal
                </Badge>
              </Link>
            )}

            {/* Mobile Search Trigger Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Search pins"
              className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs active:scale-90 transition-all cursor-pointer"
            >
              <IconSearch size={18} stroke={2.5} />
            </button>

            {/* Dark / Light Theme Toggle (Visible on tablet/desktop, accessible via Avatar on mobile) */}
            <div className="hidden sm:inline-flex">
              <ThemeToggle />
            </div>

          {isAuthenticated ? (
            <>
              {/* Redesigned Clean Notifications Center */}
              <Menu shadow="2xl" width="auto" position="bottom-end" radius="2xl" offset={8}>
                <Menu.Target>
                  <Indicator
                    disabled={unreadCount === 0}
                    label={unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined}
                    color="red"
                    size={15}
                    offset={2}
                    withBorder
                  >
                    <button
                      type="button"
                      aria-label="Notifications"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs active:scale-90 transition-all cursor-pointer"
                    >
                      <IconBell size={18} stroke={2.4} />
                    </button>
                  </Indicator>
                </Menu.Target>

                <Menu.Dropdown className="p-0 overflow-hidden w-[calc(100vw-24px)] sm:w-[410px] md:w-[430px] max-w-[430px] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25),0_0_1px_rgba(0,0,0,0.1)] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
                  {/* Top Bar Header */}
                  <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/80">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
                          Notifications
                        </h3>
                        {unreadCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-brand-600 text-white shadow-2xs">
                            {unreadCount} new
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/40">
                            <IconCheck size={11} stroke={2.6} /> All caught up
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-brand-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer active:scale-95"
                        >
                          <IconCheck size={13} stroke={2.5} />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    {/* Filter Pills & Clear All */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => setNotifFilter('all')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            notifFilter === 'all'
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          All ({notifications.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifFilter('unread')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            notifFilter === 'unread'
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Unread ({unreadCount})
                        </button>
                      </div>

                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllNotifications}
                          className="text-[11px] font-bold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer flex items-center gap-1"
                          title="Clear all notifications"
                        >
                          <IconTrash size={12} stroke={2.2} />
                          <span>Clear all</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/90 dark:divide-slate-800/60 modal-scrollbar p-1.5">
                    {notifications.filter((n) => (notifFilter === 'unread' ? !n.is_read : true)).length === 0 ? (
                      <div className="py-12 px-6 text-center">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                          {notifFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                          {notifFilter === 'unread'
                            ? "You've read all your notifications. Great job staying up to date!"
                            : 'Pins, board saves, and friend circle updates will show up here.'}
                        </p>
                      </div>
                    ) : (
                      notifications
                        .filter((n) => (notifFilter === 'unread' ? !n.is_read : true))
                        .map((n) => {
                          const config = getNotificationConfig(n);
                          const Icon = config.icon;
                          const isUnread = !n.is_read;

                          return (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`group relative p-3 rounded-2xl mx-1 my-1 transition-all duration-200 cursor-pointer flex items-start gap-3 border ${
                                isUnread
                                  ? 'bg-rose-50/35 dark:bg-rose-950/15 border-rose-200/60 dark:border-rose-900/30 hover:bg-rose-50/70 dark:hover:bg-rose-950/30'
                                  : 'bg-transparent border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                              }`}
                            >
                              {/* Icon Badge */}
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${config.color}`}>
                                <Icon size={17} stroke={2.3} />
                              </div>

                              {/* Text & Meta */}
                              <div className="flex-1 min-w-0 pr-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${config.badge}`}>
                                    {config.label}
                                  </span>
                                  <span className="text-[10.5px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                    <IconClock size={10} stroke={2} />
                                    {n.time || 'Recently'}
                                  </span>
                                </div>
                                <div className={`text-xs leading-relaxed ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                  {renderFormattedTitle(n.title)}
                                </div>
                              </div>

                              {/* Right Action: Unread Dot + Dismiss X on Hover */}
                              <div className="flex items-center gap-1.5 shrink-0 self-center">
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-brand-600 ring-4 ring-rose-500/20" title="Unread" />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleDismissNotification(e, n.id)}
                                  aria-label="Dismiss notification"
                                  className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                                  title="Dismiss"
                                >
                                  <IconX size={13} stroke={2.4} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Clean Footer Bar */}
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between text-xs">
                    <Link
                      to="/settings"
                      className="text-[11.5px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <IconSettings size={13} stroke={2.2} />
                      <span>Notification Preferences</span>
                    </Link>
                    <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500">
                      Live Feed
                    </span>
                  </div>
                </Menu.Dropdown>
              </Menu>

              {/* Create Pin Button: Desktop & Tablet Only (Hidden for Admin accounts) */}
              {!isAdmin && (
                <Link to="/pins/create" className="hidden sm:inline-flex">
                  <Button
                    leftSection={<IconPlus size={18} stroke={2.5} />}
                    color="brandRed"
                    radius="xl"
                    size="sm"
                    className="bg-brand-600 hover:bg-brand-700 shadow-sm font-bold"
                  >
                    Create
                  </Button>
                </Link>
              )}

              {/* User Avatar Menu */}
              <Menu shadow="lg" width={isGuest ? 280 : 230} position="bottom-end">
                <Menu.Target>
                  <button
                    type="button"
                    aria-label="User profile menu"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-slate-200/90 dark:ring-slate-700 hover:ring-brand-500/50 dark:hover:ring-brand-400/50 focus:ring-brand-500 transition-all cursor-pointer active:scale-90 flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-2xs"
                  >
                    <Avatar
                      src={user?.avatar_url || undefined}
                      alt={user?.full_name || 'User'}
                      radius="xl"
                      size={36}
                      color="brandRed"
                      className="w-full h-full object-cover font-bold"
                    >
                      {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                  </button>
                </Menu.Target>

                <Menu.Dropdown className="p-1 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {user?.full_name || user?.username}
                      </span>
                      {isGuest && (
                        <Badge size="xs" color="grape" variant="light" radius="sm">
                          Explorer
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user?.email && !user.email.includes('@pinboard.local') ? user.email : 'chhivtyy16@gmail.com'}
                    </p>
                  </div>

                  {/* Explorer prompt card: Sign up free or Log in */}
                  {isGuest && (
                    <div className="p-3 m-1.5 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/90 border border-rose-100/80 dark:border-slate-700">
                      <p className="text-xs font-black text-slate-900 dark:text-white">Don't have an account?</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 mb-2.5 leading-snug">
                        Sign up free to save your pins, custom boards, and favorites forever.
                      </p>
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          className="w-full flex items-center justify-center h-8 rounded-full bg-brand-600 hover:bg-[#c9001f] text-white font-bold text-xs shadow-xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                          onClick={() => {
                            setAuthMode('register');
                            setAuthOpen(true);
                          }}
                        >
                          Sign up free
                        </button>
                        <button
                          type="button"
                          className="group w-full flex items-center justify-center gap-2 h-8 px-3 rounded-full bg-white dark:bg-slate-800 hover:bg-rose-50/50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/60 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-rose-400 font-bold text-xs shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all duration-200 cursor-pointer"
                          onClick={() => {
                            setAuthMode('login');
                            setAuthOpen(true);
                          }}
                        >
                          <IconLogin size={13} stroke={2.4} className="text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-rose-400 transition-colors" />
                          <span>Log in to existing account</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Theme Switcher Item in Avatar Menu */}
                  <Menu.Item
                    leftSection={isDark ? <IconSun size={16} className="text-amber-500" /> : <IconMoon size={16} className="text-slate-600 dark:text-slate-400" />}
                    onClick={toggleTheme}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>Appearance</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium capitalize">{theme}</span>
                    </div>
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconUser size={16} />}
                    onClick={() => navigate(`/profile/${user?.id || 2}`)}
                  >
                    My Profile
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconSearch size={16} className="text-brand-600" />}
                    onClick={() => setSearchUserModalOpen(true)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>Search Users</span>
                      <span className="text-[10px] text-slate-400 font-medium">by Username</span>
                    </div>
                  </Menu.Item>

                  {user?.role !== 'admin' && (
                    <Menu.Item
                      leftSection={<IconBookmark size={16} />}
                      onClick={() => navigate('/boards')}
                    >
                      My Boards
                    </Menu.Item>
                  )}

                  <Menu.Item
                    leftSection={<IconSettings size={16} />}
                    onClick={() => navigate('/settings')}
                  >
                    Account Settings
                  </Menu.Item>

                  {user?.role === 'admin' && (
                    <Menu.Item
                      leftSection={<IconShield size={16} className="text-brand-600" />}
                      onClick={() => navigate('/admin')}
                      className="font-semibold text-brand-600"
                    >
                      Admin Dashboard
                    </Menu.Item>
                  )}

                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={16} />}
                    onClick={() => setLogoutConfirmOpen(true)}
                    className="font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                  >
                    {isGuest ? 'Log out of Explorer' : 'Logout'}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthOpen(true);
                }}
                className="flex items-center justify-center h-9 px-3.5 sm:px-4 rounded-full bg-slate-100/90 hover:bg-slate-200/90 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.1] font-bold text-xs sm:text-sm shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthOpen(true);
                }}
                className="flex items-center justify-center h-9 px-3.5 sm:px-4 rounded-full bg-gradient-to-r from-brand-600 to-rose-600 hover:from-brand-700 hover:to-rose-700 active:bg-brand-800 text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm shadow-brand-600/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Immersive Mobile & Universal Search Overlay */}
      <GlobalSearchModal
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        initialQuery={searchTerm}
      />

      <AuthModal
        opened={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        redirectTo="/pins"
      />

      {/* Logout Confirmation Verification Dialog */}
      <LogoutConfirmModal
        opened={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Search User by Username Modal */}
      <SearchUserModal
        opened={searchUserModalOpen}
        onClose={() => setSearchUserModalOpen(false)}
      />

      {/* Return to Landing Page Modal: Stay Logged In vs Log Out Decision */}
      <ReturnToLandingModal
        opened={returnToLandingOpen}
        onClose={() => setReturnToLandingOpen(false)}
      />
    </header>
  );
}
