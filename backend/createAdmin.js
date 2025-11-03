const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/quiz-platform';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@quizquest.com' });
    if (existingAdmin) {
      console.log('Admin account already exists!');
      console.log('Email: admin@quizquest.com');
      console.log('Use existing password or delete the account first.');
      process.exit(0);
    }

    // Create admin account
    const admin = new User({
      name: 'Admin User',
      email: 'admin@quizquest.com',
      passwordHash: 'admin123',  // Will be hashed by pre-save hook
      role: 'admin'
    });

    await admin.save();

    console.log('\n✅ Admin account created successfully!\n');
    console.log('===========================================');
    console.log('Admin Credentials:');
    console.log('===========================================');
    console.log('Email:    admin@quizquest.com');
    console.log('Password: admin123');
    console.log('===========================================\n');
    console.log('⚠️  Please change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
