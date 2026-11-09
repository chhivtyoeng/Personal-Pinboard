import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  IconHome,
  IconCompass,
  IconHeart,
  IconFolder,
  IconCategory,
  IconSettings,
  IconShield,
  IconUsers,
  IconFlag,
  IconPlus,
  IconX,
  IconUser,
  IconLogout,
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { appStore } from '../../services/store';
import { userService } from '../../services/userService';
import LogoutConfirmModal from '../common/LogoutConfirmModal';
import { toast } from '../../context/ToastContext';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const mobileDrawerRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false);
    if (onClose) onClose();
    logout();
    navigate('/', { replace: true });
    toast.info('You have logged out successfully.');
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Auto-close whenever user navigates or selects any route on mobile
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [location.pathname, location.search]);

  // 2. Click outside, touch outside, or Escape key to slide back in
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideInteraction = (e) => {
      // If clicking inside the drawer, do not close
      if (mobileDrawerRef.current && mobileDrawerRef.current.contains(e.target)) {
        return;
      }
      // If clicking the hamburger button, ignore here as it handles toggle
      const isMenuToggle = e.target.closest('[data-sidebar-toggle="true"]');
      if (isMenuToggle) {
        return;
      }

      if (onClose) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    // Use capture phase so outside clicks/touches are caught immediately
    document.addEventListener('mousedown', handleOutsideInteraction, true);
    document.addEventListener('touchstart', handleOutsideInteraction, { capture: true, passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction, true);
      document.removeEventListener('touchstart', handleOutsideInteraction, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Safe reference-counted body scroll lock when mobile sidebar is open
  useBodyScrollLock(isOpen);

  const [counts, setCounts] = useState({
    pins: 0,
    favorites: 0,
    boards: 0,
    categories: 0,
    users: 0,
    reports: 0,
  });

  useEffect(() => {
    let isMounted = true;
    const updateCounts = async () => {
      const allPins = appStore.getPins() || [];
      const allBoards = appStore.getBoards() || [];
      const allCats = appStore.getCategories() || [];
      const allUsers = appStore.getUsers() || [];
      const allReports = appStore.getReports() || [];

      let newCounts = {
        pins: allPins.length,
        favorites: allPins.filter((p) => p.is_liked).length,
        boards: allBoards.length,
        categories: allCats.length,
        users: allUsers.length,
        reports: allReports.length,
      };

      // Set local store counts immediately for instantaneous UI update
      if (isMounted) {
        setCounts(newCounts);
      }

      if (isAdmin) {
        try {
          const stats = await userService.getAdminStats();
          if (stats && isMounted) {
            setCounts((prev) => ({
              ...prev,
              pins: stats.totalPins !== undefined ? stats.totalPins : prev.pins,
              favorites: prev.favorites,
              boards: stats.totalBoards !== undefined ? stats.totalBoards : prev.boards,
              categories: stats.totalCategories !== undefined ? stats.totalCategories : prev.categories,
              users: stats.totalUsers !== undefined ? stats.totalUsers : prev.users,
              reports: stats.totalReports !== undefined ? stats.totalReports : prev.reports,
            }));
          }
        } catch (_) {}
      }
    };

    updateCounts();
    window.addEventListener('focus', updateCounts);
    window.addEventListener('storage', updateCounts);
    window.addEventListener('pinboard-store-update', updateCounts);
    const interval = setInterval(updateCounts, 3000);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', updateCounts);
      window.removeEventListener('storage', updateCounts);
      window.removeEventListener('pinboard-store-update', updateCounts);
      clearInterval(interval);
    };
  }, [isAdmin]);

  const discoverItems = [
    {
      label: 'Home Feed',
      description: 'Your ideas & inspirations',
      icon: IconHome,
      path: '/dashboard',
    },
    {
      label: 'Explore Pins',
      description: 'Search & discover ideas',
      icon: IconCompass,
      path: '/pins',
      count: counts.pins > 0 ? counts.pins : null,
    },
    {
      label: 'Categories & Groups',
      description: 'Personal & group circles',
      icon: IconCategory,
      path: '/categories',
      count: counts.categories > 0 ? counts.categories : null,
    },
  ];

  const collectionItems = [
    {
      label: 'Favorites',
      description: 'Liked inspirations',
      icon: IconHeart,
      path: '/favorites',
      count: counts.favorites > 0 ? counts.favorites : null,
    },
    {
      label: 'My Boards',
      description: 'Curated pin collections',
      icon: IconFolder,
      path: '/boards',
      count: counts.boards > 0 ? counts.boards : null,
    },
    {
      label: 'Settings',
      description: 'Profile & preferences',
      icon: IconSettings,
      path: '/settings',
    },
  ];

  const adminItems = [
    {
      label: 'Admin Overview',
      description: 'Metrics, health & activity',
      icon: IconShield,
      path: '/admin',
      end: true,
    },
    {
      label: 'Manage Users',
      description: 'Accounts, roles & status',
      icon: IconUsers,
      path: '/admin/users',
      count: counts.users !== undefined && counts.users !== null ? counts.users : 0,
      end: true,
    },
    {
      label: 'Moderate Pins',
      description: 'Review, hide & delete content',
      icon: IconCompass,
      path: '/admin/pins',
      count: counts.pins !== undefined && counts.pins !== null ? counts.pins : 0,
      end: true,
    },
    {
      label: 'Categories & Tags',
      description: 'Taxonomy & topic governance',
      icon: IconCategory,
      path: '/admin/categories',
      count: counts.categories !== undefined && counts.categories !== null ? counts.categories : 0,
      end: true,
    },
    {
      label: 'Safety Reports',
      description: 'Flagged pins & violations',
      icon: IconFlag,
      path: '/admin/reports',
      count: counts.reports !== undefined && counts.reports !== null ? counts.reports : 0,
      countColor: 'red',
      end: true,
    },
    {
      label: 'Platform Policies',
      description: 'Settings, logs & policies',
      icon: IconSettings,
      path: '/admin/settings',
      end: true,
    },
  ];

  const renderNavGroup = (title, items, handleItemClick) => (
    <div className="space-y-1">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-1 select-none">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isItemActive = (navLinkActive) => {
            if (item.path === '/admin') {
              return location.pathname === '/admin' || location.pathname === '/admin/';
            }
            return navLinkActive;
          };

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end !== undefined ? item.end : (item.path === '/admin' || item.path === '/dashboard')}
              onClick={handleItemClick}
              className={({ isActive: navLinkActive }) => {
                const active = isItemActive(navLinkActive);
                return `group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 select-none ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white shadow-xs font-bold ring-1 ring-slate-800/10 dark:ring-slate-700/50'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/70'
                }`;
              }}
            >
              {({ isActive: navLinkActive }) => {
                const active = isItemActive(navLinkActive);
                return (
                  <>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        active
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:bg-brand-50 dark:group-hover:bg-slate-700'
                      }`}
                    >
                      <Icon size={17} stroke={active ? 2.5 : 2} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold truncate leading-tight">
                          {item.label}
                        </span>
                        {item.count != null && (
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-1 shrink-0 ${
                              item.countColor === 'red' && item.count > 0
                                ? 'bg-rose-500 text-white shadow-2xs'
                                : active
                                ? 'bg-white/20 text-white dark:bg-slate-700 dark:text-slate-200'
                                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[10.5px] truncate leading-tight mt-0.5 ${
                          active
                            ? 'text-slate-300 dark:text-slate-400 font-medium'
                            : 'text-slate-400 dark:text-slate-500 font-normal'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  // Common Nav Content body for both desktop & mobile
  const renderNavContent = (isMobileView = false) => (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="space-y-4">
        {/* Mobile Header: User Profile with Avatar, Name, Handle & Close Button */}
        {isMobileView && (
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <NavLink
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 min-w-0 flex-1 pr-2 group cursor-pointer"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || user.username || 'User'}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/40 group-hover:scale-105 transition-transform shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center ring-2 ring-brand-500/40 shrink-0 shadow-xs">
                  {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1 text-left">
                <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base truncate block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
                  {user?.full_name || user?.username || 'User'}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate block leading-tight mt-0.5">
                  @{user?.username || 'curator'}
                </span>
              </div>
            </NavLink>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100/90 hover:bg-rose-50 dark:bg-slate-800/90 dark:hover:bg-rose-950/60 text-slate-500 hover:text-brand-600 dark:text-slate-300 dark:hover:text-rose-300 border border-slate-200/80 hover:border-rose-200 dark:border-white/10 dark:hover:border-rose-500/40 shadow-2xs hover:shadow-xs dark:hover:shadow-[0_0_16px_rgba(225,29,72,0.35)] ring-1 ring-inset ring-transparent dark:ring-white/[0.08] transition-all duration-300 cursor-pointer active:scale-90 group shrink-0"
              aria-label="Close menu"
            >
              <IconX size={16} stroke={2.2} className="transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110" />
            </button>
          </div>
        )}

        {/* IF ADMIN: Show Admin Management Tools */}
        {isAdmin ? (
          <div className="space-y-4">
            {/* Management Tools */}
            {renderNavGroup('Management Tools', adminItems, isMobileView ? onClose : undefined)}
          </div>
        ) : (
          /* IF REGULAR USER: Show consumer navigation (Discover & My Collection) */
          <div className="space-y-4">
            {/* Section 1: Discover */}
            {renderNavGroup('Discover', discoverItems, isMobileView ? onClose : undefined)}

            {/* Section 2: Collection */}
            {renderNavGroup('My Collection', collectionItems, isMobileView ? onClose : undefined)}
          </div>
        )}
      </div>

      {/* Footer Area of Sidebar (Desktop Only for Profile Card, avoiding duplicates on mobile) */}
      <div className="pt-2">
        {!isMobileView && isAdmin && (
          /* Desktop Admin Footer: My Profile Shortcut Card */
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/90 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2.5">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'Admin'}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/40 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-black text-xs flex items-center justify-center ring-2 ring-brand-500/40 shrink-0 shadow-xs">
                  {(user?.full_name || user?.username || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {user?.full_name || 'Admin'}
                </p>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                  @{user?.username || 'admin'}
                </p>
              </div>
            </div>
            <NavLink
              to="/profile"
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <IconUser size={14} stroke={2.5} />
              <span>My Profile</span>
            </NavLink>
          </div>
        )}

        {!isAdmin && !isMobileView && (
          /* Desktop User Footer: Quick Save Inspiration Card */
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5.5 h-5.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                <IconPlus size={13} stroke={2.6} />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Save Inspiration</p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Add links, images, and visual ideas.
            </p>
            <NavLink
              to="/pins/create"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <IconPlus size={15} stroke={2.5} />
              Create Pin
            </NavLink>
          </div>
        )}

        {/* Account Log Out Action */}
        {user && (
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="w-full mt-2 flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold transition-all group shrink-0 cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <IconLogout size={13} stroke={2.2} />
            </div>
            <span className="flex-1 text-left truncate">Log Out</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (In-flow column next to main) */}
      <aside className="hidden md:flex flex-col justify-between w-72 shrink-0 sticky top-16 h-[calc(100dvh-4rem)] self-start bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-4 select-none overflow-y-auto modal-scrollbar z-20">
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Fullscreen Slide-out Drawer (Mounted directly via Portal to document.body) */}
      {mounted &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] md:hidden">
            {/* Fullscreen Dimming Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
              }}
              aria-label="Close navigation overlay"
            />

            {/* Slide-out Drawer Sheet with generous safe bottom padding */}
            <aside
              ref={mobileDrawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation"
              className="fixed inset-y-0 left-0 w-[295px] max-w-[85vw] h-full bg-white dark:bg-[#12151D] border-r border-slate-200/90 dark:border-slate-800 p-4 pb-12 flex flex-col justify-between z-[105] shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-y-auto overscroll-contain modal-scrollbar transition-transform duration-300 ease-out animate-in slide-in-from-left"
            >
              {renderNavContent(true)}
            </aside>
          </div>,
          document.body
        )}

      {/* Logout Confirmation Verification Dialog */}
      <LogoutConfirmModal
        opened={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}
