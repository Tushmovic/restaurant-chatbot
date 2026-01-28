/**
 * Restaurant ChatBot - Express Application Configuration
 * This file contains the main Express app setup and middleware configuration
 */

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
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

// ====================
// DATABASE CONNECTION
// ====================
connectDB();

// ====================
// MIDDLEWARE
// ====================

// CORS configuration for Render
const allowedOrigins = [
  'http://localhost:5173',
  'https://restaurant-chatbot-frontend.onrender.com',
  'https://restaurant-chatbot-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Restaurant ChatBot API',
    version: '1.0.0',
    endpoints: {
      chat: '/api/chat',
      payment: '/api/payment',
      webhook: '/api/webhook',
      health: '/health'
    },
    documentation: 'Use /api/chat/welcome to start chatbot',
    frontend: 'https://restaurant-chatbot-frontend.onrender.com'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Restaurant ChatBot API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
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
    method: req.method,
    availableEndpoints: ['/', '/health', '/api', '/api/chat', '/api/payment']
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

// Export app
module.exports = app;