import Pin from '../models/Pin.js';
import Board from '../models/Board.js';
import Category from '../models/Category.js';
import Comment from '../models/Comment.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

// @desc    Get all pins with filtering and sorting
// @route   GET /api/pins
// @access  Public / Optional Auth
export const getAllPins = async (req, res, next) => {
  try {
    const pins = await Pin.find(req.query);
    const currentUserId = req.user?.id || req.user?._id;

    const enrichedPins = pins.map((pin) => {
      const pinObj = pin.toObject ? pin.toObject() : { ...pin };
      const isLiked = currentUserId && Array.isArray(pinObj.liked_by)
        ? pinObj.liked_by.some((uid) => String(uid) === String(currentUserId))
        : Boolean(pinObj.is_liked);

      return {
        ...pinObj,
        is_liked: isLiked,
      };
    });

    res.json({
      success: true,
      count: enrichedPins.length,
      data: enrichedPins,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single pin by ID
// @route   GET /api/pins/:id
// @access  Public / Optional Auth
export const getPinById = async (req, res, next) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found',
      });
    }

    // Increment views count
    const views = (pin.views_count || 0) + 1;
    await Pin.findByIdAndUpdate(pin.id || pin._id, { views_count: views });

    const pinObj = pin.toObject ? pin.toObject() : { ...pin };
    pinObj.views_count = views;

    const currentUserId = req.user?.id || req.user?._id;
    if (currentUserId && Array.isArray(pinObj.liked_by)) {
      pinObj.is_liked = pinObj.liked_by.some((uid) => String(uid) === String(currentUserId));
    }

    res.json({
      success: true,
      data: pinObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new pin
// @route   POST /api/pins
// @access  Private
export const createPin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to create a pin',
      });
    }

    const {
      title,
      description,
      image_url,
      destination_url,
      board_id,
      category_id,
      tags,
      type,
      is_private,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pin title is required',
      });
    }

    if (!image_url || !image_url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pin image URL is required',
      });
    }

    // Prevent XSS / malicious URIs
    const cleanImage = image_url.trim();
    if (cleanImage.toLowerCase().startsWith('javascript:')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image URL provided',
      });
    }

    let cleanDest = (destination_url || '').trim();
    if (cleanDest && cleanDest.toLowerCase().startsWith('javascript:')) {
      cleanDest = '';
    }

    const currentUserId = req.user.id || req.user._id;
    const authorUser = req.user;

    let boardName = '';
    if (board_id) {
      const b = await Board.findById(board_id);
      if (b) {
        boardName = b.name;
      }
    }

    let categoryObj = null;
    if (category_id) {
      const c = await Category.findById(category_id);
      if (c) {
        categoryObj = { id: c.id || c._id, name: c.name, slug: c.slug };
      }
    }

    const pin = await Pin.create({
      title: title.trim().slice(0, 255),
      description: (description || '').slice(0, 2000),
      image_url: cleanImage,
      destination_url: cleanDest,
      user_id: currentUserId,
      user: {
        id: authorUser.id || authorUser._id,
        username: authorUser.username,
        full_name: authorUser.full_name,
        avatar_url: authorUser.avatar_url,
        email: authorUser.email,
      },
      board_id: board_id ? Number(board_id) : null,
      board_name: boardName,
      category_id: category_id ? Number(category_id) : null,
      category: categoryObj,
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim().slice(0, 50)).slice(0, 20) : [],
      type: type || 'image',
      is_private: Boolean(is_private),
    });

    // Update board pin count & preview images
    if (board_id) {
      const board = await Board.findById(board_id);
      if (board) {
        const pinIds = Array.isArray(board.pin_ids) ? [...board.pin_ids] : [];
        if (!pinIds.includes(pin.id)) pinIds.push(pin.id);
        const previews = Array.isArray(board.preview_images) ? [...board.preview_images] : [];
        if (!previews.includes(image_url)) previews.unshift(image_url);

        await Board.findByIdAndUpdate(board_id, {
          pins_count: (board.pins_count || 0) + 1,
          cover_image_url: board.cover_image_url || image_url,
          preview_images: previews.slice(0, 4),
          pin_ids: pinIds,
        });
      }
    }

    // Update category pin count
    if (category_id) {
      const cat = await Category.findById(category_id);
      if (cat) {
        await Category.findByIdAndUpdate(category_id, {
          pins_count: (cat.pins_count || 0) + 1,
        });
      }
    }

    // Update user pin count
    await User.findByIdAndUpdate(currentUserId, {
      pins_count: (authorUser.pins_count || 0) + 1,
    });

    res.status(201).json({
      success: true,
      data: pin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update pin
// @route   PUT /api/pins/:id
// @access  Private
export const updatePin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const pin = await Pin.findById(req.params.id);
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found',
      });
    }

    const currentUserId = req.user.id || req.user._id;
    const isAdmin = req.user.role === 'admin' || req.user.username === 'admin';

    if (String(pin.user_id) !== String(currentUserId) && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this pin',
      });
    }

    // Whitelist only editable fields to prevent mass assignment of user_id, likes_count, rating_avg, etc.
    const { title, description, image_url, destination_url, board_id, category_id, tags, is_private } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty',
        });
      }
      updates.title = title.trim().slice(0, 255);
    }

    if (description !== undefined) {
      updates.description = String(description).slice(0, 2000);
    }

    if (image_url !== undefined) {
      const cleanImg = String(image_url).trim();
      if (!cleanImg.toLowerCase().startsWith('javascript:')) {
        updates.image_url = cleanImg;
      }
    }

    if (destination_url !== undefined) {
      const cleanDest = String(destination_url).trim();
      if (!cleanDest.toLowerCase().startsWith('javascript:')) {
        updates.destination_url = cleanDest;
      }
    }

    if (board_id !== undefined) {
      updates.board_id = board_id ? Number(board_id) : null;
    }

    if (category_id !== undefined) {
      updates.category_id = category_id ? Number(category_id) : null;
    }

    if (tags !== undefined && Array.isArray(tags)) {
      updates.tags = tags.map((t) => String(t).trim().slice(0, 50)).slice(0, 20);
    }

    if (is_private !== undefined) {
      updates.is_private = Boolean(is_private);
    }

    const updated = await Pin.findByIdAndUpdate(req.params.id, updates);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete pin
