const { body } = require('express-validator');

const orderValidators = [
  body('itemId').isInt({ min: 1, max: 20 }).withMessage('Invalid item ID'),
  body('quantity').optional().isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1-10'),
  body('sessionId').notEmpty().withMessage('Session ID is required')
];

const paymentValidators = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
  body('orderId').isMongoId().withMessage('Valid order ID is required')
];

const scheduleValidators = [
  body('scheduledFor').isISO8601().withMessage('Valid date is required'),
  body('orderId').isMongoId().withMessage('Valid order ID is required')
];

module.exports = {
  orderValidators,
  paymentValidators,
  scheduleValidators
};