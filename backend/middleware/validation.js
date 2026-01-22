const { validationResult } = require('express-validator');

const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      type: 'error',
      message: 'Invalid input',
      errors: errors.array()
    });
  }
  next();
};

const generateSessionId = (req) => {
  // Generate session ID based on device
  return req.headers['user-agent'] + '-' + Date.now();
};

module.exports = { validateInput, generateSessionId };