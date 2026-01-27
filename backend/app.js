/**
 * Restaurant ChatBot - Express Application Configuration
 * This file contains the main Express app setup and middleware configuration
 */

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import routes
const chatRoutes = require('./routes/chatRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// Import middleware
const { validateInput } = require('./middleware/validation');

// Import database connection
const connectDB = require('./config/database');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ====================
// DATABASE CONNECTION
// ====================
connectDB();

// ====================
// MIDDLEWARE
// ====================

// CORS configuration - allows frontend to communicate with backend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Session middleware for device-based session tracking
app.use(session({
  secret: process.env.SESSION_SECRET || 'restaurant-chatbot-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60, // 24 hours
    autoRemove: 'native'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ====================
// ROUTES
// ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Restaurant ChatBot API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', webhookRoutes);

// Welcome endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Restaurant ChatBot API',
    version: '1.0.0',
    endpoints: {
      chat: '/api/chat',
      payment: '/api/payment',
      webhook: '/api/webhook'
    },
    documentation: 'See README for API usage'
  });
});

// ====================
// ERROR HANDLING
// ====================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    type: 'error',
    message: 'Endpoint not found',
    requestedUrl: req.url,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    type: 'error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ====================
// SERVER START
// ====================

// Only start server if not in production (Vercel handles this differently)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`💾 Database: ${process.env.MONGODB_URI ? 'Connected to MongoDB' : 'No database configured'}`);
    console.log(`🔄 API Endpoint: http://localhost:${PORT}/api`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
  });
}

// Export app for Vercel serverless functions
module.exports = app;