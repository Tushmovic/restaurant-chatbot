import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { FiSend, FiShoppingCart, FiClock, FiCheckCircle } from 'react-icons/fi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://restaurant-chatbot-backend.onrender.com/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize session
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chatbot_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem('chatbot_session_id', newSessionId);
    }
  }, []);

  // Load initial welcome message
  useEffect(() => {
    if (sessionId) {
      loadWelcomeMessage();
    }
  }, [sessionId]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadWelcomeMessage = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/welcome`);
      setMessages([{
        id: 1,
        text: response.data.message,
        sender: 'bot',
        options: response.data.options
      }]);
    } catch (error) {
      console.error('Error loading welcome message:', error);
      addMessage('bot', 'Welcome to FoodieBot! How can I help you today?');
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (sender, text, options = null, data = null) => {
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      text,
      sender,
      options,
      data
    }]);
  };

  const handleOptionSelect = async (value) => {
    if (isLoading) return;

    setIsLoading(true);
    
    // Add user's selection to chat
    const optionLabel = getOptionLabel(value, messages[messages.length - 1].options);
    addMessage('user', `Selected: ${optionLabel}`);

    try {
      switch(value) {
        case '1': // Place order
          await handlePlaceOrder();
          break;
        
        case '97': // Current order
          await handleCurrentOrder();
          break;
        
        case '99': // Checkout
          await handleCheckout();
          break;
        
        case '98': // Order history
          await handleOrderHistory();
          break;
        
        case '0': // Cancel order
          await handleCancelOrder();
          break;
        
        default:
          // Handle menu item selection
          if (parseInt(value) >= 1 && parseInt(value) <= 10) {
            await handleAddToOrder(value);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling option:', error);
      addMessage('bot', 'Sorry, something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/menu`);
      addMessage('bot', response.data.message, response.data.items);
    } catch (error) {
      console.error('Error loading menu:', error);
      addMessage('bot', 'Sorry, could not load menu. Please try again.');
    }
  };

  const handleAddToOrder = async (itemId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/add-item`, {
        sessionId,
        itemId
      });
      
      addMessage('bot', response.data.message);
      
      // Show current order after adding
      setTimeout(() => {
        handleCurrentOrder();
      }, 1000);
      
    } catch (error) {
      console.error('Error adding item:', error);
      addMessage('bot', 'Sorry, could not add item to order. Please try again.');
    }
  };

  const handleCurrentOrder = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/current-order/${sessionId}`);
      addMessage('bot', response.data.message, response.data.options, response.data.order);
    } catch (error) {
      console.error('Error getting current order:', error);
      addMessage('bot', 'Sorry, could not retrieve your order. Please try again.');
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/checkout/${sessionId}`);
      addMessage('bot', response.data.message, response.data.options, response.data.order);
      
      if (response.data.paymentRequired) {
        setCurrentOrder(response.data.order);
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      addMessage('bot', 'Sorry, could not process checkout. Please try again.');
    }
  };

  const handleOrderHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/order-history/${sessionId}`);
      addMessage('bot', response.data.message, null, response.data.history);
    } catch (error) {
      console.error('Error getting order history:', error);
      addMessage('bot', 'Sorry, could not retrieve order history. Please try again.');
    }
  };

  const handleCancelOrder = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat/cancel-order/${sessionId}`);
      addMessage('bot', response.data.message, response.data.options);
    } catch (error) {
      console.error('Error cancelling order:', error);
      addMessage('bot', 'Sorry, could not cancel order. Please try again.');
    }
  };

  const getOptionLabel = (value, options) => {
    if (!options) return value;
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      // For this implementation, we're using option selection only
      // But you could extend this for free-text input
      setInputValue('');
    }
  };

  const handlePayment = async () => {
    if (!currentOrder) return;
    
    // In a real implementation, you would:
    // 1. Initialize payment with Paystack
    // 2. Redirect to payment page
    // 3. Handle payment verification callback
    
    const testEmail = 'customer@example.com';
    
    try {
      const response = await axios.post(`${API_BASE_URL}/payment/initialize`, {
        sessionId,
        orderId: currentOrder._id,
        email: testEmail,
        amount: currentOrder.totalAmount
      });
      
      // Redirect to Paystack payment page
      window.open(response.data.authorization_url, '_blank');
      
      addMessage('bot', 'Payment initiated. Please complete payment in the new tab.');
      
    } catch (error) {
      console.error('Payment error:', error);
      addMessage('bot', 'Sorry, could not initiate payment. Please try again.');
    }
  };

  const renderMessageContent = (message) => {
    if (message.data?.items && Array.isArray(message.data.items)) {
      return (
        <div className="mt-2">
          <div className="bg-gray-50 rounded-lg p-4">
            {message.data.items.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-semibold">₦{item.price * item.quantity}</span>
              </div>
            ))}
            {message.data.totalAmount && (
              <div className="flex justify-between font-bold pt-2">
                <span>Total:</span>
                <span>₦{message.data.totalAmount}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    if (message.data?.history && Array.isArray(message.data.history)) {
      return (
        <div className="mt-2">
          <div className="bg-gray-50 rounded-lg p-4">
            {message.data.history.slice(0, 5).map((order, index) => (
              <div key={index} className="py-2 border-b">
                <div className="flex justify-between">
                  <span className="font-medium">Order #{index + 1}</span>
                  <span className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {order.items.length} items • ₦{order.totalAmount}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return <p className="whitespace-pre-line">{message.text}</p>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <FiShoppingCart size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">FoodieBot</h1>
                <p className="text-gray-600 text-sm">AI Restaurant Assistant</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Session: {sessionId.substring(0, 8)}...
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Chat Assistant</h2>
                <p className="opacity-90">Order your favorite meals easily</p>
              </div>
              <button
                onClick={loadWelcomeMessage}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
              >
                Restart Chat
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-[500px] overflow-y-auto p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-6 ${message.sender === 'bot' ? 'text-left' : 'text-right'}`}
              >
                <div
                  className={`inline-block max-w-[80%] rounded-2xl px-5 py-3 ${
                    message.sender === 'bot'
                      ? 'bg-gray-100 text-gray-800 rounded-tl-none'
                      : 'bg-blue-600 text-white rounded-tr-none'
                  }`}
                >
                  <div className="font-medium mb-1">
                    {message.sender === 'bot' ? 'FoodieBot' : 'You'}
                  </div>
                  {renderMessageContent(message)}
                  
                  {/* Options */}
                  {message.options && (
                    <div className="mt-4 space-y-2">
                      {message.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleOptionSelect(option.value)}
                          disabled={isLoading}
                          className={`block w-full text-left px-4 py-3 rounded-lg transition ${
                            message.sender === 'bot'
                              ? 'bg-white border border-gray-300 hover:bg-gray-50'
                              : 'bg-blue-700 hover:bg-blue-800'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              message.sender === 'bot'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-blue-800'
                            }`}>
                              {option.value}
                            </div>
                            <span>{option.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {message.sender === 'bot' ? 'Bot' : 'You'}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="text-left mb-6">
                <div className="inline-block bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none px-5 py-3">
                  <div className="font-medium mb-1">FoodieBot</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Payment Button (shown when needed) */}
          {currentOrder && (
            <div className="px-6 pb-4">
              <button
                onClick={handlePayment}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition flex items-center justify-center space-x-3"
              >
                <FiCheckCircle size={24} />
                <span>Pay ₦{currentOrder.totalAmount} with Paystack</span>
              </button>
              <p className="text-center text-gray-600 text-sm mt-2">
                Test card: 4242 4242 4242 4242
              </p>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-6">
            <form onSubmit={handleInputSubmit} className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message or select options above..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use the numbered options above to navigate. This input can be extended for free-text responses.
                </p>
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FiSend size={20} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-blue-600 mb-3">
              <FiShoppingCart size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Easy Ordering</h3>
            <p className="text-gray-600">Browse menu and place orders with simple number selections</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-green-600 mb-3">
              <FiCheckCircle size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Secure Payment</h3>
            <p className="text-gray-600">Integrated Paystack payment gateway for safe transactions</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-purple-600 mb-3">
              <FiClock size={28} />
            </div>
            <h3 className="font-bold text-lg mb-2">Order History</h3>
            <p className="text-gray-600">Track all your previous orders in one place</p>
          </div>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-600 text-sm border-t">
        <p>Restaurant ChatBot Assessment • Built with React & Node.js</p>
        <p className="mt-1">Use test card: 4242 4242 4242 4242 for Paystack payments</p>
      </footer>
    </div>
  );
}

export default App;