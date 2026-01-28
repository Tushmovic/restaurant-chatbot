const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const OrderHistory = require('../models/OrderHistory');

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Initialize payment
router.post('/initialize', async (req, res) => {
  try {
    const { sessionId, orderId, email, amount } = req.body;
    
    // Validate input
    if (!sessionId || !orderId || !email || !amount) {
      return res.status(400).json({ 
        type: 'error',
        message: 'Missing required fields: sessionId, orderId, email, amount' 
      });
    }
    
    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        type: 'error',
        message: 'Order not found' 
      });
    }
    
    if (order.sessionId !== sessionId) {
      return res.status(403).json({ 
        type: 'error',
        message: 'Order does not belong to this session' 
      });
    }
    
    if (order.status !== 'placed') {
      return res.status(400).json({ 
        type: 'error',
        message: 'Order is not ready for payment' 
      });
    }
    
    // Prepare metadata for Paystack
    const metadata = {
      sessionId,
      orderId: orderId.toString(),
      orderNumber: `ORD-${order._id.toString().slice(-6)}`
    };
    
    // Initialize Paystack payment
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Convert to kobo
        metadata,
        callback_url: `${BASE_URL}/api/payment/callback`
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.status) {
      // Update order with payment reference
      order.paymentReference = response.data.data.reference;
      await order.save();
      
      res.json({
        type: 'payment',
        message: 'Payment initialized successfully',
        authorization_url: response.data.data.authorization_url,
        reference: response.data.data.reference,
        access_code: response.data.data.access_code,
        amount: amount
      });
    } else {
      throw new Error('Paystack initialization failed');
    }
    
  } catch (error) {
    console.error('Payment initialization error:', error);
    
    // User-friendly error messages
    let errorMessage = 'Error initializing payment';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      type: 'error',
      message: errorMessage
    });
  }
});

// Payment verification endpoint
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );
    
    if (response.data.status) {
      const transaction = response.data.data;
      const { metadata, amount, status } = transaction;
      
      if (status === 'success') {
        // Update order payment status
        const order = await Order.findById(metadata.orderId);
        if (order) {
          order.paymentStatus = 'paid';
          order.status = 'paid';
          await order.save();
          
          // Update order history
          await OrderHistory.findOneAndUpdate(
            { orderId: order._id },
            { 
              paymentStatus: 'paid',
              paymentReference: reference,
              status: 'paid'
            }
          );
        }
        
        res.json({
          success: true,
          message: 'Payment successful!',
          amount: amount / 100,
          reference: reference,
          orderId: metadata.orderId
        });
      } else {
        res.json({
          success: false,
          message: `Payment ${status}`,
          status: status
        });
      }
    } else {
      res.json({
        success: false,
        message: 'Payment verification failed'
      });
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment'
    });
  }
});

// Payment callback (for Paystack webhook)
router.get('/callback', async (req, res) => {
  try {
    const { reference, trxref } = req.query;
    const paymentRef = reference || trxref;
    
    if (!paymentRef) {
      return res.redirect('/?payment=error&message=No reference provided');
    }
    
    // Verify payment
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${paymentRef}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );
    
    if (response.data.status && response.data.data.status === 'success') {
      const { metadata } = response.data.data;
      
      // Update order
      await Order.findByIdAndUpdate(metadata.orderId, {
        paymentStatus: 'paid',
        status: 'paid'
      });
      
      // Redirect to success page
      return res.redirect('/?payment=success&orderId=' + metadata.orderId);
    } else {
      return res.redirect('/?payment=failed&reference=' + paymentRef);
    }
    
  } catch (error) {
    console.error('Callback error:', error);
    return res.redirect('/?payment=error');
  }
});

// Get Paystack public key
router.get('/public-key', (req, res) => {
  res.json({
    publicKey: PAYSTACK_PUBLIC_KEY,
    testMode: true
  });
});

module.exports = router;