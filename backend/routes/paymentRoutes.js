const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const OrderHistory = require('../models/OrderHistory');

// Paystack test credentials
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_test_key';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_your_test_key';

// Initialize payment
router.post('/initialize', async (req, res) => {
  try {
    const { sessionId, orderId, email, amount } = req.body;
    
    // Validate input
    if (!sessionId || !orderId || !email || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Verify order exists and is placed
    const order = await Order.findById(orderId);
    if (!order || order.sessionId !== sessionId || order.status !== 'placed') {
      return res.status(400).json({ message: 'Invalid order' });
    }
    
    // Call Paystack API
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Convert to kobo
        metadata: {
          sessionId,
          orderId: orderId.toString()
        }
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
        authorization_url: response.data.data.authorization_url,
        reference: response.data.data.reference,
        access_code: response.data.data.access_code
      });
    } else {
      throw new Error('Failed to initialize payment');
    }
    
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ message: 'Error initializing payment' });
  }
});

// Verify payment
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
      const { metadata, amount, status } = response.data.data;
      
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
            { paymentStatus: 'paid' }
          );
        }
        
        res.json({
          success: true,
          message: 'Payment successful!',
          amount: amount / 100
        });
      } else {
        res.json({
          success: false,
          message: 'Payment failed or pending'
        });
      }
    } else {
      throw new Error('Payment verification failed');
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
});

// Get Paystack public key
router.get('/public-key', (req, res) => {
  res.json({ publicKey: PAYSTACK_PUBLIC_KEY });
});

module.exports = router;