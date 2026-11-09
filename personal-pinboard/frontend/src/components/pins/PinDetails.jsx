import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  ActionIcon,
  Badge,
  Tooltip,
  Rating,
  Textarea,
} from '@mantine/core';
import {
  IconHeart,
  IconHeartFilled,
  IconArrowUpRight,
  IconBookmark,
  IconArrowLeft,
  IconEye,
  IconStarFilled,
  IconMessageCircle,
  IconFlag,
  IconTrash,
  IconEdit,
  IconCheck,
  IconSend,
  IconX,
  IconLock,
  IconVideo,
  IconFileText,
  IconBulb,
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { pinService } from '../../services/pinService';
import { formatDate } from '../../utils/formatDate';
import PinMenu from './PinMenu';
import ReportDialog from '../common/ReportDialog';
import SaveToBoardModal from '../boards/SaveToBoardModal';
import { toast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { detectPinTopic } from '../../utils/topicDetector';
import UiUxDesignerCard from '../common/UiUxDesignerCard';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export default function PinDetails({ pin, onDelete, isModal = false, onClose }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const ratingsEnabled = settings?.enable_ratings ?? true;
  const commentsEnabled = settings?.enable_comments ?? true;

  const [isLiked, setIsLiked] = useState(pin.is_liked || false);
  const [likesCount, setLikesCount] = useState(pin.likes_count || 0);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [currentBoardName, setCurrentBoardName] = useState(pin.board_name || null);
  const [currentBoardId, setCurrentBoardId] = useState(pin.board_id || null);

  const topic = detectPinTopic(pin);
  const TopicIcon = topic.icon;

  // Ratings State
  const [userRating, setUserRating] = useState(pin.user_rating || 0);
  const [ratingAvg, setRatingAvg] = useState(pin.rating_avg || 4.8);
  const [ratingsCount, setRatingsCount] = useState(pin.ratings_count || 24);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  // Comments State
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Report Dialog State
  const [reportOpen, setReportOpen] = useState(false);
  const [infographicViewMode, setInfographicViewMode] = useState('interactive');

  const isAuthorOrAdmin = user && (user.id === pin.user_id || user.role === 'admin');

  useEffect(() => {
    loadComments();
    try {
      if (pin?.id) {
        pinService.recordPinView(pin.id);
      }
    } catch (err) {
      // ignore
    }
  }, [pin.id]);

  // Safe reference-counted body scroll lock when rendered as modal
  useBodyScrollLock(isModal);

  const loadComments = async () => {
    try {
      const data = await pinService.getComments(pin.id);
      setComments(data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleSavedToBoard = (board) => {
    setIsLiked(true);
    setCurrentBoardId(board.id);
    setCurrentBoardName(board.name);
    setLikesCount((prev) => (isLiked ? prev : prev + 1));
    toast.success(`Saved to board "${board.name}"!`);
  };

  const handleLike = async () => {
    // Open board selector directly for Pinterest-style saving
    setSaveModalOpen(true);
  };

  const handleRateChange = async (score) => {
    if (!ratingsEnabled) {
      toast.info('Pin ratings are currently disabled by platform policy.');
      return;
    }
    setUserRating(score);
    setIsRatingLoading(true);
    try {
      const res = await pinService.ratePin(pin.id, score, user?.id || 2);
      if (res) {
        setRatingAvg(res.rating_avg);
        setRatingsCount(res.ratings_count);
        toast.success(`Rated ${score} stars! Thank you for rating.`);
      }
    } catch (err) {
      console.error('Failed to rate pin:', err);
    } finally {
      setIsRatingLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentsEnabled) {
      toast.info('Public commenting is currently disabled by platform policy.');
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await pinService.addComment(pin.id, {
        content: commentText.trim(),
        rating: ratingsEnabled ? commentRating : null,
        user: user || {
          id: 2,
          username: 'explorer',
          full_name: 'Pinboard Explorer',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        },
      });
      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
      toast.success('Comment posted successfully!');
    } catch (err) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      await pinService.updateComment(pin.id, commentId, { content: editContent.trim() });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: editContent.trim() } : c))
      );
      setEditingCommentId(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to edit comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await pinService.deleteComment(pin.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const categoryTitle =
    pin.category_name ||
    (typeof pin.category === 'object' && pin.category?.name ? pin.category.name : null) ||
    (typeof pin.category_data === 'object' && pin.category_data?.name ? pin.category_data.name : null);

  const authorName =
    pin.author_name ||
    pin.user?.full_name ||
    pin.user_data?.full_name ||
    pin.username ||
    pin.user?.username ||
    'Creator';

  const authorUsername =
    pin.username ||
    pin.user?.username ||
    pin.user_data?.username ||
    'user';

  const authorAvatar =
    pin.author_avatar ||
    pin.user?.avatar_url ||
    pin.user_data?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  return (
    <div className={`max-w-5xl mx-auto space-y-6 ${isModal ? 'p-1 sm:p-2 pb-16' : 'pb-16'}`}>
      {/* Top Navigation Row: Back Button & Category Breadcrumb */}
      <div className="flex items-center justify-between">
        {isModal ? (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Pin Details
            </span>
          </div>
        ) : (
          <button
            onClick={() => navigate('/pins')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 hover:border-brand-300 transition-all cursor-pointer group"
          >
            <IconArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Pins</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          {pin.is_private && (
            <Badge color="yellow" variant="light" size="md" className="font-semibold shadow-2xs">
              <span className="flex items-center gap-1">
                <IconLock size={12} /> Secret (Private)
              </span>
            </Badge>
          )}
          {/* Dynamic Topic Badge with Icon depending on what the blog talks/writes about */}
          <Badge
            color="gray"
            variant="light"
            size="md"
            className="font-bold shadow-2xs border border-slate-200 dark:border-slate-700"
            leftSection={<TopicIcon size={13} stroke={2.6} className="text-brand-600 dark:text-brand-400" />}
          >
            {topic.label}
          </Badge>
          {categoryTitle && (
            <Link
              to={`/pins?category=${pin.category_id || ''}`}
              onClick={() => {
                if (isModal && onClose) onClose();
              }}
            >
              <Badge color="red" variant="light" size="md" className="font-semibold cursor-pointer hover:opacity-85">
                {categoryTitle}
              </Badge>
            </Link>
          )}
          {isModal && onClose && (
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="xl"
              size="md"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              aria-label="Close modal"
            >
              <IconX size={18} />
            </ActionIcon>
          )}
        </div>
      </div>

      {/* Main Pin Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left: High-Res Image Showcase */}
        {pin.is_infographic && pin.infographic_type === 'ui_ux_designer' ? (
          <div className="md:col-span-6 bg-slate-950/95 flex flex-col items-center justify-start p-3 sm:p-5 min-h-[360px] overflow-y-auto max-h-[78vh] modal-scrollbar">
            {/* View Mode Toggle */}
            <div className="w-full flex items-center justify-between gap-2 mb-3 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 pl-2">Display Mode</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setInfographicViewMode('interactive')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    infographicViewMode === 'interactive'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Interactive UI
                </button>
                <button
                  type="button"
                  onClick={() => setInfographicViewMode('photo')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    infographicViewMode === 'photo'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Reference Photo
                </button>
              </div>
            </div>

            {infographicViewMode === 'interactive' ? (
              <div className="w-full py-1">
                <UiUxDesignerCard />
              </div>
            ) : (
              <img
                src={pin.image_url}
                alt={pin.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/ui-ux-designer-ref.png';
                }}
                className="w-full h-auto max-h-[70vh] object-contain rounded-2xl shadow-lg ring-1 ring-white/10"
              />
            )}
          </div>
        ) : (
          <div className="md:col-span-6 bg-slate-950 flex items-center justify-center p-2 sm:p-4 min-h-[300px]">
            <img
              src={pin.image_url}
              alt={pin.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';
              }}
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl shadow-xs"
            />
          </div>
        )}

        {/* Right: Pin Metadata, Rating, & Actions */}
        <div className="md:col-span-6 p-4 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Top Action Bar */}
            <div className="flex items-center justify-between gap-2 pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800 mb-4 sm:mb-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <PinMenu
                  pin={pin}
                  onDelete={onDelete}
                  isAuthorOrAdmin={isAuthorOrAdmin}
                />
                {pin.destination_url && (
                  <a
                    href={pin.destination_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
                  >
                    <span className="hidden sm:inline">Visit Source</span>
                    <span className="sm:hidden">Source</span>
                    <IconArrowUpRight size={13} />
                  </a>
                )}
                {!isAuthorOrAdmin && (
                  <Tooltip label="Report pin" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      radius="xl"
                      size="md"
                      onClick={() => setReportOpen(true)}
                      className="text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800"
                    >
                      <IconFlag size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  color="brandRed"
                  radius="xl"
                  size="sm"
                  leftSection={isLiked ? <IconHeartFilled size={15} /> : <IconHeart size={15} />}
                  onClick={() => setSaveModalOpen(true)}
                  className="bg-brand-600 hover:bg-brand-700 shadow-sm transition-transform active:scale-95 font-bold"
                >
                  <span className="hidden sm:inline">
                    {isLiked ? (currentBoardName ? `Saved to ${currentBoardName}` : 'Saved') : 'Save to Board'}
                  </span>
                  <span className="sm:hidden">
                    {isLiked ? 'Saved' : 'Save'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Board Link */}
            {currentBoardName && (
              <div className="mb-3">
                <Link
                  to={`/pins?board=${currentBoardId || ''}`}
                  onClick={() => {
                    if (isModal && onClose) onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <IconBookmark size={13} />
                  <span>Board: {currentBoardName}</span>
                </Link>
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-3">
              {pin.title}
            </h1>

            {/* Description */}
            {pin.description && (
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 whitespace-pre-line">
                {pin.description}
              </p>
            )}

            {/* Interactive Rating Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {Number(ratingAvg).toFixed(1)}
                  </span>
                  <div className="flex text-amber-500">
                    <IconStarFilled size={16} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    ({ratingsCount} {ratingsCount === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {ratingsEnabled
                    ? (userRating ? `Your rating: ${userRating} stars` : 'Rate this pin below')
                    : 'Pin rating submissions are temporarily closed'}
                </p>
              </div>

              {ratingsEnabled ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Rate:</span>
                  <Rating
                    value={userRating}
                    onChange={handleRateChange}
                    color="yellow"
                    size="md"
                  />
                </div>
              ) : (
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Ratings disabled by policy
                </span>
              )}
            </div>

            {/* Author Profile Bar */}
            <Link
              to={`/profile/${pin.user_id}`}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-colors mb-6 shadow-2xs"
            >
              <Avatar
                src={authorAvatar}
                alt={authorName}
                size="md"
                radius="xl"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug truncate">
                  {authorName}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">@{authorUsername}</p>
              </div>
            </Link>

            {/* Tags Pills */}
            {pin.tags && pin.tags.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pin.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="light"
                      color="red"
                      size="sm"
                      className="font-semibold"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Metrics */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <IconEye size={15} /> {pin.views_count || 0} visual impressions
            </span>
            <span>Added {formatDate(pin.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Conversation-Style Comments Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <IconMessageCircle size={20} className="text-brand-600" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Comments ({comments.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Discussion & Feedback</span>
        </div>

        {/* Add Comment Form or Policy Disabled Notice */}
        {!commentsEnabled ? (
          <div className="mb-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center space-y-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Public Commentary Disabled
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              New comment submissions are currently turned off by platform policy. Existing discussion is shown below.
            </p>
          </div>
        ) : (
          <form onSubmit={handleAddComment} className="mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <Avatar
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.full_name || 'User'}
                radius="xl"
                size="md"
              />
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Share your thoughts or resource notes on this pin..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.currentTarget.value)}
                  minRows={2}
                  radius="md"
                  required
                />

                <div className="flex items-center justify-between flex-wrap gap-2">
                  {ratingsEnabled ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">Rating:</span>
                      <Rating
                        value={commentRating}
                        onChange={setCommentRating}
                        color="yellow"
                        size="sm"
                      />
                    </div>
                  ) : (
                    <div />
                  )}

                  <Button
                    type="submit"
                    color="brandRed"
                    radius="xl"
                    size="sm"
                    leftSection={<IconSend size={14} />}
                    loading={isSubmittingComment}
                    className="bg-brand-600 hover:bg-brand-700 font-bold"
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Comments Conversation List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No comments yet</p>
              <p className="text-xs text-slate-400">Be the first to leave feedback on this pin!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isOwnComment = user && (user.id === comment.user_id || user.role === 'admin');
              const isEditing = editingCommentId === comment.id;
              const commentUserAvatar =
                comment.user_avatar ||
                comment.user?.avatar_url ||
                comment.user_data?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
              const commentUserName =
                comment.user_name ||
                comment.user?.full_name ||
                comment.user_data?.full_name ||
                comment.username ||
                comment.user?.username ||
                'User';

              return (
                <div
                  key={comment.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700/80 hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-200 space-y-2 group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={commentUserAvatar}
                        alt={commentUserName}
                        radius="xl"
                        size="sm"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {commentUserName}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-2">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {comment.rating && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                          <IconStarFilled size={11} /> {comment.rating}
                        </div>
                      )}

                      {isOwnComment && !isEditing && (
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            color="gray"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditContent(comment.content);
                            }}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            color="red"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.currentTarget.value)}
                        minRows={2}
                        radius="md"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="default"
                          size="xs"
                          radius="xl"
                          onClick={() => setEditingCommentId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="brandRed"
                          size="xs"
                          radius="xl"
                          className="bg-brand-600 hover:bg-brand-700"
                          onClick={() => handleUpdateComment(comment.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed pl-0 sm:pl-10">
                      "{comment.content}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportDialog
        opened={reportOpen}
        onClose={() => setReportOpen(false)}
        pin={pin}
      />

      {/* Save to Board Modal */}
      <SaveToBoardModal
        opened={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        pin={pin}
        onSaved={handleSavedToBoard}
      />
    </div>
  );
}
