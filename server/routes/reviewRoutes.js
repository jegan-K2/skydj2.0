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

// Multer in-memory storage:
// Keeps review file buffer in memory and avoids any local /var/task filesystem access on Vercel
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (file && file.mimetype && allowed.includes(file.mimetype.toLowerCase())) {
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

// Admin: all reviews (supports both /all and /admin)
router.get('/all', authMiddleware, adminMiddleware, getAll);
router.get('/admin', authMiddleware, adminMiddleware, getAll);

// Authenticated client: submit review with optional event photo
router.post('/', authMiddleware, upload.single('eventPhoto'), create);

// Admin moderation
router.put('/:id/approve', authMiddleware, adminMiddleware, approve);
router.put('/:id/reject', authMiddleware, adminMiddleware, reject);
router.delete('/:id', authMiddleware, adminMiddleware, remove);

module.exports = router;
