// Vercel serverless entrypoint that reuses the existing Express app
// located in backend/api/index.js. All backend logic stays in the
// backend folder; this file simply exposes it under /api.
const app = require('../backend/api/index');

module.exports = app;

