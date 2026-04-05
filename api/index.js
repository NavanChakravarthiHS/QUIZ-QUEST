const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');
const app = require('../backend/app');

// Load environment variables
dotenv.config({ path: '../.env' });

// Validate required env vars in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required for production deployment');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters in production');
  }
}

// Build frontend if not already built (only once per deployment)
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
if (!fs.existsSync(frontendDistPath)) {
  console.log('Building frontend...');
  try {
    execSync('cd ../frontend && npm install && npm run build', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('Frontend built successfully');
  } catch (error) {
    console.error('Failed to build frontend:', error.message);
  }
}

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

// Serve static files from frontend/dist
app.use(express.static(frontendDistPath));

// Serve index.html for all non-API routes (for React Router)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built yet. Please wait...');
  }
});

module.exports = app;


