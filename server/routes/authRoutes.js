/* ==========================================================================
   Auth Routes
   ========================================================================== */

const express = require('express');
const router = express.Router();
const { register, login, adminLogin, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/signup', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.get('/me', authMiddleware, getMe);

module.exports = router;
