/* ==========================================================================
   Equipment Model — SKY DJ & EVENT MANAGEMENT
   ========================================================================== */

const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for listing by newest first
equipmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Equipment', equipmentSchema);
