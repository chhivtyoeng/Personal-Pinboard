import React, { useState, useEffect } from 'react';
import { Modal } from '@mantine/core';
import {
  IconUsers,
  IconUser,
  IconCheck,
  IconPhoto,
  IconSparkles,
  IconLock,
  IconX,
} from '@tabler/icons-react';
import { validateCategory } from '../../validators/categoryValidator';
import { friendService } from '../../services/friendService';

const PRESET_COVERS = [
  { label: 'Architecture', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600' },
  { label: 'Art & Design', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600' },
  { label: 'Tech & Setup', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600' },
  { label: 'Photography', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600' },
  { label: 'Fashion & Style', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600' },
  { label: 'Minimalist Interior', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600' },
];

const DEFAULT_INITIAL_DATA = {};

export default function CategoryForm({
  opened,
  onClose,
  onSubmit,
  initialData = DEFAULT_INITIAL_DATA,
  initialType = 'group',
  loading = false,
}) {
  const [type, setType] = useState(initialData?.type || initialType);
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
  const [selectedFriends, setSelectedFriends] = useState(initialData?.members || []);
  const [availableFriends, setAvailableFriends] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (opened) {
      setType(initialData?.type || initialType);
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      setImageUrl(initialData?.image_url || '');
      setSelectedFriends(initialData?.members || []);
      setErrors({});

      // Fetch available friends for group sharing
      async function loadFriends() {
        try {
          const friends = await friendService.getFriends();
          setAvailableFriends(friends || []);
        } catch {
          setAvailableFriends([]);
        }
      }
      loadFriends();
    }
  }, [
    opened,
    initialData?.id,
    initialData?.name,
    initialData?.description,
    initialData?.type,
    initialData?.image_url,
    initialType,
  ]);

  const toggleFriend = (friend) => {
    const isSelected = selectedFriends.some((f) => f.id === friend.id || f.friend_id === friend.id);
    if (isSelected) {
      setSelectedFriends(selectedFriends.filter((f) => f.id !== friend.id && f.friend_id !== friend.id));
    } else {
      if (selectedFriends.length >= 5) return;
      setSelectedFriends([...selectedFriends, {
        id: friend.id || friend.friend_id,
        username: friend.username,
        full_name: friend.full_name,
        avatar_url: friend.avatar_url,
      }]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateCategory({ name });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      image_url: imageUrl.trim() || PRESET_COVERS[0].url,
      type,
      members: type === 'group' ? selectedFriends.slice(0, 5) : [],
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      centered
      size="md"
      radius="28px"
      padding={0}
      styles={{
        content: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
        body: {
          padding: 0,
        },
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden selection:bg-brand-500 selection:text-white max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
              type === 'group'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400'
            }`}>
              {type === 'group' ? <IconUsers size={20} /> : <IconUser size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {initialData.id ? 'Edit Category' : type === 'group' ? 'Create Group Category' : 'Create Personal Category'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {type === 'group' ? 'Share & collaborate with up to 5 friends' : 'Solo collection visible only to you'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5 flex-1 modal-scrollbar min-h-0">
            {/* Category Type Switcher (Personal vs Group) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Category Scope
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setType('group')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    type === 'group'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <IconUsers size={15} />
                  <span>Group Sharing</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('personal')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    type === 'personal'
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <IconLock size={14} />
                  <span>Personal Solo</span>
                </button>
              </div>
            </div>

            {/* Category Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Category Name <span className="text-brand-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder={type === 'group' ? 'e.g. Design Circle, Studio Moodboard' : 'e.g. Minimalist Workspaces'}
                className={`w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border ${
                  errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                } text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium`}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.name}</p>
              )}
            </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Description <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of pins in this category..."
              className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none font-medium"
            />
          </div>

          {/* If Group: Friend Selection / Collaborator Circle */}
          {type === 'group' && (
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <IconUsers size={16} className="text-brand-600 dark:text-rose-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Invite Group Members
                  </span>
                </div>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  selectedFriends.length >= 5
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-brand-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60'
                }`}>
                  {selectedFriends.length}/5 Selected
                </span>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Select up to <strong>5 friends</strong> from your sharing circle to collaborate on this category.
              </p>

              {/* Friends list chips */}
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {availableFriends.length === 0 ? (
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center text-xs text-slate-500">
                    No friends in sharing circle yet. You can still create the group and invite friends anytime!
                  </div>
                ) : (
                  availableFriends.map((friend) => {
                    const isSelected = selectedFriends.some((f) => f.id === friend.id || f.friend_id === friend.id);
                    const isMaxAndNotSelected = selectedFriends.length >= 5 && !isSelected;

                    return (
                      <button
                        key={friend.id}
                        type="button"
                        disabled={isMaxAndNotSelected}
                        onClick={() => toggleFriend(friend)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 border-brand-500 dark:border-rose-500 shadow-2xs'
                            : isMaxAndNotSelected
                            ? 'opacity-45 bg-slate-100/50 dark:bg-slate-800/20 border-transparent cursor-not-allowed'
                            : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {friend.avatar_url ? (
                            <img
                              src={friend.avatar_url}
                              alt={friend.username}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                              {(friend.full_name || friend.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {friend.full_name || friend.username}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              @{friend.username}
                            </p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-brand-600 border-brand-600 text-white shadow-2xs'
                            : 'border-slate-300 dark:border-slate-600 bg-transparent'
                        }`}>
                          {isSelected && <IconCheck size={12} stroke={3} />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Cover Image & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Cover Photo
              </label>
              <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                <IconSparkles size={11} /> Quick Presets
              </span>
            </div>

            {/* Quick preset thumbnail pills */}
            <div className="grid grid-cols-3 gap-1.5 mb-2.5">
              {PRESET_COVERS.map((preset, idx) => {
                const isCurrent = imageUrl === preset.url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`relative h-12 rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                      isCurrent
                        ? 'ring-2 ring-brand-600 border-transparent shadow-2xs'
                        : 'border-slate-200/80 dark:border-slate-700/80 hover:opacity-90'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white tracking-tight px-1 text-center truncate">
                        {preset.label}
                      </span>
                    </div>
                    {isCurrent && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs">
                        <IconCheck size={10} stroke={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom URL input */}
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste a custom image URL..."
              className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Modal Sticky Footer Actions */}
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm shrink-0 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ${
                type === 'group'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-brand-600 hover:bg-brand-700'
              }`}
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  {type === 'group' ? <IconUsers size={14} /> : <IconCheck size={14} />}
                  <span>{initialData?.id ? 'Update Category' : type === 'group' ? 'Create Group Category' : 'Create Personal Category'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
