/* ==========================================================================
   Quotation Model — SKY DJ & EVENT MANAGEMENT
   ========================================================================== */

const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  functionType: {
    type: String,
    required: [true, 'Function type is required'],
    trim: true
  },
  eventDate: {
    type: String,
    required: [true, 'Event date is required'],
    trim: true
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  requiredEquipment: {
    type: String,
    default: '',
    trim: true
  },
  message: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for admin filtering
quotationSchema.index({ status: 1 });
quotationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Quotation', quotationSchema);
