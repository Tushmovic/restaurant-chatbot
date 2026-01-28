const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderHistory = require('../models/OrderHistory');

// Restaurant menu items
const menuItems = [
  { id: 1, name: 'Jollof Rice', price: 2500, category: 'main' },
  { id: 2, name: 'Fried Rice', price: 2800, category: 'main' },
  { id: 3, name: 'Pounded Yam & Egusi', price: 3200, category: 'main' },
  { id: 4, name: 'Beef Suya', price: 1500, category: 'side' },
  { id: 5, name: 'Chicken Wings (6pcs)', price: 3000, category: 'side' },
  { id: 6, name: 'Cola', price: 300, category: 'drink' },
  { id: 7, name: 'Water', price: 200, category: 'drink' },
  { id: 8, name: 'Chapman', price: 800, category: 'drink' },
  { id: 9, name: 'Chocolate Cake', price: 1200, category: 'dessert' },
  { id: 10, name: 'Ice Cream', price: 800, category: 'dessert' }
];

// Welcome message with options
router.get('/welcome', (req, res) => {
  const welcomeMessage = {
    type: 'options',
    message: 'Welcome to FoodieBot! How can I help you today?',
    options: [
      { value: '1', label: 'Place an order' },
      { value: '99', label: 'Checkout order' },
      { value: '98', label: 'Order history' },
      { value: '97', label: 'Current order' },
      { value: '0', label: 'Cancel order' }
    ]
  };
  
  res.json(welcomeMessage);
});

// Handle menu selection
router.get('/menu', (req, res) => {
  const menuMessage = {
    type: 'menu',
    message: 'Please select items from our menu:',
    items: menuItems.map(item => ({
      value: item.id.toString(),
      label: `${item.name} - ₦${item.price}`,
      price: item.price
    }))
  };
  
  res.json(menuMessage);
});

// Add item to order
router.post('/add-item', async (req, res) => {
  try {
    const { sessionId, itemId } = req.body;
    
    if (!sessionId || !itemId) {
      return res.status(400).json({ message: 'Session ID and item ID are required' });
    }
    
    const selectedItem = menuItems.find(item => item.id === parseInt(itemId));
    if (!selectedItem) {
      return res.status(400).json({ message: 'Invalid item selected' });
    }
    
    // Find or create order for this session
    let order = await Order.findOne({ sessionId, status: 'pending' });
    
    if (!order) {
      order = new Order({
        sessionId,
        items: [],
        totalAmount: 0,
        status: 'pending'
      });
    }
    
    // Check if item already exists in order
    const existingItemIndex = order.items.findIndex(item => item.name === selectedItem.name);
    
    if (existingItemIndex > -1) {
      order.items[existingItemIndex].quantity += 1;
    } else {
      order.items.push({
        name: selectedItem.name,
        price: selectedItem.price,
        quantity: 1,
        category: selectedItem.category
      });
    }
    
    // Update total amount
    order.totalAmount = order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    await order.save();
    
    res.json({
      type: 'success',
      message: `${selectedItem.name} added to your order!`,
      currentOrder: order
    });
    
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ message: 'Error adding item to order' });
  }
});

// Get current order
router.get('/current-order/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const order = await Order.findOne({ sessionId, status: 'pending' });
    
    if (!order || order.items.length === 0) {
      return res.json({
        type: 'message',
        message: 'No current order. Select 1 to start a new order.'
      });
    }
    
    res.json({
      type: 'order',
      message: 'Your current order:',
      order: order,
      options: [
        { value: '1', label: 'Add more items' },
        { value: '99', label: 'Checkout' },
        { value: '0', label: 'Cancel order' }
      ]
    });
    
  } catch (error) {
    console.error('Error getting current order:', error);
    res.status(500).json({ message: 'Error getting current order' });
  }
});

// Checkout order
router.post('/checkout/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const order = await Order.findOne({ sessionId, status: 'pending' });
    
    if (!order || order.items.length === 0) {
      return res.json({
        type: 'message',
        message: 'No order to place. Select 1 to start a new order.'
      });
    }
    
    // Update order status
    order.status = 'placed';
    await order.save();
    
    // Create order history record
    await OrderHistory.create({
      sessionId,
      orderId: order._id,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus
    });
    
    res.json({
      type: 'checkout',
      message: 'Order placed successfully!',
      order: order,
      paymentRequired: true,
      options: [
        { value: 'pay', label: 'Proceed to Payment' },
        { value: '1', label: 'Start New Order' }
      ]
    });
    
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ message: 'Error during checkout' });
  }
});

// Get order history
router.get('/order-history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const history = await OrderHistory.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    if (history.length === 0) {
      return res.json({
        type: 'message',
        message: 'No order history found.'
      });
    }
    
    res.json({
      type: 'history',
      message: 'Your order history:',
      history: history
    });
    
  } catch (error) {
    console.error('Error getting order history:', error);
    res.status(500).json({ message: 'Error getting order history' });
  }
});

// Cancel order
router.post('/cancel-order/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const order = await Order.findOneAndUpdate(
      { sessionId, status: 'pending' },
      { status: 'cancelled' },
      { new: true }
    );
    
    if (!order) {
      return res.json({
        type: 'message',
        message: 'No pending order to cancel.'
      });
    }
    
    res.json({
      type: 'message',
      message: 'Order cancelled successfully.',
      options: [
        { value: '1', label: 'Start New Order' }
      ]
    });
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Error cancelling order' });
  }
});

module.exports = router;