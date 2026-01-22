const axios = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

const initializePayment = async (email, amount, metadata) => {
  try {
    const response = await paystack.post('/transaction/initialize', {
      email,
      amount: amount * 100, // Convert to kobo
      metadata,
      callback_url: `${process.env.BASE_URL}/api/payment/verify`
    });
    return response.data;
  } catch (error) {
    throw new Error(`Paystack initialization failed: ${error.message}`);
  }
};

const verifyPayment = async (reference) => {
  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    throw new Error(`Paystack verification failed: ${error.message}`);
  }
};

module.exports = {
  PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY,
  initializePayment,
  verifyPayment
};