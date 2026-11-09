import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  IconPin,
  IconBookmark,
  IconHeart,
  IconShare,
  IconShield,
  IconUsers,
  IconArrowLeft,
  IconCheck,
  IconCamera,
  IconLogout,
  IconPencil,
  IconEdit,
} from '@tabler/icons-react';
import { Modal } from '@mantine/core';
import PinGrid from '../../components/pins/PinGrid';
import PinDetails from '../../components/pins/PinDetails';
import BoardCard from '../../components/boards/BoardCard';
import Loading from '../../components/common/Loading';
import AvatarPicker from '../../components/common/AvatarPicker';
import FriendShareCircle from '../../components/common/FriendShareCircle';
import LogoutConfirmModal from '../../components/common/LogoutConfirmModal';
import { userService } from '../../services/userService';
import { friendService } from '../../services/friendService';
import { appStore } from '../../services/store';
import { useAuth } from '../../hooks/useAuth';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { toast } from '../../context/ToastContext';

// 3D Desk Support & Creator Illustration for Top Banner (Adaptive for Light & Dark mode)
function BannerIllustration() {
  return (
    <div className="hidden sm:flex items-end justify-end pointer-events-none select-none shrink-0 pr-2">
      <svg
        width="160"
        height="95"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-xs"
      >
        <defs>
          <linearGradient id="laptopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="100%" stopColor="#FDBA74" />
          </linearGradient>
        </defs>

        {/* Desk Surface */}
        <path d="M10 115 H195" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" opacity="0.4" />

        {/* Plant on Desk */}
        <rect x="168" y="98" width="14" height="14" rx="3" fill="#64748B" />
        <circle cx="175" cy="92" r="6" fill="#10B981" />
        <circle cx="171" cy="94" r="5" fill="#34D399" />
        <circle cx="179" cy="94" r="4.5" fill="#059669" />

        {/* Laptop Base & Screen */}
        <path d="M108 114 L152 114" stroke="url(#laptopGrad)" strokeWidth="4" strokeLinecap="round" />
        <polygon points="112,112 148,112 144,82 116,82" fill="url(#laptopGrad)" />
        <polygon points="115,110 145,110 142,85 118,85" fill="url(#screenGrad)" />
        <circle cx="130" cy="97" r="3" fill="#FFFFFF" opacity="0.9" />

        {/* Avatar Figure */}
        <path
          d="M62 115 C62 90, 72 82, 88 82 C104 82, 114 90, 114 115 Z"
          fill="url(#suitGrad)"
        />
        <polygon points="84,82 92,82 88,92" fill="#FFFFFF" />
        <rect x="83" y="68" width="10" height="16" rx="4" fill="url(#skinGrad)" />
        <ellipse cx="88" cy="52" rx="15" ry="18" fill="url(#skinGrad)" />

        {/* Hair */}
        <path
          d="M72 52 C71 35, 84 28, 98 32 C104 35, 105 45, 104 56 C100 48, 92 48, 88 48 C80 48, 75 50, 72 52 Z"
          fill="url(#hairGrad)"
        />
        <path d="M72 52 C68 58, 67 70, 72 75 C74 72, 74 62, 75 55 Z" fill="url(#hairGrad)" />

        {/* Eyes & smile */}
        <ellipse cx="84" cy="52" rx="1.8" ry="2" fill="#1E293B" />
        <ellipse cx="93" cy="52" rx="1.8" ry="2" fill="#1E293B" />
        <path d="M86 58 Q88 61 91 58" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Headset with Mic */}
        <path
          d="M73 48 C72 32, 104 32, 103 48"
          stroke="#1E293B"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="71" y="46" width="4.5" height="9" rx="2" fill="#38BDF8" />
        <rect x="101" y="46" width="4.5" height="9" rx="2" fill="#38BDF8" />
        <path d="M73 54 Q75 62 84 62" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <circle cx="85" cy="62" r="2" fill="#38BDF8" />

        {/* Arm / Hands on Keyboard */}
        <path d="M102 96 Q112 108 122 110" stroke="url(#suitGrad)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="122" cy="110" r="3.5" fill="url(#skinGrad)" />
      </svg>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const validTabs = ['created', 'saved', 'boards', 'friends'];

  // Forward legacy /profile?tab=categories to standalone /categories page
  useEffect(() => {
    if (tabParam === 'categories') {
      navigate('/categories', { replace: true });
    }
  }, [tabParam, navigate]);

  const { user: currentUser, setUser, logout } = useAuth();
  const targetId = id ? Number(id) : currentUser?.id || 2;
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false);
    logout();
    navigate('/', { replace: true });
    toast.info('You have logged out successfully.');
  };

  const [profile, setProfile] = useState(null);
  const [savedPins, setSavedPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'created'
  );
  const [selectedPin, setSelectedPin] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: 'Mathew',
    last_name: 'Anderson',
    full_name: 'Mathew Anderson',
    email: 'mathew.anderson@gmail.com',
    phone: '(347) 528-1947',
    position: 'Team Leader',
    location: 'United States',
    province: 'San Diego, California, United States',
    pin_code: '92101',
    zip: '30303',
    federal_tax_no: 'GA45273910',
    bio: '',
    avatar_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [isFriendInCircle, setIsFriendInCircle] = useState(false);

  // Safe reference-counted body scroll lock when Edit Profile modal is actively open
  useBodyScrollLock(editModalOpen);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setEditModalOpen(false);
      }
    };
    if (editModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [editModalOpen]);

  const isOwner = currentUser && currentUser.id === targetId;

  useEffect(() => {
    async function loadUserProfile() {
      setLoading(true);
      try {
        const data = await userService.getProfile(targetId);
        const allPins = appStore.getPins() || [];
        const friendsList = await friendService.getFriends();
        const safeFriends = Array.isArray(friendsList) ? friendsList : [];
        setIsFriendInCircle(safeFriends.some((f) => (f.friend_id || f.id) === targetId));
        setProfile(data);
        setSavedPins(allPins.filter((p) => p.is_liked));

        const fullName = data.full_name || data.username || 'Sarah Jenkins';
        const parts = fullName.trim().split(' ');
        const fName = data.first_name || parts[0] || 'Sarah';
        const lName = data.last_name || parts.slice(1).join(' ') || (parts.length === 1 ? 'Jenkins' : '');

        setEditForm({
          first_name: fName,
          last_name: lName,
          full_name: fullName,
          email: data.email || 'sarah.jenkins@pinboard.dev',
          phone: data.phone || '(347) 528-1947',
          position: data.position || (data.role === 'admin' ? 'Team Leader / Admin' : 'Team Leader'),
          location: data.location || 'United States',
          province: data.province || 'San Diego, California, United States',
          pin_code: data.pin_code || '92101',
          zip: data.zip || '30303',
          federal_tax_no: data.federal_tax_no || 'GA45273910',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUserProfile();
  }, [targetId]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const combinedName = `${editForm.first_name || ''} ${editForm.last_name || ''}`.trim() || editForm.full_name;
      const payload = {
        ...editForm,
        full_name: combinedName,
      };
      const updated = await userService.updateProfile(payload);
      setProfile((prev) => ({ ...prev, ...payload, ...updated }));
      if (isOwner) {
        setUser((prev) => ({ ...prev, ...payload, ...updated }));
      }
      toast.success('Profile information updated successfully!');
      setEditModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard!');
    }
  };

  // Sync tab with URL search parameter
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && validTabs.includes(currentTab)) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    });
  };

  if (loading) return <Loading message="Loading profile..." />;
  if (!profile) return <div className="text-center py-20 text-slate-500 font-semibold">User not found</div>;

  // Extracted user values matching project theme & reference design
  const fullName = profile.full_name || profile.username || 'Sarah Jenkins';
  const nameParts = fullName.trim().split(' ');
  const firstName = profile.first_name || nameParts[0] || 'Sarah';
  const lastName = profile.last_name || nameParts.slice(1).join(' ') || (nameParts.length === 1 ? 'Jenkins' : '');
  const email = profile.email || 'sarah.jenkins@pinboard.dev';
  const phone = profile.phone || '(347) 528-1947';
  const position = profile.position || (profile.role === 'admin' ? 'Team Leader / Admin' : 'Team Leader');
  const location = profile.location || 'United States';
  const province = profile.province || 'San Diego, California, United States';
  const pinCode = profile.pin_code || '92101';
  const zip = profile.zip || '30303';
  const federalTaxNo = profile.federal_tax_no || 'GA45273910';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32 pt-2 px-3 sm:px-4">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BANNER: Clean, beautiful card adaptive to light & dark */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex items-center justify-between transition-colors duration-200">
        <div className="z-10 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            User Profile
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Home
            </Link>
            <span>•</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Userprofile</span>
          </div>
        </div>

        {/* 3D Customer Support / Desk Illustration */}
        <BannerIllustration />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PROFILE SUMMARY CARD (Clean white in light mode, sleek dark) */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200">
        {/* Left: Avatar + Title Details */}
        <div className="flex items-center gap-4">
          <div
            className={`relative group shrink-0 ${isOwner ? 'cursor-pointer' : ''}`}
            onClick={isOwner ? () => setEditModalOpen(true) : undefined}
            title={isOwner ? 'Click to change photo' : undefined}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={fullName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-3 ring-slate-100 dark:ring-slate-800 shadow-sm transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl sm:text-2xl font-black ring-3 ring-slate-100 dark:ring-slate-800 shadow-sm transition-transform duration-200 group-hover:scale-105">
                {(fullName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {isOwner && (
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 transition-all cursor-pointer"
                title="Change photo"
              >
                <IconCamera size={14} stroke={2.4} />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {fullName}
            </h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{position}</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>{location}</span>
            </div>
          </div>
        </div>

        {/* Right: Clean Action Buttons (NO social media icons) */}
        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          {!isOwner && (
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <IconArrowLeft size={15} />
              <span>Back to My Profile</span>
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <IconPencil size={14} />
              <span>Edit Profile</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShareProfile}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
            title="Share Profile Link"
          >
            <IconShare size={15} />
            <span>Share</span>
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200/80 dark:border-rose-900/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
              title="Log Out"
            >
              <IconLogout size={15} />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. TWO SIDE-BY-SIDE INFORMATION CARDS: Personal & Address     */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* CARD A: PERSONAL INFORMATION */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
              Personal Information
            </h3>

            <div className="grid grid-cols-2 gap-y-6 gap-x-5">
              {/* First Name */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  First Name
                </p>
                <p className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {firstName}
                </p>
              </div>

              {/* Last Name */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Last Name
                </p>
                <p className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {lastName}
                </p>
              </div>

              {/* Email */}
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Email
                </p>
                <p className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 mt-1 truncate" title={email}>
                  {email}
                </p>
              </div>

              {/* Phone */}
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Phone
                </p>
                <p className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {phone}
                </p>
              </div>

              {/* Position */}
              <div className="col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Position
                </p>
                <p className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {position}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Right Edit Button */}
          {isOwner && (
            <div className="flex justify-end mt-8 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-xs hover:shadow-md shadow-brand-600/20 transition-all cursor-pointer"
              >
                <IconPencil size={13} stroke={2.5} />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>

        {/* CARD B: ADDRESS DETAILS */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
              Address Details
            </h3>

            <div className="grid grid-cols-2 gap-y-6 gap-x-5">
              {/* Location */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Location
                </p>
                <p className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {location}
                </p>
              </div>

              {/* Province / State */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Province / State
                </p>
                <p className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 mt-1 leading-tight">
                  {province}
                </p>
              </div>

              {/* PIN Code */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  PIN Code
                </p>
                <p className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                  {pinCode}
                </p>
              </div>

              {/* ZIP */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  ZIP
                </p>
                <p className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                  {zip}
                </p>
              </div>

              {/* Federal Tax No. */}
              <div className="col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Federal Tax No.
                </p>
                <p className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                  {federalTaxNo}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Right Edit Button */}
          {isOwner && (
            <div className="flex justify-end mt-8 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-xs hover:shadow-md shadow-brand-600/20 transition-all cursor-pointer"
              >
                <IconPencil size={13} stroke={2.5} />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. PINBOARD CONTENT TABS (Created, Saved, Boards, Friends)    */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-center gap-4 sm:gap-7 text-xs sm:text-sm font-bold max-w-2xl mx-auto overflow-x-auto no-scrollbar px-2 mb-6">
          <button
            type="button"
            onClick={() => handleTabChange('created')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all duration-150 cursor-pointer whitespace-nowrap ${
              activeTab === 'created'
                ? 'border-brand-600 text-brand-600 dark:border-rose-400 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <IconPin size={16} />
            <span>Created ({profile.pins?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('saved')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all duration-150 cursor-pointer whitespace-nowrap ${
              activeTab === 'saved'
                ? 'border-brand-600 text-brand-600 dark:border-rose-400 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <IconHeart size={16} />
            <span>Saved ({savedPins.length})</span>
          </button>

          {profile.role !== 'admin' && (
            <button
              type="button"
              onClick={() => handleTabChange('boards')}
              className={`pb-3 border-b-2 flex items-center gap-2 transition-all duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === 'boards'
                  ? 'border-brand-600 text-brand-600 dark:border-rose-400 dark:text-rose-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <IconBookmark size={16} />
              <span>Boards ({profile.boards?.length || 0})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleTabChange('friends')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all duration-150 cursor-pointer whitespace-nowrap ${
              activeTab === 'friends'
                ? 'border-brand-600 text-brand-600 dark:border-rose-400 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <IconUsers size={16} />
            <span>Friends Circle (5)</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="min-h-[300px]">
          {activeTab === 'boards' && (
            <div>
              {profile.boards && profile.boards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {profile.boards.map((board) => (
                    <BoardCard key={board.id} board={board} isOwner={isOwner} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
                  No boards curated yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <PinGrid
              pins={savedPins}
              onOpenModal={(pin) => setSelectedPin(pin)}
              emptyTitle="No saved ideas yet"
              emptyDescription="Explore feed and click Save on pins to organize your favorite inspiration."
            />
          )}

          {activeTab === 'created' && (
            <PinGrid
              pins={profile.pins || []}
              onOpenModal={(pin) => setSelectedPin(pin)}
              emptyTitle="No pins published yet"
              emptyDescription="Create a new pin to showcase your aesthetic inspiration here."
            />
          )}

          {activeTab === 'friends' && (
            <div className="max-w-4xl mx-auto pt-2">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
                <FriendShareCircle
                  title={isOwner ? 'Your 5-Friend Private Circle' : `${fullName}'s Shared Friends`}
                  subtitle="Private visual sharing with up to 5 friends. Click any friend to visit their real account."
                  showManagement={isOwner}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. EDIT PROFILE MODAL (Updates Personal & Address info)      */}
      {/* ------------------------------------------------------------- */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-modal-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setEditModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-10">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 h-9 rounded-full text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/90 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs active:scale-90 transition-all cursor-pointer shrink-0"
                aria-label="Back to profile"
              >
                <IconArrowLeft size={16} stroke={2.8} />
                <span>Back</span>
              </button>

              <h3 id="edit-profile-modal-title" className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight text-center truncate px-2">
                Edit User Information
              </h3>

              <div className="w-[72px] shrink-0 pointer-events-none" aria-hidden="true" />
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateProfile} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 modal-scrollbar">
                {/* Avatar Picker */}
                <AvatarPicker
                  variant="centered"
                  value={editForm.avatar_url}
                  onChange={(newUrl) => setEditForm({ ...editForm, avatar_url: newUrl })}
                  name={editForm.full_name}
                  label="Profile Photo"
                  size={80}
                />

                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      required
                      placeholder="e.g. Sarah"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      required
                      placeholder="e.g. Jenkins"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                      placeholder="e.g. name@gmail.com"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="e.g. (347) 528-1947"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Position / Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Position / Role
                  </label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    placeholder="e.g. Team Leader"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                {/* Location & Province / State */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Location / Country
                    </label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="e.g. United States"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Province / State
                    </label>
                    <input
                      type="text"
                      value={editForm.province}
                      onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                      placeholder="e.g. San Diego, California"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* PIN Code & ZIP */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      value={editForm.pin_code}
                      onChange={(e) => setEditForm({ ...editForm, pin_code: e.target.value })}
                      placeholder="e.g. 92101"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={editForm.zip}
                      onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                      placeholder="e.g. 30303"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Federal Tax No. */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Federal Tax No. / Account ID
                  </label>
                  <input
                    type="text"
                    value={editForm.federal_tax_no}
                    onChange={(e) => setEditForm({ ...editForm, federal_tax_no: e.target.value })}
                    placeholder="e.g. GA45273910"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={2}
                    placeholder="Write a brief intro..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 px-4 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900 backdrop-blur-md flex items-center gap-3 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="h-11 px-6 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-11 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/25 hover:shadow-lg hover:shadow-brand-600/35 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={16} stroke={2.8} />
                      <span>Save Information</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        opened={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Smooth Inline Modal for Pin Details */}
      <Modal
        opened={!!selectedPin}
        onClose={() => setSelectedPin(null)}
        size="72rem"
        radius="2xl"
        padding="lg"
        yOffset="2rem"
        withCloseButton={false}
        overlayProps={{
          backgroundOpacity: 0.65,
          blur: 4,
        }}
        classNames={{
          content: 'bg-transparent shadow-none',
          body: 'p-0',
        }}
      >
        {selectedPin && (
          <div className="relative">
            <PinDetails
              pin={selectedPin}
              isModal={true}
              onClose={() => setSelectedPin(null)}
              onDelete={() => {
                setSelectedPin(null);
                loadProfile();
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
