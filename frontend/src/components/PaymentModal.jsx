import React, { useState } from 'react';
import { FiCreditCard, FiX } from 'react-icons/fi';

const PaymentModal = ({ order, onClose, onPayment }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onPayment(email);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Complete Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <FiX size={24} />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-green-600">₦{order.totalAmount}</div>
            <div className="text-gray-600">{order.items.length} items</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email for receipt</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700"
            >
              <FiCreditCard /> Pay with Paystack
            </button>
            
            <div className="text-center text-sm text-gray-600">
              Test card: <code>4242 4242 4242 4242</code>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;