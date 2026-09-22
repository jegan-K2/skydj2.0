/* ==========================================================================
   Review Controller — Client submission + Admin moderation
   ========================================================================== */

const Review = require('../models/Review');
const fs = require('fs');
const path = require('path');

// GET /api/reviews — public (approved only)
exports.getApproved = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('getApproved reviews error:', err);
    res.status(500).json({ success: false, message: 'Could not load reviews.' });
  }
};

// GET /api/reviews/all — admin only (all statuses)
exports.getAll = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('getAll reviews error:', err);
    res.status(500).json({ success: false, message: 'Could not load reviews.' });
  }
};

// POST /api/reviews — authenticated client
exports.create = async (req, res) => {
  try {
    const { name, functionType, feedback } = req.body;

    if (!name || !functionType || !feedback) {
      return res.status(400).json({ success: false, message: 'Name, function type, and feedback are required.' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = '/uploads/reviews/' + req.file.filename;
    }

    const review = await Review.create({
      userId: req.user.id,
      name,
      functionType,
      feedback,
      imageUrl,
      status: 'pending' // Always pending — client cannot set approved
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! It will appear once approved by admin.',
      data: review
    });
  } catch (err) {
    console.error('create review error:', err);
    res.status(500).json({ success: false, message: 'Could not submit review.' });
  }
};

// PUT /api/reviews/:id/approve — admin only
exports.approve = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }
    res.json({ success: true, message: 'Review approved.', data: review });
  } catch (err) {
    console.error('approve review error:', err);
    res.status(500).json({ success: false, message: 'Could not approve review.' });
  }
};

// PUT /api/reviews/:id/reject — admin only
exports.reject = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }
    res.json({ success: true, message: 'Review rejected.', data: review });
  } catch (err) {
    console.error('reject review error:', err);
    res.status(500).json({ success: false, message: 'Could not reject review.' });
  }
};

// DELETE /api/reviews/:id — admin only
exports.remove = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Delete image file if exists
    if (review.imageUrl && review.imageUrl.startsWith('/uploads/')) {
      const relPath = review.imageUrl.replace(/^\/uploads\//, '');
      const imgPath = path.join(__dirname, '../../uploads', relPath);
      if (fs.existsSync(imgPath)) {
        try { fs.unlinkSync(imgPath); } catch (e) {}
      }
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    console.error('delete review error:', err);
    res.status(500).json({ success: false, message: 'Could not delete review.' });
  }
};
