/* ==========================================================================
   Admin Seed Script — SKY DJ & EVENT MANAGEMENT
   Creates the single admin account in MongoDB.
   
   Usage:
     1. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env
     2. Run: node server/seedAdmin.js
   ========================================================================== */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('./models/User');
const connectDB = require('./config/db');

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  try {
    await connectDB();

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      if (existing.role === 'admin') {
        console.log(`Admin account already exists: ${ADMIN_EMAIL}`);
      } else {
        // Upgrade to admin
        existing.role = 'admin';
        await existing.save();
        console.log(`Upgraded existing account to admin: ${ADMIN_EMAIL}`);
      }
    } else {
      // Create new admin account
      await User.create({
        name: 'Admin',
        email: ADMIN_EMAIL.toLowerCase(),
        password: ADMIN_PASSWORD,
        role: 'admin'
      });
      console.log(`Admin account created successfully: ${ADMIN_EMAIL}`);
    }

    console.log('Admin seed complete. Password is stored as a bcrypt hash in MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
