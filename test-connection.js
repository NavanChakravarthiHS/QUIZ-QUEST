require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

console.log('\n🔍 Testing MongoDB Connection\n');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ NOT SET');
console.log('');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env file');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully!');
  console.log('Database:', mongoose.connection.name);
  console.log('');
  
  // Test a simple query
  const User = require('./backend/models/User');
  return User.countDocuments();
})
.then(count => {
  console.log('✅ Database queries working!');
  console.log(`Total users in database: ${count}`);
  console.log('');
  console.log('✅ ALL TESTS PASSED - MongoDB is working correctly!\n');
  mongoose.disconnect();
  process.exit(0);
})
.catch(err => {
  console.error('❌ CONNECTION FAILED!');
  console.error('');
  console.error('Error:', err.message);
  console.error('');
  
  if (err.message.includes('Authentication failed')) {
    console.error('🔧 FIX: Check username/password in MONGODB_URI');
  } else if (err.message.includes('getaddrinfo ENOTFOUND')) {
    console.error('🔧 FIX: Check cluster address is correct');
  } else if (err.message.includes('timed out') || err.message.includes('buffering timed out')) {
    console.error('🔧 FIX: Add 0.0.0.0/0 to MongoDB Atlas Network Access');
    console.error('   1. Go to MongoDB Atlas');
    console.error('   2. Click "Network Access"');
    console.error('   3. Click "+ ADD IP ADDRESS"');
    console.error('   4. Click "ALLOW ACCESS FROM ANYWHERE"');
    console.error('   5. Click "Confirm"');
    console.error('   6. Wait 1-2 minutes');
  }
  
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
