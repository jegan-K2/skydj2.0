/* ==========================================================================
   Quotation Controller — Public submission + Admin management
   ========================================================================== */

const Quotation = require('../models/Quotation');

// POST /api/quotations — public (no auth needed)
exports.create = async (req, res) => {
  try {
    const { name, phone, email, functionType, eventDate, location, requiredEquipment, message } = req.body;

    if (!name || !phone || !functionType || !eventDate) {
      return res.status(400).json({ success: false, message: 'Name, phone, function type, and event date are required.' });
    }

    // Validate phone number
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number.' });
    }

    const quotation = await Quotation.create({
      name,
      phone,
      email: email || '',
      functionType,
      eventDate,
      location: location || '',
      requiredEquipment: requiredEquipment || '',
      message: message || '',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Quotation request sent successfully! We will contact you shortly.',
      data: quotation
    });
  } catch (err) {
    console.error('create quotation error:', err);
    res.status(500).json({ success: false, message: 'Could not submit quotation request.' });
  }
};

// GET /api/quotations — admin only
exports.getAll = async (req, res) => {
  try {
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    res.json({ success: true, data: quotations });
  } catch (err) {
    console.error('getAll quotations error:', err);
    res.status(500).json({ success: false, message: 'Could not load quotations.' });
  }
};

// PUT /api/quotations/:id — admin only
exports.update = async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }
    res.json({ success: true, message: `Quotation status updated to ${status}.`, data: quotation });
  } catch (err) {
    console.error('update quotation error:', err);
    res.status(500).json({ success: false, message: 'Could not update quotation.' });
  }
};

// DELETE /api/quotations/:id — admin only
exports.remove = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }
    res.json({ success: true, message: 'Quotation deleted.' });
  } catch (err) {
    console.error('delete quotation error:', err);
    res.status(500).json({ success: false, message: 'Could not delete quotation.' });
  }
};
