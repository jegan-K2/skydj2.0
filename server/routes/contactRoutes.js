/* ==========================================================================
   Contact Routes — SKY DJ & EVENT MANAGEMENT
   GET  /api/contact        → Public: returns WhatsApp number
   PUT  /api/contact        → Admin-only: update contact details
   ========================================================================== */

const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const authMiddleware  = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// GET /api/contact — Public route; returns whatsapp & other contact info
router.get('/', async (req, res) => {
  try {
    let contact = await Contact.findOne();
    if (!contact) {
      // Return empty defaults without creating a document
      contact = { whatsapp: '', phone: '', email: '', address: '' };
    }
    res.json({ success: true, contact });
  } catch (err) {
    console.error('GET /api/contact error:', err);
    res.status(500).json({ success: false, message: 'Failed to load contact details.' });
  }
});

// PUT /api/contact — Admin-only route; upsert contact details
router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { whatsapp, phone, email, address } = req.body;
    const update = {};
    if (whatsapp !== undefined) update.whatsapp = String(whatsapp).trim();
    if (phone    !== undefined) update.phone    = String(phone).trim();
    if (email    !== undefined) update.email    = String(email).trim();
    if (address  !== undefined) update.address  = String(address).trim();

    const contact = await Contact.findOneAndUpdate(
      {},                             // filter: the one document
      { $set: update },               // updates
      { new: true, upsert: true }     // create if doesn't exist, return new doc
    );

    res.json({ success: true, message: 'Contact details saved.', contact });
  } catch (err) {
    console.error('PUT /api/contact error:', err);
    res.status(500).json({ success: false, message: 'Failed to save contact details.' });
  }
});

module.exports = router;
