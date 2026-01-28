import React from 'react';

const OptionButton = ({ option, onSelect, disabled }) => {
  return (
    <button
      onClick={() => onSelect(option.value)}
      disabled={disabled}
      className={`w-full text-left px-4 py-3 mb-2 rounded-lg border transition ${
        disabled 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'bg-white hover:bg-gray-50 border-gray-300'
      }`}
    >
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
          {option.value}
        </div>
        <span className="font-medium">{option.label}</span>
      </div>
    </button>
  );
};

export default OptionButton;