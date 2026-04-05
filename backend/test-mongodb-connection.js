const mongoose = require('mongoose');
require('dotenv').config();

console.log('\n🔍 MongoDB Connection Diagnostic Tool\n');
console.log('=====================================\n');

async function diagnose() {
  // Check environment variables
  console.log('1. Checking Environment Variables...');
  console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ NOT SET');
  console.log('   JWT_SECRET:', process.env.JWT_SECRET ? `✅ Set (${process.env.JWT_SECRET.length} chars)` : '❌ NOT SET');
  console.log('   NODE_ENV:', process.env.NODE_ENV || '❌ NOT SET');
  console.log('');

  if (!process.env.MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI is not set!');
    console.error('   Add it to your .env file or Vercel environment variables');
    console.error('   Format: mongodb+srv://user:pass@cluster.mongodb.net/quiz-platform?retryWrites=true&w=majority');
    process.exit(1);
  }

  // Mask the URI for security
  const uri = process.env.MONGODB_URI;
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//****:****@');
  console.log('2. Connection String (masked):', maskedUri);
  console.log('');

  // Try to connect
  console.log('3. Attempting MongoDB Connection...');
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true
    });
    
    console.log('   ✅ Connection successful!');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('   Port:', mongoose.connection.port);
    console.log('   Connection State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    console.log('');

    // Test queries
    console.log('4. Testing Database Operations...');
    
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log('   ✅ Users collection accessible');
    console.log('   User count:', userCount);
    
    const Quiz = require('./models/Quiz');
    const quizCount = await Quiz.countDocuments();
    console.log('   ✅ Quizzes collection accessible');
    console.log('   Quiz count:', quizCount);
    
    const Attempt = require('./models/Attempt');
    const attemptCount = await Attempt.countDocuments();
    console.log('   ✅ Attempts collection accessible');
    console.log('   Attempt count:', attemptCount);
    console.log('');

    // Test authentication
    console.log('5. Testing Authentication Setup...');
    if (process.env.JWT_SECRET) {
      console.log('   ✅ JWT_SECRET is set');
      console.log('   Length:', process.env.JWT_SECRET.length, 'characters');
      if (process.env.JWT_SECRET.length < 32) {
        console.log('   ⚠️  WARNING: JWT_SECRET should be at least 32 characters for production');
      }
    } else {
      console.log('   ❌ JWT_SECRET is not set');
    }
    console.log('');

    console.log('=====================================');
    console.log('✅ ALL CHECKS PASSED!');
    console.log('=====================================\n');
    console.log('Your MongoDB connection is working correctly.');
    console.log('If you\'re still getting 500 errors on Vercel, check:');
    console.log('1. Environment variables are set in Vercel dashboard');
    console.log('2. MongoDB Atlas Network Access includes 0.0.0.0/0');
    console.log('3. You redeployed after adding environment variables\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ CONNECTION FAILED!');
    console.error('=====================================\n');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('');

    // Provide specific solutions based on error
    if (error.message.includes('Authentication failed')) {
      console.error('🔧 SOLUTION: Authentication failed');
      console.error('   - Check your MongoDB username and password');
      console.error('   - URL-encode special characters in password');
      console.error('   - Reset password in MongoDB Atlas if needed');
      console.error('');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('🔧 SOLUTION: Cluster address not found');
      console.error('   - Check your cluster address in the connection string');
      console.error('   - Verify the cluster exists and is running');
      console.error('   - Check for typos in the URI');
      console.error('');
    } else if (error.message.includes('connect ECONNREFUSED') || error.message.includes('timed out')) {
      console.error('🔧 SOLUTION: Connection refused or timed out');
      console.error('   - Add 0.0.0.0/0 to MongoDB Atlas Network Access');
      console.error('   - Verify your cluster is running (green status)');
      console.error('   - Check your internet connection');
      console.error('');
    } else if (error.message.includes('bad auth')) {
      console.error('🔧 SOLUTION: Bad authentication');
      console.error('   - Username or password is incorrect');
      console.error('   - Go to MongoDB Atlas → Database Access');
      console.error('   - Verify username and reset password if needed');
      console.error('');
    }

    console.error('Full Error Stack:');
    console.error(error.stack);
    console.error('');

    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

diagnose();
