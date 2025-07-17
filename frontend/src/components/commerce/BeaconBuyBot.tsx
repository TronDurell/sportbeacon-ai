import React, { useState, useCallback } from 'react';
import { useAgentOrchestration } from '../../contexts/AgentOrchestrationContext';

interface ShoppingRequest {
  id: string;
  query: string;
  category: string;
  budget?: number;
  timestamp: Date;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl?: string;
}

const BeaconBuyBot: React.FC = () => {
  const { sendRequest } = useAgentOrchestration();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [searchHistory, setSearchHistory] = useState<ShoppingRequest[]>([]);

  const categories = [
    'Equipment',
    'Apparel',
    'Footwear',
    'Accessories',
    'Training',
    'Nutrition'
  ];

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const request: ShoppingRequest = {
        id: Date.now().toString(),
        query: query.trim(),
        category,
        budget: budget ? parseFloat(budget) : undefined,
        timestamp: new Date()
      };

      // Add to search history
      setSearchHistory(prev => [request, ...prev.slice(0, 9)]);

      // Simulate AI-powered search
      await sendRequest({
        type: 'shopping_search',
        data: request
      });

      // Mock results
      const mockResults: Product[] = [
        {
          id: '1',
          name: 'Professional Soccer Ball',
          price: 29.99,
          category: 'Equipment',
          description: 'High-quality soccer ball for professional training',
          imageUrl: '/images/soccer-ball.jpg'
        },
        {
          id: '2',
          name: 'Moisture-Wicking Jersey',
          price: 24.99,
          category: 'Apparel',
          description: 'Comfortable sports jersey with moisture-wicking technology',
          imageUrl: '/images/jersey.jpg'
        }
      ];

      setResults(mockResults);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  }, [query, category, budget, sendRequest]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Beacon Buy Bot
        </h1>
        <p className="text-gray-600">
          AI-powered sports equipment shopping assistant
        </p>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you looking for?
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., soccer cleats, basketball, training equipment..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (optional)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Enter your budget"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="w-full md:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search Products'}
          </button>
        </div>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h3>
          <div className="space-y-2">
            {searchHistory.slice(0, 5).map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setQuery(search.query);
                  setCategory(search.category);
                  setBudget(search.budget?.toString() || '');
                }}
              >
                <div>
                  <p className="font-medium text-gray-900">{search.query}</p>
                  <p className="text-sm text-gray-600">
                    {search.category} {search.budget && `• $${search.budget}`}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {search.timestamp.toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recommended Products ({results.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {product.imageUrl && (
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Product Image</span>
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">${product.price}</span>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Features */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">AI</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Smart Recommendations</h4>
            <p className="text-sm text-gray-600">
              Get personalized product suggestions based on your needs
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">$</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Price Optimization</h4>
            <p className="text-sm text-gray-600">
              Find the best deals and compare prices across vendors
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">⚡</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Quick Search</h4>
            <p className="text-sm text-gray-600">
              Natural language search for any sports equipment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeaconBuyBot; 