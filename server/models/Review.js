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
  clientName: {
    type: String,
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
  eventPhoto: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
}, {
  timestamps: true
});

// Auto-sync clientName <-> name and imageUrl <-> eventPhoto before saving
reviewSchema.pre('save', function(next) {
  if (!this.clientName && this.name) {
    this.clientName = this.name;
  }
  if (!this.name && this.clientName) {
    this.name = this.clientName;
  }
  if (!this.eventPhoto && this.imageUrl) {
    this.eventPhoto = this.imageUrl;
  }
  if (!this.imageUrl && this.eventPhoto) {
    this.imageUrl = this.eventPhoto;
  }
  next();
});

// Indexes for common queries
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
