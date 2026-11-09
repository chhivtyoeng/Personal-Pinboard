import Board from '../models/Board.js';
import Pin from '../models/Pin.js';

// @desc    Get all boards (or filter by query)
// @route   GET /api/boards
// @access  Public / Optional Auth
export const getBoards = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id || req.user?._id;
    const targetUserId = req.query.userId || req.query.user_id;

    let boards = [];
    if (targetUserId) {
      boards = await Board.find({ user_id: targetUserId });
      const isOwner = String(currentUserId) === String(targetUserId);
      if (!isOwner) {
        boards = boards.filter((b) => !b.is_private);
      }
    } else {
      boards = await Board.find();
      boards = boards.filter((b) => !b.is_private || String(b.user_id) === String(currentUserId));
    }

    res.json({
      success: true,
      count: boards.length,
      data: boards,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get boards for user
// @route   GET /api/boards/user/:userId
// @access  Public / Private
export const getUserBoards = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id || req.user?._id;
    const isOwner = String(currentUserId) === String(userId);

    const boards = await Board.find({ user_id: userId });

    // Filter out private boards if not owner
    const visibleBoards = isOwner ? boards : boards.filter((b) => !b.is_private);

    res.json({
      success: true,
      count: visibleBoards.length,
      data: visibleBoards,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get board by ID
// @route   GET /api/boards/:id
// @access  Public / Private
export const getBoardById = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    const currentUserId = req.user?.id || req.user?._id;
    if (board.is_private && String(board.user_id) !== String(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: 'This board is private',
      });
    }

    // Get pins belonging to this board
    const pins = await Pin.find({ boardId: board.id || board._id });

    res.json({
      success: true,
      data: {
        ...board,
        pins,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create board
// @route   POST /api/boards
// @access  Private
export const createBoard = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to create a board',
      });
    }

    const { name, description, cover_image_url, cover_image, is_private, is_secret } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Board name is required',
      });
    }

    const cleanName = name.trim().slice(0, 150);
    const userId = req.user.id || req.user._id;

    const newBoard = await Board.create({
      name: cleanName,
      description: (description || '').slice(0, 1000),
      cover_image_url: cover_image_url || cover_image || '',
      preview_images: cover_image_url ? [cover_image_url] : [],
      user_id: userId,
      is_private: Boolean(is_private || is_secret),
    });

    res.status(201).json({
      success: true,
      data: newBoard,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
export const updateBoard = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    const currentUserId = req.user.id || req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (String(board.user_id) !== String(currentUserId) && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this board',
      });
    }

    const { name, description, cover_image_url, is_private } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Board name cannot be empty',
        });
      }
      updates.name = name.trim().slice(0, 150);
    }
    if (description !== undefined) {
      updates.description = String(description).slice(0, 1000);
    }
    if (cover_image_url !== undefined) {
      updates.cover_image_url = String(cover_image_url).trim();
    }
    if (is_private !== undefined) {
      updates.is_private = Boolean(is_private);
    }

    const updated = await Board.findByIdAndUpdate(req.params.id, updates);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
export const deleteBoard = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    const currentUserId = req.user.id || req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (String(board.user_id) !== String(currentUserId) && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this board',
      });
    }

    await Board.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Board deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save pin to board
// @route   POST /api/boards/:boardId/pins
// @access  Private
export const savePinToBoard = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { boardId } = req.params;
    const { pin_id } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    const currentUserId = req.user.id || req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (String(board.user_id) !== String(currentUserId) && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to save pins to this board',
      });
    }

    const pin = await Pin.findById(pin_id);
    if (!pin) {
      return res.status(404).json({
        success: false,
        message: 'Pin not found',
      });
    }

    let pinIds = Array.isArray(board.pin_ids) ? [...board.pin_ids] : [];
    if (!pinIds.some((id) => String(id) === String(pin_id))) {
      pinIds.push(pin_id);
    }

    let previewImages = Array.isArray(board.preview_images) ? [...board.preview_images] : [];
    if (pin.image_url && !previewImages.includes(pin.image_url)) {
      previewImages.unshift(pin.image_url);
    }

    const updated = await Board.findByIdAndUpdate(
      boardId,
      {
        pin_ids: pinIds,
        pins_count: pinIds.length,
        cover_image_url: board.cover_image_url || pin.image_url,
        preview_images: previewImages.slice(0, 4),
      },
      { new: true }
    );

    // Also update pin's board_id if unassigned
    if (!pin.board_id) {
      await Pin.findByIdAndUpdate(pin_id, {
        board_id: Number(boardId),
        board_name: board.name,
      });
    }

    res.json({
      success: true,
      message: 'Pin saved to board',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove pin from board
// @route   DELETE /api/boards/:boardId/pins/:pinId
// @access  Private
export const removePinFromBoard = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { boardId, pinId } = req.params;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    const currentUserId = req.user.id || req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (String(board.user_id) !== String(currentUserId) && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this board',
      });
    }

    let pinIds = Array.isArray(board.pin_ids) ? [...board.pin_ids] : [];
    pinIds = pinIds.filter((id) => String(id) !== String(pinId));

    const updated = await Board.findByIdAndUpdate(
      boardId,
      {
        pin_ids: pinIds,
        pins_count: pinIds.length,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Pin removed from board',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getBoards,
  getUserBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  savePinToBoard,
  removePinFromBoard,
};
