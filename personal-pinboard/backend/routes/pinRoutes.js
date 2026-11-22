import express from 'express';
import {
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
} from '../controllers/pinController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { uploadPinImage, validateImageMagicBytes } from '../middleware/uploadMiddleware.js';
import { reportLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.route('/')
  .get(optionalProtect, getAllPins)
  .post(protect, createPin);

router.post('/upload', protect, uploadPinImage.single('image'), validateImageMagicBytes, handleImageUpload);

router.route('/:id')
  .get(optionalProtect, getPinById)
  .put(protect, updatePin)
  .delete(protect, deletePin);

router.post('/:id/like', protect, toggleLike);
router.post('/:id/rate', protect, ratePin);

router.route('/:id/comments')
  .get(getComments)
  .post(protect, addComment);

router.route('/:id/comments/:commentId')
  .put(protect, updateComment)
  .delete(protect, deleteComment);

router.post('/:id/report', protect, reportLimiter, reportPin);

export default router;
