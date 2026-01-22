const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');

// Paystack webhook
router.post('/paystack-webhook', async (req, res) => {
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Unauthorized');
  }

  const event = req.body;
  
  if (event.event === 'charge.success') {
    const { reference, metadata } = event.data;
    
    try {
      const order = await Order.findOne({ 
        paymentReference: reference,
        _id: metadata.orderId 
      });
      
      if (order) {
        order.paymentStatus = 'paid';
        order.status = 'paid';
        await order.save();
        
        console.log(`Payment successful for order: ${order._id}`);
      }
    } catch (error) {
      console.error('Webhook error:', error);
    }
  }
  
  res.status(200).json({ received: true });
});

module.exports = router;