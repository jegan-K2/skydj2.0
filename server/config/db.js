/* ==========================================================================
   MongoDB Connection — SKY DJ & EVENT MANAGEMENT
   ========================================================================== */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'sky_dj_events'
    });

    console.log('=================================');
    console.log('MongoDB Connected Successfully');
    console.log('Database:', connection.connection.name);
    console.log('Host:', connection.connection.host);
    console.log('=================================');
    return connection;
  } catch (error) {
    console.error('MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

