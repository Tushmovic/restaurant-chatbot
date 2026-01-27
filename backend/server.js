/**
 * Restaurant ChatBot - Server Entry Point
 * This file is the main entry point for the application
 */

// Load environment variables
require('dotenv').config();

// Import the app from app.js
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Start server if not in production (Vercel handles this differently)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;