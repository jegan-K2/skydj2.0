/* ==========================================================================
   Contact Model — SKY DJ & EVENT MANAGEMENT
   Stores a single admin-configurable contact document (singleton pattern).
   ========================================================================== */

const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
  {
    whatsapp: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', ContactSchema);
