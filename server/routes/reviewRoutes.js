/* ==========================================================================
   Review Routes
   ========================================================================== */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getApproved, getAll, create, approve, reject, remove } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Multer config for review event photos
const reviewStorageDir = path.join(__dirname, '../../uploads/reviews');
if (!fs.existsSync(reviewStorageDir)) {
  fs.mkdirSync(reviewStorageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, reviewStorageDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `review_${Date.now()}_${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Public: approved reviews only
router.get('/', getApproved);

// Admin: all reviews
router.get('/all', authMiddleware, adminMiddleware, getAll);

// Authenticated client: submit review with optional event photo
router.post('/', authMiddleware, upload.single('eventPhoto'), create);

// Admin moderation
router.put('/:id/approve', authMiddleware, adminMiddleware, approve);
router.put('/:id/reject', authMiddleware, adminMiddleware, reject);
router.delete('/:id', authMiddleware, adminMiddleware, remove);

module.exports = router;
