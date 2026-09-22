/* ==========================================================================
   MongoDB Connection — SKY DJ & EVENT MANAGEMENT
   ========================================================================== */

const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!process.env.MONGODB_URI) {
    const errorMsg = 'MONGODB_URI is not defined in environment variables';
    console.error('MongoDB Config Error:', errorMsg);
    throw new Error(errorMsg);
  }

  if (!cached.promise) {
    const opts = {
      dbName: process.env.DB_NAME || 'sky_dj_events',
      bufferCommands: false
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('=================================');
      console.log('MongoDB Connected Successfully');
      console.log('Database:', mongooseInstance.connection.name);
      console.log('Host:', mongooseInstance.connection.host);
      console.log('=================================');
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      console.error('MongoDB Connection Failed:', err.message);
      throw err;
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

