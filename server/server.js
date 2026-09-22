/* ==========================================================================
   Express Server — SKY DJ & EVENT MANAGEMENT
   ========================================================================== */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const connectDB = require('./config/db');

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const equipmentUploadsDir = path.join(uploadsDir, 'equipment');
const reviewsUploadsDir = path.join(uploadsDir, 'reviews');
[uploadsDir, equipmentUploadsDir, reviewsUploadsDir].forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    // Ignored in read-only serverless filesystems
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

// Ensure database is connected before processing API requests (essential for serverless)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request:', err.message);
    res.status(500).json({
      success: false,
      message: 'Database connection failed. Please check MONGODB_URI configuration.'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SKY DJ API is running'
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));

// 404 handler for unknown API routes — never return index.html for API calls
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err && err.message) {
    // Multer file validation errors
    if (err.message.includes('Only JPG') || err.message.includes('File too large') || err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: err.message || 'File upload error. Max 5MB, JPG/PNG/WEBP only.' });
    }
  }
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong.'
  });
});

// SPA fallback — serve index.html for any unmatched non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Connect to MongoDB and start server locally
const PORT = process.env.PORT || 5000;

if (require.main === module) {
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
}

module.exports = app;
