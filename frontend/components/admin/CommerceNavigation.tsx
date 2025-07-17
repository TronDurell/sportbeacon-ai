import React from 'react';

const CommerceNavigation: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🛍️ Commerce Features
          </h2>
          <p className="text-gray-600">
            AI-powered shopping, social commerce, and bulk procurement
          </p>
        </div>
        <div className="flex space-x-3">
          <a
            href="/commerce"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🏠 Commerce Hub
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <a
          href="/commerce/shop"
          className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🛒</div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Shopping Assistant</h3>
              <p className="text-sm text-gray-600">Smart product recommendations</p>
            </div>
          </div>
        </a>
        
        <a
          href="/commerce/social"
          className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">👥</div>
            <div>
              <h3 className="font-semibold text-gray-900">Social Commerce Feed</h3>
              <p className="text-sm text-gray-600">Buy & sell used gear locally</p>
            </div>
          </div>
        </a>
        
        <a
          href="/commerce/procurement"
          className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🏢</div>
            <div>
              <h3 className="font-semibold text-gray-900">Bulk Procurement</h3>
              <p className="text-sm text-gray-600">AI-optimized team purchasing</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};

export default CommerceNavigation; 