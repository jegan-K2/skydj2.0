/* ==========================================================================
   Review Model — SKY DJ & EVENT MANAGEMENT
   ========================================================================== */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  functionType: {
    type: String,
    required: [true, 'Function type is required'],
    trim: true
  },
  feedback: {
    type: String,
    required: [true, 'Feedback is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for common queries
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