// @route   DELETE /api/pins/:id
// @access  Private
export const deletePin = async (req, res, next) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found',
      });
    }

    const currentUserId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === 'admin' || req.user?.username === 'admin';

    if (String(pin.user_id) !== String(currentUserId) && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this pin',
      });
    }

    await Pin.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ pin_id: req.params.id });

    res.json({
      success: true,
      message: 'Pin deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on pin
// @route   POST /api/pins/:id/like
// @access  Private
export const toggleLike = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to like a pin',
      });
    }

    const pin = await Pin.findById(req.params.id);
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found',
      });
    }

    const userId = req.user.id || req.user._id;
    let likedBy = Array.isArray(pin.liked_by) ? [...pin.liked_by] : [];
    let likesCount = pin.likes_count || 0;
    const isAlreadyLiked = likedBy.some((uid) => String(uid) === String(userId));

    if (isAlreadyLiked) {
      likedBy = likedBy.filter((uid) => String(uid) !== String(userId));
      likesCount = Math.max(0, likesCount - 1);
    } else {
      likedBy.push(userId);
      likesCount += 1;
    }

    const updated = await Pin.findByIdAndUpdate(
      req.params.id,
      {
        liked_by: likedBy,
        likes_count: likesCount,
      },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        ...updated,
        is_liked: !isAlreadyLiked,
        likes_count: likesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate pin (1 - 5 stars)
// @route   POST /api/pins/:id/rate
// @access  Private
export const ratePin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to rate a pin',
      });
    }

    const { score } = req.body;
    const numScore = Number(score);

    if (!numScore || numScore < 1 || numScore > 5 || !Number.isInteger(numScore)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid rating score integer between 1 and 5',
      });
    }

    const pin = await Pin.findById(req.params.id);
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found',
      });
    }

    const userId = req.user.id || req.user._id;
    let ratings = Array.isArray(pin.ratings) ? [...pin.ratings] : [];
    const existingIndex = ratings.findIndex((r) => String(r.user_id) === String(userId));

    if (existingIndex >= 0) {
      ratings[existingIndex].score = numScore;
    } else {
      ratings.push({
        user_id: userId,
        score: numScore,
        created_at: new Date().toISOString(),
      });
    }

    const totalScore = ratings.reduce((acc, curr) => acc + curr.score, 0);
    const avg = Number((totalScore / ratings.length).toFixed(1));

    const updated = await Pin.findByIdAndUpdate(
      req.params.id,
      {
        ratings,
        rating_avg: avg,
        ratings_count: ratings.length,
        rating_count: ratings.length,
      },
      { new: true }
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for pin
// @route   GET /api/pins/:id/comments
// @access  Public
export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ pin_id: req.params.id });
    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to pin
