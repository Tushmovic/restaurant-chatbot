import React from 'react';

const OrderSummary = ({ items, totalAmount }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-lg mb-3">Order Summary</h3>
      {items.map((item, index) => (
        <div key={index} className="flex justify-between py-2 border-b">
          <div>
            <span className="font-medium">{item.name}</span>
            <span className="text-gray-600 text-sm ml-2">× {item.quantity}</span>
          </div>
          <span className="font-semibold">₦{item.price * item.quantity}</span>
        </div>
      ))}
      <div className="flex justify-between font-bold pt-2 mt-2 border-t">
        <span>Total:</span>
        <span className="text-green-600">₦{totalAmount}</span>
      </div>
    </div>
  );
};

export default OrderSummary;