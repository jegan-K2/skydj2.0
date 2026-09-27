/* ==========================================================================
   MongoDB Connection — SKY DJ & EVENT MANAGEMENT
   ========================================================================== */

const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const path = require('path');
const mongoose = require('mongoose');

// Ensure root .env is loaded even if db.js is required directly
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const errorMsg = 'MONGODB_URI is not defined in environment variables or .env file.';
    console.error('MongoDB Config Error:', errorMsg);
    throw new Error(errorMsg);
  }

  // Detect unreplaced placeholder password
  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    const errorMsg = 'MONGODB_URI contains a placeholder password (<db_password>). Replace it with your actual MongoDB Atlas database-user password in .env.';
    console.error('=================================');
    console.error('MongoDB Configuration Error:');
    console.error(errorMsg);
    console.error('=================================');
    throw new Error(errorMsg);
  }

  // Detect unencoded special characters in password (such as multiple @ signs)
  const atCount = (uri.split('?')[0].match(/@/g) || []).length;
  if (atCount > 1) {
    console.warn('=================================');
    console.warn('MongoDB URI Warning:');
    console.warn('Your MONGODB_URI contains multiple "@" characters before the query parameters.');
    console.warn('If your password contains special characters (@, :, /, ?, #, %, &, +), encode them using encodeURIComponent.');
    console.warn('Example: "@" becomes "%40"');
    console.warn('=================================');
  }

  if (!cached.promise) {
    const dbName = process.env.DB_NAME || 'sky_dj_events';
    const opts = {
      dbName,
      bufferCommands: false
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log('=================================');
      console.log('MongoDB Connected Successfully');
      console.log('Database:', mongooseInstance.connection.name);
      console.log('Host:', mongooseInstance.connection.host);
      console.log('=================================');
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      let safeMsg = err.message;
      if (err.message && err.message.includes('bad auth')) {
        safeMsg = 'Authentication failed (bad auth). Please check your MongoDB database user credentials and password encoding.';
      }
      console.error('MongoDB Connection Failed:', safeMsg);
      throw new Error(safeMsg);
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
};

module.exports = connectDB;

