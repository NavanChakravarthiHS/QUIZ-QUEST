const mongoose = require('mongoose');

// Reuse a single connection across serverless invocations and local server runs
let cachedConnection = global._mongooseConnection;
let cachedPromise = global._mongoosePromise;
let warnedAboutDefaultUri = false;

mongoose.set('strictQuery', true);

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/quiz-platform';

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;

  if (!uri && !warnedAboutDefaultUri) {
    console.warn(
      `MONGODB_URI not set; falling back to local default (${DEFAULT_URI})`
    );
    warnedAboutDefaultUri = true;
  }

  return uri || DEFAULT_URI;
};

const connectToDatabase = async () => {
  const readyState = mongoose.connection.readyState;
  if (cachedConnection && (readyState === 1 || readyState === 2)) {
    return cachedConnection;
  }

  if (!cachedPromise || readyState === 0) {
    const mongoUri = getMongoUri();
    cachedPromise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      })
      .catch((err) => {
        // Clear cached promise so subsequent attempts can retry
        cachedPromise = undefined;
        cachedConnection = undefined;
        throw err;
      });
    global._mongoosePromise = cachedPromise;
  }

  cachedConnection = await cachedPromise;
  global._mongooseConnection = cachedConnection;
  return cachedConnection;
};

module.exports = { connectToDatabase };

