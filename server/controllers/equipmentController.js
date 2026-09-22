/* ==========================================================================
   Equipment Controller — CRUD with image upload
   ========================================================================== */

const Equipment = require('../models/Equipment');
const fs = require('fs');
const path = require('path');

// GET /api/equipment — public
exports.getAll = async (req, res) => {
  try {
    const equipment = await Equipment.find().sort({ createdAt: -1 });
    res.json({ success: true, data: equipment });
  } catch (err) {
    console.error('getAll equipment error:', err);
    res.status(500).json({ success: false, message: 'Could not load equipment.' });
  }
};

// GET /api/equipment/:id — public
exports.getById = async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    console.error('getById equipment error:', err);
    res.status(500).json({ success: false, message: 'Could not load equipment details.' });
  }
};

// POST /api/equipment — admin only
exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, message: 'Equipment name and description are required.' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = '/uploads/equipment/' + req.file.filename;
    }

    const item = await Equipment.create({ name, description, imageUrl });

    res.status(201).json({ success: true, message: 'Equipment added successfully.', data: item });
  } catch (err) {
    console.error('create equipment error:', err);
    res.status(500).json({ success: false, message: 'Could not add equipment.' });
  }
};

// PUT /api/equipment/:id — admin only
exports.update = async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    const { name, description } = req.body;
    if (name) item.name = name;
    if (description) item.description = description;

    if (req.file) {
      // Delete old image if it exists in uploads
      if (item.imageUrl && item.imageUrl.startsWith('/uploads/')) {
        const oldRel = item.imageUrl.replace(/^\/uploads\//, '');
        const oldPath = path.join(__dirname, '../../uploads', oldRel);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) {}
        }
      }
      item.imageUrl = '/uploads/equipment/' + req.file.filename;
    }

    await item.save();

    res.json({ success: true, message: 'Equipment updated successfully.', data: item });
  } catch (err) {
    console.error('update equipment error:', err);
    res.status(500).json({ success: false, message: 'Could not update equipment.' });
  }
};

// DELETE /api/equipment/:id — admin only
exports.remove = async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found.' });
    }

    // Delete image file
    if (item.imageUrl && item.imageUrl.startsWith('/uploads/')) {
      const relPath = item.imageUrl.replace(/^\/uploads\//, '');
      const imgPath = path.join(__dirname, '../../uploads', relPath);
      if (fs.existsSync(imgPath)) {
        try { fs.unlinkSync(imgPath); } catch (e) {}
      }
    }

    await Equipment.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Equipment deleted successfully.' });
  } catch (err) {
    console.error('delete equipment error:', err);
    res.status(500).json({ success: false, message: 'Could not delete equipment.' });
  }
};
