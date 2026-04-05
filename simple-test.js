require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

console.log('\n🔍 Simple MongoDB Test\n');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ NOT SET');
console.log('');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env file');
  process.exit(1);
}

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });
    
    console.log('✅ Connected!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('');

    // Use native MongoDB driver instead of Mongoose models
    const db = mongoose.connection.db;
    
    console.log('Testing query on users collection...');
    const users = await db.collection('users').find({}).limit(3).toArray();
    console.log(`✅ Found ${users.length} users`);
    
    if (users.length > 0) {
      console.log('\nSample users:');
      users.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.name || 'N/A'} (${user.email})`);
      });
    }
    
    console.log('\n✅ ALL TESTS PASSED!\n');
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ FAILED!');
    console.error('Error:', err.message);
    console.error('');
    
    if (err.message.includes('Authentication failed')) {
      console.error('🔧 Wrong username or password in MONGODB_URI');
    } else if (err.message.includes('timed out')) {
      console.error('🔧 Query timeout - Possible causes:');
      console.error('   1. Cluster is paused/sleeping (wake it up in Atlas)');
      console.error('   2. Network connectivity issues');
      console.error('   3. IP not whitelisted (add 0.0.0.0/0)');
      console.error('   4. Free tier cluster under heavy load');
      console.error('');
      console.error('Try:');
      console.error('  - Go to MongoDB Atlas and click on your cluster');
      console.error('  - Make sure it says "Running" not "Paused"');
      console.error('  - If paused, click "Resume"');
      console.error('  - Wait 2-3 minutes and try again');
    }
    
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

test();
