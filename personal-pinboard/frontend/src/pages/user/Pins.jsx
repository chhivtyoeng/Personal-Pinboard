import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Modal, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconPlus, IconUsers } from '@tabler/icons-react';
import PinFilters from '../../components/pins/PinFilters';
import PinGrid from '../../components/pins/PinGrid';
import PinDetails from '../../components/pins/PinDetails';
import { pinService } from '../../services/pinService';
import { categoryService } from '../../services/categoryService';
import { boardService } from '../../services/boardService';

export default function Pins() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pins, setPins] = useState([]);
  const [categories, setCategories] = useState([]);
  const [boardInfo, setBoardInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState(null);

  const currentCategory = searchParams.get('category') ? Number(searchParams.get('category')) : null;
  const currentSearch = searchParams.get('search') || '';
  const currentTag = searchParams.get('tag') || '';
  const currentBoard = searchParams.get('board') ? Number(searchParams.get('board')) : null;
  const currentType = searchParams.get('type') || 'all';
  const currentPrivacy = searchParams.get('privacy') || 'all';
  const isRecentlyViewed = searchParams.get('recent') === 'true';
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (currentBoard) {
      boardService.getBoardById(currentBoard).then(setBoardInfo).catch(() => setBoardInfo(null));
    } else {
      setBoardInfo(null);
    }
  }, [currentBoard]);

  useEffect(() => {
    async function fetchFilteredPins() {
      setLoading(true);
      try {
        const data = await pinService.getAllPins({
          search: currentSearch,
          categoryId: currentCategory,
          tag: currentTag,
          boardId: currentBoard,
          type: currentType,
          privacy: currentPrivacy,
          recentlyViewed: isRecentlyViewed,
        });

        // Apply client sort
        const rawData = Array.isArray(data) ? data : (data?.pins || []);
        let sorted = [...rawData];
        if (sortBy === 'popular') {
          sorted.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        } else if (sortBy === 'views') {
          sorted.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
        } else {
          sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        }

        setPins(sorted);
      } catch (err) {
        console.error('Error fetching pins:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFilteredPins();
  }, [currentCategory, currentSearch, currentTag, currentBoard, currentType, currentPrivacy, isRecentlyViewed, sortBy]);

  const handleCategorySelect = (catId) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('recent');
    if (catId) {
      newParams.set('category', String(catId));
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleTypeSelect = (type) => {
    const newParams = new URLSearchParams(searchParams);
    if (type && type !== 'all') {
      newParams.set('type', type);
    } else {
      newParams.delete('type');
    }
    setSearchParams(newParams);
  };

  const handlePrivacySelect = (privacy) => {
    const newParams = new URLSearchParams(searchParams);
    if (privacy && privacy !== 'all') {
      newParams.set('privacy', privacy);
    } else {
      newParams.delete('privacy');
    }
    setSearchParams(newParams);
  };

  const handleToggleRecentlyViewed = () => {
    const newParams = new URLSearchParams(searchParams);
    if (isRecentlyViewed) {
      newParams.delete('recent');
    } else {
      newParams.set('recent', 'true');
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleDeletePin = (deletedId) => {
    setPins((prev) => prev.filter((p) => p.id !== deletedId));
  };

  return (
    <div className="space-y-6">
      {/* Board Collection Header Banner */}
      {currentBoard && (
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 dark:bg-slate-800 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Curated Board</span>
              {boardInfo?.is_private && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold">
                  Secret Board
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {boardInfo?.name || 'Board Collection'}
            </h1>
            {boardInfo?.description && (
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                {boardInfo.description}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {pins.length} {pins.length === 1 ? 'pin' : 'pins'} collected in this board
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/boards"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-xs transition-colors"
            >
              <IconArrowLeft size={14} /> My Boards
            </Link>
            <button
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('board');
                setSearchParams(newParams);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              View All Pins
            </button>
          </div>
        </div>
      )}

      {/* Category, Type, Privacy filter bar and sort options */}
      <PinFilters
        categories={categories}
        selectedCategory={currentCategory}
        onSelectCategory={handleCategorySelect}
        selectedType={currentType}
        onSelectType={handleTypeSelect}
        selectedPrivacy={currentPrivacy}
        onSelectPrivacy={handlePrivacySelect}
        isRecentlyViewed={isRecentlyViewed}
        onToggleRecentlyViewed={handleToggleRecentlyViewed}
        sortBy={sortBy}
        onChangeSort={setSortBy}
      />

      {/* Active Filter Indicators */}
      {(currentSearch || currentTag || (currentType && currentType !== 'all') || (currentPrivacy && currentPrivacy !== 'all') || isRecentlyViewed) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pb-2">
          <span>Active filters:</span>
          {isRecentlyViewed && (
            <span className="bg-brand-500 text-white px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 shadow-2xs">
              Recently Viewed Pins
            </span>
          )}
          {currentSearch && (
            <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
              Keyword: "{currentSearch}"
            </span>
          )}
          {currentTag && (
            <span className="bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-full border border-brand-100 dark:border-brand-900/50 font-semibold">
              #{currentTag}
            </span>
          )}
          {currentType && currentType !== 'all' && (
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-full font-semibold capitalize">
              Type: {currentType}
            </span>
          )}
          {currentPrivacy && currentPrivacy !== 'all' && (
            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full font-semibold capitalize">
              Privacy: {currentPrivacy === 'public' ? 'Public' : 'Only Me'}
            </span>
          )}
          <button
            onClick={() => setSearchParams({})}
            className="text-brand-600 hover:underline font-bold ml-1 cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Category Sharing Rule Banner: Tell user they can share only 5 people on 1 category */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-50/70 via-white to-amber-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-rose-100 dark:border-slate-800 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
          <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <IconUsers size={15} />
          </div>
          <span>
            <strong className="font-bold text-slate-900 dark:text-white">Category Collaboration:</strong> You can share each category with up to <span className="font-extrabold text-brand-600 dark:text-brand-400">5 people</span>.
          </span>
        </div>
        <Link
          to="/categories"
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline shrink-0 flex items-center gap-1 cursor-pointer whitespace-nowrap group"
        >
          <span>View Categories</span>
          <IconArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Masonry Pin Grid */}
      <PinGrid
        pins={pins}
        loading={loading}
        onDelete={handleDeletePin}
        onOpenModal={(pin) => setSelectedPin(pin)}
        emptyTitle="No matching pins found"
        emptyDescription="We couldn't find any pins matching your current filter. Try selecting a different category or clearing search keywords."
      />

      {/* Floating Action Button: ＋ Create Pin (Desktop only, mobile has bottom nav center FAB) */}
      <div className="fixed bottom-8 right-8 z-40 hidden sm:block">
        <Tooltip label="Save a new pin" position="left" withArrow>
          <button
            onClick={() => navigate('/pins/create')}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-black text-sm shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 active:scale-95 cursor-pointer group"
            aria-label="Create Pin"
          >
            <IconPlus
              size={20}
              stroke={3}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
            <span>Create Pin</span>
          </button>
        </Tooltip>
      </div>

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
              onDelete={handleDeletePin}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
