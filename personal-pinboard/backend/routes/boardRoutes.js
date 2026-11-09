import express from 'express';
import {
  getBoards,
  getUserBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  savePinToBoard,
  removePinFromBoard,
} from '../controllers/boardController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/user/:userId', optionalProtect, getUserBoards);

router.route('/')
  .get(optionalProtect, getBoards)
  .post(protect, createBoard);

router.route('/:id')
  .get(optionalProtect, getBoardById)
  .put(protect, updateBoard)
  .delete(protect, deleteBoard);

router.post('/:boardId/pins', protect, savePinToBoard);
router.delete('/:boardId/pins/:pinId', protect, removePinFromBoard);

export default router;
