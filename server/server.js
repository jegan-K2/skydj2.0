/* ==========================================================================
   Express Server — SKY DJ & EVENT MANAGEMENT
   ========================================================================== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const equipmentUploadsDir = path.join(uploadsDir, 'equipment');
const reviewsUploadsDir = path.join(uploadsDir, 'reviews');
[uploadsDir, equipmentUploadsDir, reviewsUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));

// Multer error handling
app.use((err, req, res, next) => {
  if (err && err.message) {
    // Multer file validation errors
    if (err.message.includes('Only JPG') || err.message.includes('File too large') || err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: err.message || 'File upload error. Max 5MB, JPG/PNG/WEBP only.' });
    }
  }
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Something went wrong.' });
});

// SPA fallback — serve index.html for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  });