// @route   POST /api/pins/:id/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to comment',
      });
    }

    const { content, text, rating } = req.body;
    const commentText = (content || text || '').trim();

    if (!commentText) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty',
      });
    }

    if (commentText.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 2000 characters',
      });
    }

    const pin = await Pin.findById(req.params.id);
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found',
      });
    }

    const authorUser = req.user;

    const newComment = await Comment.create({
      pin_id: req.params.id,
      user_id: authorUser.id || authorUser._id,
      user: {
        id: authorUser.id || authorUser._id,
        username: authorUser.username,
        full_name: authorUser.full_name,
        avatar_url: authorUser.avatar_url,
        email: authorUser.email,
      },
      content: commentText.trim(),
      rating: rating ? Number(rating) : null,
    });

    // Update comments count on pin
    await Pin.findByIdAndUpdate(req.params.id, {
      comments_count: (pin.comments_count || 0) + 1,
    });

    res.status(201).json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update comment
// @route   PUT /api/pins/:id/comments/:commentId
// @access  Private
export const updateComment = async (req, res, next) => {
  try {
    const { content, text } = req.body;
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const currentUserId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    if (String(comment.user_id) !== String(currentUserId) && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this comment',
      });
    }

    const updated = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { content: content || text }
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/pins/:id/comments/:commentId
// @access  Private
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const currentUserId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === 'admin';

    if (String(comment.user_id) !== String(currentUserId) && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    const pin = await Pin.findById(req.params.id);
    if (pin) {
      await Pin.findByIdAndUpdate(req.params.id, {
        comments_count: Math.max(0, (pin.comments_count || 1) - 1),
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report pin
// @route   POST /api/pins/:id/report
// @access  Private
export const reportPin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to report a pin',
      });
    }

    const { reason, details } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required',
      });
    }

    const pin = await Pin.findById(req.params.id);
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found',
      });
    }

    const user = req.user;

    const report = await Report.create({
      pin_id: req.params.id,
      pin_title: pin.title,
      pin_image: pin.image_url,
      pin_author: pin.user?.full_name || pin.user?.username || 'Creator',
      reporter_id: user.id || user._id,
      reporter_username: user.username,
      reporter_email: user.email,
      reason,
      details: details || '',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted for administrator review',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload image file
// @route   POST /api/pins/upload
// @access  Private / Public
export const handleImageUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file uploaded',
    });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const fileUrl = `${protocol}://${host}/uploads/pins/${req.file.filename}`;

  res.status(201).json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
    },
  });
};

export default {
  getAllPins,
  getPinById,
  createPin,
  updatePin,
  deletePin,
  toggleLike,
  ratePin,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  reportPin,
  handleImageUpload,
};
