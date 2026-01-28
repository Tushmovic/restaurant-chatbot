import React from 'react';

const ChatMessage = ({ message, sender }) => {
  return (
    <div className={`mb-4 ${sender === 'bot' ? 'text-left' : 'text-right'}`}>
      <div className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${
        sender === 'bot' 
          ? 'bg-gray-200 text-gray-800' 
          : 'bg-blue-600 text-white'
      }`}>
        <div className="text-sm font-medium mb-1">
          {sender === 'bot' ? 'FoodieBot' : 'You'}
        </div>
        <div className="text-base">{message}</div>
      </div>
    </div>
  );
};

export default ChatMessage;