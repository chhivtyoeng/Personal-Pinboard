import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextInput,
  Textarea,
  PasswordInput,
  Button,
  Avatar,
  Switch,
  Alert,
  Badge,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconUser,
  IconLock,
  IconBell,
  IconCheck,
  IconDeviceFloppy,
  IconShield,
  IconLogout,
} from '@tabler/icons-react';
import PageHeader from '../../components/common/PageHeader';
import AvatarPicker from '../../components/common/AvatarPicker';
import LogoutConfirmModal from '../../components/common/LogoutConfirmModal';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { toast } from '../../context/ToastContext';

export default function Settings() {
  const navigate = useNavigate();
  const { user, login, setUser, logout } = useAuth();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false);
    logout();
    navigate('/', { replace: true });
    toast.info('You have logged out successfully.');
  };

  const [fullName, setFullName] = useState(user?.full_name || 'Pinboard User');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  
  // Sync state if user changes
  useEffect(() => {
    if (user) {
      if (user.full_name) setFullName(user.full_name);
      if (user.bio) setBio(user.bio);
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification preferences
  const [notifyOnLike, setNotifyOnLike] = useState(true);
  const [notifyOnComment, setNotifyOnComment] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await userService.updateProfile({
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
      });
      if (setUser) {
        setUser((prev) => ({
          ...(prev || {}),
          full_name: fullName,
          bio,
          avatar_url: avatarUrl,
        }));
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Current password is required.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please double-check your new password.');
      return;
    }
    setSavingPassword(true);
    try {
      await userService.changePassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully!');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update password.';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate('/dashboard');
          }
        }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 hover:border-brand-300 transition-all cursor-pointer active:scale-95"
      >
        <IconArrowLeft size={16} />
        Back
      </button>

      <PageHeader
        title="Account Settings"
        description="Manage your profile information, password security, and notification preferences."
      />

      {profileSuccess && (
        <Alert
          icon={<IconCheck size={18} />}
          color="teal"
          radius="lg"
          title="Profile Saved"
        >
          Your personal information has been updated successfully.
        </Alert>
      )}

      {/* Profile Details Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <IconUser size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Personal Profile</h3>
            <p className="text-xs text-slate-500">Public details visible on your creator pinboards</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Visual Avatar Chooser (Upload photo from device or pick curated preset, NO URL link needed) */}
          <AvatarPicker
            value={avatarUrl}
            onChange={(newUrl) => setAvatarUrl(newUrl)}
            name={fullName}
            label="Avatar Photo"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Full Name"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.currentTarget.value)}
              radius="md"
              required
            />
            <TextInput
              label="Email Address"
              value={user?.email || 'user@example.com'}
              disabled
              radius="md"
              description="Contact admin to change primary login email"
            />
          </div>

          <Textarea
            label="Bio & Creative Focus"
            placeholder="Tell other curators about your aesthetics and projects..."
            value={bio}
            onChange={(e) => setBio(e.currentTarget.value)}
            minRows={3}
            radius="md"
          />

          <div className="flex sm:justify-end pt-2">
            <Button
              type="submit"
              color="brandRed"
              radius="xl"
              leftSection={<IconDeviceFloppy size={16} />}
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 font-bold h-10 px-6 shadow-xs active:scale-95 transition-transform"
              loading={savingProfile}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      {/* Password & Security */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <IconLock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Account Security</h3>
            <p className="text-xs text-slate-500">Update your account password</p>
          </div>
        </div>

        {passwordSuccess && (
          <Alert icon={<IconCheck size={18} />} color="teal" radius="lg">
            Your password has been changed successfully.
          </Alert>
        )}

        <form onSubmit={handleSavePassword} className="space-y-4">
          <PasswordInput
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.currentTarget.value)}
            radius="md"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordInput
              label="New Password"
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.currentTarget.value)}
              radius="md"
              required
            />
            <PasswordInput
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              radius="md"
              required
            />
          </div>

          <div className="flex sm:justify-end pt-2">
            <Button
              type="submit"
              color="brandRed"
              radius="xl"
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 font-bold h-10 px-6 shadow-xs active:scale-95 transition-transform"
              loading={savingPassword}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <IconBell size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Notifications & Activity</h3>
            <p className="text-xs text-slate-500">Choose when to receive notifications</p>
          </div>
        </div>

        <Switch
          label="Pin Likes & Favorites"
          description="Notify me when another curator saves or favorites one of my pins"
          checked={notifyOnLike}
          onChange={(e) => setNotifyOnLike(e.currentTarget.checked)}
          color="red"
        />

        <Switch
          label="Comments & Discussions"
          description="Notify me when my 5 friends in my circle leave comments or feedback on my content"
          checked={notifyOnComment}
          onChange={(e) => setNotifyOnComment(e.currentTarget.checked)}
          color="red"
        />
      </div>

      {/* Admin Panel Link - Visible only to Administrators */}
      {user?.role === 'admin' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <IconShield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Administrator Access</h3>
              <p className="text-xs text-slate-500">Access platform moderation and admin tools</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <Badge color="red" variant="filled" size="sm" radius="xl" className="mb-1">
                Administrator
              </Badge>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have full access to User Management, Pin Moderation, Reports, Categories, and Analytics.
              </p>
            </div>

            <Link to="/admin" className="w-full sm:w-auto">
              <Button color="brandRed" radius="xl" size="sm" className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 font-bold shrink-0 h-10 px-5 shadow-xs">
                Open Admin Panel
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Session & Logout Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
            <IconLogout size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Account Session</h3>
            <p className="text-xs text-slate-500">Sign out of your account on this device</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Active Login Session</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Logged in as <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.email || user?.username}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 text-xs font-bold transition-colors cursor-pointer shadow-2xs active:scale-95"
          >
            <IconLogout size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Verification Dialog */}
      <LogoutConfirmModal
        opened={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
