/* ==========================================================================
   Review Controller — Client submission + Admin moderation
   ========================================================================== */

const Review = require('../models/Review');
const fs = require('fs');
const path = require('path');
const { put, del } = require('@vercel/blob');

// GET /api/reviews — public (approved only)
exports.getApproved = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('getApproved reviews error:', err);
    res.status(500).json({ success: false, message: 'Could not load reviews.' });
  }
};

// GET /api/reviews/all or /api/reviews/admin — admin only (all statuses)
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
    const { functionType, feedback } = req.body;

    if (!functionType || !feedback || !functionType.trim() || !feedback.trim()) {
      return res.status(400).json({ success: false, message: 'Function type and feedback are required.' });
    }

    // Authenticated user identity strictly taken from backend session/JWT
    const userId = req.user.id;
    const clientName = (req.user && req.user.name) ? req.user.name : (req.body.name ? req.body.name.trim() : 'Client');

    let imageUrl = '';
    if (req.file && req.file.buffer) {
      const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

      if (blobToken) {
        // Upload directly to Vercel Blob Storage (Production / Token-configured)
        const ext = path.extname(req.file.originalname) || '.jpg';
        const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
        const pathname = `reviews/review_${uniqueSuffix}${ext}`;

        const blob = await put(pathname, req.file.buffer, {
          access: 'public',
          contentType: req.file.mimetype || 'image/jpeg',
          token: blobToken
        });
        imageUrl = blob.url;
      } else if (isVercel) {
        // Running on Vercel without BLOB_READ_WRITE_TOKEN
        console.error('Vercel review photo upload error: BLOB_READ_WRITE_TOKEN environment variable is not configured.');
        return res.status(500).json({
          success: false,
          message: 'Cloud photo upload failed: BLOB_READ_WRITE_TOKEN is not configured in Vercel project environment variables. Please add BLOB_READ_WRITE_TOKEN in Vercel Project Settings > Environment Variables.'
        });
      } else {
        // Local development fallback: save to persistent local disk
        const reviewStorageDir = path.join(__dirname, '../../uploads/reviews');
        if (!fs.existsSync(reviewStorageDir)) {
          fs.mkdirSync(reviewStorageDir, { recursive: true });
        }
        const ext = path.extname(req.file.originalname) || '.jpg';
        const uniqueName = `review_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
        const filePath = path.join(reviewStorageDir, uniqueName);
        await fs.promises.writeFile(filePath, req.file.buffer);
        imageUrl = '/uploads/reviews/' + uniqueName;
      }
    }

    const review = await Review.create({
      userId,
      name: clientName,
      clientName: clientName,
      functionType: functionType.trim(),
      feedback: feedback.trim(),
      imageUrl,
      eventPhoto: imageUrl,
      status: 'approved' // Automatically approved so it appears immediately in Client Reviews
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! It is now visible in the Client Reviews section.',
      data: review
    });
  } catch (err) {
    console.error('create review error:', err);
    res.status(500).json({ success: false, message: 'Could not submit review: ' + (err.message || 'Please try again.') });
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

    // Delete image if exists
    const photoUrl = review.imageUrl || review.eventPhoto;
    if (photoUrl) {
      if (photoUrl.startsWith('/uploads/')) {
        // Local file
        try {
          const relPath = photoUrl.replace(/^\/uploads\//, '');
          const imgPath = path.join(__dirname, '../../uploads', relPath);
          if (fs.existsSync(imgPath)) {
            await fs.promises.unlink(imgPath);
          }
        } catch (e) {
          console.warn('Could not delete local file:', e.message);
        }
      } else if (photoUrl.includes('blob.vercel-storage.com') || /^https?:\/\//i.test(photoUrl)) {
        // Vercel Blob file
        try {
          const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
          if (blobToken) {
            await del(photoUrl, { token: blobToken });
          }
        } catch (blobErr) {
          console.warn('Could not delete blob image:', blobErr.message);
        }
      }
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    console.error('delete review error:', err);
    res.status(500).json({ success: false, message: 'Could not delete review.' });
  }
};
