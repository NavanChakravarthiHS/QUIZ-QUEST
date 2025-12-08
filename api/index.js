const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('../backend/app');

dotenv.config();

// Cache the connection across invocations (important for Vercel serverless)
let cachedConn = global._mongooseConnection;
let cachedPromise = global._mongoosePromise;

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');
  return uri;
};

const connectToDatabase = async () => {
  if (cachedConn && mongoose.connection.readyState === 1) return cachedConn;

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(getMongoUri(), {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    global._mongoosePromise = cachedPromise;
  }

  cachedConn = await cachedPromise;
  global._mongooseConnection = cachedConn;
  return cachedConn;
};

// Ensure DB connection before handling any request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    return next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return res
      .status(500)
      .json({ success: false, message: 'Database connection failed' });
  }
});

module.exports = app;


