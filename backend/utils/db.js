const mongoose = require('mongoose');

// Reuse a single connection across serverless invocations and local server runs
let cachedConnection = global._mongooseConnection;
let cachedPromise = global._mongoosePromise;

mongoose.set('strictQuery', true);

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  return uri;
};

const connectToDatabase = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(getMongoUri(), {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    global._mongoosePromise = cachedPromise;
  }

  cachedConnection = await cachedPromise;
  global._mongooseConnection = cachedConnection;
  return cachedConnection;
};

module.exports = { connectToDatabase };

