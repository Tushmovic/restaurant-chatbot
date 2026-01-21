const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  status: String,
  paymentStatus: String,
  paymentReference: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('OrderHistory', orderHistorySchema);