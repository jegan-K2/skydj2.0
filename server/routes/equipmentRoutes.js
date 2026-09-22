/* ==========================================================================
   Equipment Routes
   ========================================================================== */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getAll, getById, create, update, remove } = require('../controllers/equipmentController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Multer config for equipment images
const equipStorageDir = path.join(__dirname, '../../uploads/equipment');
if (!fs.existsSync(equipStorageDir)) {
  fs.mkdirSync(equipStorageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, equipStorageDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `equip_${Date.now()}_${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
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

// Public routes
router.get('/', getAll);
router.get('/:id', getById);

// Admin-only routes
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), create);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), update);
router.delete('/:id', authMiddleware, adminMiddleware, remove);

module.exports = router;
