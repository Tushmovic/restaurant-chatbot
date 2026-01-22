const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

const validateMenuSelection = (selection) => {
  const validSelections = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  return validSelections.includes(selection.toString());
};

const getDeviceSessionId = (req) => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.connection.remoteAddress;
  return `${userAgent}-${ip}-${Date.now()}`.replace(/\s+/g, '-');
};

module.exports = {
  formatCurrency,
  generateOrderNumber,
  validateMenuSelection,
  getDeviceSessionId
};