import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@mantine/core';
import {
  IconHeart,
  IconHeartFilled,
  IconArrowUpRight,
  IconLock,
  IconSparkles,
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { pinService } from '../../services/pinService';
import PinMenu from './PinMenu';
import SaveToBoardModal from '../boards/SaveToBoardModal';

function formatHost(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace('www.', '');
  } catch (e) {
    return 'link';
  }
}

export default function PinCard({ pin, onLikeToggle, onDelete, onOpenModal }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(pin.is_liked || false);
  const [likesCount, setLikesCount] = useState(pin.likes_count || 0);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savedBoardName, setSavedBoardName] = useState(pin.board_name || null);

  const isAuthorOrAdmin = user && (user.id === pin.user_id || user.role === 'admin');

  const authorName =
    pin.author_name ||
    pin.user?.full_name ||
    pin.user_data?.full_name ||
    pin.username ||
    pin.user?.username ||
    pin.user_data?.username ||
    'Creator';

  const authorAvatar =
    pin.author_avatar ||
    pin.user?.avatar_url ||
    pin.user_data?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  const handleSavedToBoard = (board) => {
    setIsLiked(true);
    setSavedBoardName(board.name);
    setLikesCount((prev) => (isLiked ? prev : prev + 1));
    if (onLikeToggle) {
      onLikeToggle(pin.id, true);
    }
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    setSaveModalOpen(true);
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    try {
      await pinService.toggleLike(pin.id);
    } catch (err) {
      console.warn('Like toggle failed:', err);
    }
    if (onLikeToggle) {
      onLikeToggle(pin.id, nextLiked);
    }
  };

  const handleClick = (e) => {
    try {
      pinService.recordPinView(pin.id);
    } catch (err) {
      // ignore
    }
    if (onOpenModal) {
      if (e) e.stopPropagation();
      onOpenModal(pin);
    } else {
      navigate(`/pins/${pin.id}`);
    }
  };

  return (
    <div
      className="masonry-item group cursor-pointer transition-transform duration-200 active:scale-[0.99]"
      onClick={handleClick}
    >
      {/* Visual Image Container */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-slate-800 shadow-2xs hover:shadow-xl transition-all duration-300 ring-1 ring-slate-200/60 dark:ring-slate-800/80">
        {/* Private Pin Status (Only shown if private, keeps public feed completely clean) */}
        {pin.is_private && (
          <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 text-[10px] font-bold flex items-center gap-1 shadow-xs border border-amber-400/25 pointer-events-none">
            <IconLock size={11} stroke={2.5} /> Only Me
          </div>
        )}

        {/* Infographic Guide Badge */}
        {pin.is_infographic && !pin.is_private && (
          <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md border border-orange-400/40 pointer-events-none">
            <IconSparkles size={11} stroke={2.5} /> UI/UX Guide
          </div>
        )}

        {/* Hover / Focus Overlay (Desktop) */}
        <div className="hidden sm:flex absolute inset-0 z-20 p-3 flex-col justify-between bg-gradient-to-b from-black/40 via-transparent to-black/60 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none">
          {/* Top Right: One-Click Save Button */}
          <div className="flex justify-end pointer-events-auto">
            <button
              type="button"
              onClick={handleSaveClick}
              className={`px-4 py-2 rounded-full font-black text-xs shadow-md transition-all active:scale-90 flex items-center gap-1.5 cursor-pointer select-none ${
                isLiked
                  ? 'bg-slate-900/90 text-white dark:bg-white dark:text-slate-900 backdrop-blur-xs'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-[0_4px_14px_rgba(230,0,35,0.45)]'
              }`}
              aria-label={isLiked ? 'Saved' : 'Save'}
            >
              <IconHeartFilled size={13} className={isLiked ? 'text-rose-500' : 'text-white'} />
              <span>{isLiked ? (savedBoardName || 'Saved') : 'Save'}</span>
            </button>
          </div>

          {/* Bottom Controls: Source Link & Options Menu */}
          <div className="flex items-center justify-between gap-2 pointer-events-auto">
            {pin.destination_url ? (
              <a
                href={pin.destination_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-900 text-xs font-bold backdrop-blur-md shadow-sm transition-transform active:scale-95 truncate max-w-[150px]"
                title={pin.destination_url}
              >
                <IconArrowUpRight size={12} stroke={2.5} className="shrink-0 text-slate-500" />
                <span className="truncate">{formatHost(pin.destination_url)}</span>
              </a>
            ) : (
              <div />
            )}

            <div className="shrink-0">
              <PinMenu
                pin={pin}
                onDelete={onDelete}
                isAuthorOrAdmin={isAuthorOrAdmin}
              />
            </div>
          </div>
        </div>

        {/* Mobile Touch Action Bar: clean floating buttons directly accessible without hover */}
        <div className="sm:hidden absolute inset-x-0 bottom-0 z-20 p-2 flex items-center justify-between pointer-events-none bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          {pin.destination_url ? (
            <a
              href={pin.destination_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 text-slate-900 text-[11px] font-bold backdrop-blur-md shadow-xs truncate max-w-[110px]"
              title={pin.destination_url}
            >
              <IconArrowUpRight size={11} stroke={2.5} className="shrink-0 text-slate-500" />
              <span className="truncate">{formatHost(pin.destination_url)}</span>
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={handleSaveClick}
              className={`px-3 py-1.5 rounded-full font-black text-xs shadow-md transition-all active:scale-90 flex items-center gap-1 cursor-pointer select-none ${
                isLiked
                  ? 'bg-slate-900/90 text-white dark:bg-white dark:text-slate-900 backdrop-blur-xs'
                  : 'bg-brand-600 active:bg-brand-700 text-white'
              }`}
              aria-label={isLiked ? 'Saved' : 'Save'}
            >
              <IconHeartFilled size={12} className={isLiked ? 'text-rose-500' : 'text-white'} />
              <span>{isLiked ? (savedBoardName || 'Saved') : 'Save'}</span>
            </button>
            <PinMenu
              pin={pin}
              onDelete={onDelete}
              isAuthorOrAdmin={isAuthorOrAdmin}
            />
          </div>
        </div>

        {/* Pin Image */}
        <img
          src={pin.image_url}
          alt={pin.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600';
          }}
          className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] block"
        />
      </div>

      {/* Clean Pin Details Below Image */}
      <div className="pt-2.5 pb-1 px-1 space-y-1">
        {/* Full Title (2 lines max, never truncated to 4 letters) */}
        <h3 className="text-xs sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {pin.title}
        </h3>

        {/* Author Info & Heart Like Action */}
        <div className="flex items-center justify-between pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (pin.user_id) {
                navigate(`/profile/${pin.user_id}`);
              }
            }}
            className="flex items-center gap-1.5 min-w-0 group/author cursor-pointer text-left focus:outline-none"
            title={`Visit ${pin.author_name || pin.username}'s profile`}
          >
            <Avatar
              src={authorAvatar}
              size={20}
              radius="xl"
              className="ring-1 ring-slate-200 dark:ring-slate-700 group-hover/author:ring-brand-500 transition-all shrink-0"
              alt={authorName}
            />
            <span className="truncate font-medium text-slate-600 dark:text-slate-400 group-hover/author:text-slate-900 dark:group-hover/author:text-white transition-colors text-[11.5px] leading-tight">
              {authorName}
            </span>
          </button>

          {/* 1-Tap Heart Button & Counter */}
          <button
            type="button"
            onClick={handleLikeClick}
            className={`flex items-center gap-1 text-xs font-bold transition-all active:scale-75 cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${
              isLiked
                ? 'text-brand-600 dark:text-brand-500'
                : 'text-slate-400 hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand-400'
            }`}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            {isLiked ? (
              <IconHeartFilled size={14} className="text-brand-600" />
            ) : (
              <IconHeart size={14} stroke={2} />
            )}
            {likesCount > 0 && <span className="text-[11px] font-bold">{likesCount}</span>}
          </button>
        </div>
      </div>

      {/* Save to Board Modal */}
      {saveModalOpen && (
        <SaveToBoardModal
          opened={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          pin={pin}
          onSaved={handleSavedToBoard}
        />
      )}
    </div>
  );
}
