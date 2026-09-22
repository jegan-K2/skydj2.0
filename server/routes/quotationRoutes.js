/* ==========================================================================
   Quotation Routes
   ========================================================================== */

const express = require('express');
const router = express.Router();
const { create, getAll, update, remove } = require('../controllers/quotationController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public: anyone can submit a quotation
router.post('/', create);

// Admin only
router.get('/', authMiddleware, adminMiddleware, getAll);
router.put('/:id', authMiddleware, adminMiddleware, update);
router.delete('/:id', authMiddleware, adminMiddleware, remove);

module.exports = router;
