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

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint (always accessible for diagnostic & uptime checks)
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const isUriSet = Boolean(process.env.MONGODB_URI);
  const isUriPlaceholder = isUriSet && (process.env.MONGODB_URI.includes('<db_password>') || process.env.MONGODB_URI.includes('<password>'));
  const dbState = mongoose.connection.readyState;
  const statusNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  let dbError = null;
  if (dbState !== 1 && isUriSet && !isUriPlaceholder) {
    try {
      await connectDB();
    } catch (e) {
      dbError = e.message;
    }
  }

  const isConnected = mongoose.connection.readyState === 1;

  res.status(isConnected ? 200 : 503).json({
    success: isConnected,
    message: isConnected ? 'SKY DJ API is running and connected to MongoDB' : 'SKY DJ API is running but database is not connected',
    database: {
      configured: isUriSet,
      hasPlaceholder: isUriPlaceholder,
      status: statusNames[mongoose.connection.readyState] || 'unknown',
      error: dbError || (isUriPlaceholder ? 'MONGODB_URI contains a placeholder password (<db_password>)' : (!isUriSet ? 'MONGODB_URI is not set in environment variables' : null))
    }
  });
});

// Ensure database is connected before processing other API requests
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request:', err.message);
    res.status(503).json({
      success: false,
      message: 'Database connection failed: ' + (err.message || 'Please check MONGODB_URI configuration.')
    });
  }
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
