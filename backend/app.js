/**
 * Restaurant ChatBot - Express Application Configuration
 * Combined Backend + Frontend
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

// Import database connection
const connectDB = require('./config/database');

// Create Express app
const app = express();

// ====================
// DATABASE CONNECTION
// ====================
connectDB();

// ====================
// MIDDLEWARE
// ====================

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'restaurant-chatbot-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60,
    autoRemove: 'native'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ====================
// SERVE FRONTEND
// ====================

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// ====================
// API ROUTES
// ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Restaurant ChatBot is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);

// API Welcome
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Restaurant ChatBot API',
    version: '1.0.0',
    endpoints: {
      chat: '/api/chat',
      payment: '/api/payment'
    }
  });
});
// ====================
// API ROUTES
// ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Restaurant ChatBot is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);

// Payment page route
app.get('/payment.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

// API Welcome
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Restaurant ChatBot API',
    version: '1.0.0',
    endpoints: {
      chat: '/api/chat',
      payment: '/api/payment'
    }
  });
});
// ====================
// CATCH-ALL FOR FRONTEND
// ====================

// For any other route, serve index.html (React Router support)
app.get('*', (req, res, next) => {
  // Don't interfere with API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ====================
// ERROR HANDLING
// ====================

// 404 handler for API
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      type: 'error',
      message: 'API endpoint not found',
      requestedUrl: req.url,
      method: req.method
    });
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    type: 'error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export app
module.exports = app;