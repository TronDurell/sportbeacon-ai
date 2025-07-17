import React, { useState, useEffect } from 'react';
import { realApiService } from '../../services/realApiService';

interface ProcurementItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  supplier: string;
  inStock: boolean;
}

interface Vendor {
  id: string;
  name: string;
  rating: number;
  specialties: string[];
}

interface PurchaseOrder {
  id: string;
  items: ProcurementItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'shipped' | 'delivered';
  createdAt: Date;
}

const BulkProcurementPortal: React.FC = () => {
  const [items, setItems] = useState<ProcurementItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsResponse, vendorsResponse, ordersResponse] = await Promise.all([
        realApiService.query('procurementItems', { sortBy: 'name' }),
        realApiService.query('vendors', { sortBy: 'name' }),
        realApiService.query('purchaseOrders', { sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      setItems((itemsResponse.data as ProcurementItem[]) || []);
      setVendors((vendorsResponse.data as Vendor[]) || []);
      setPurchaseOrders((ordersResponse.data as PurchaseOrder[]) || []);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBulkOrder = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to order');
      return;
    }

    setLoading(true);
    try {
      const selectedItemDetails = items.filter(item => selectedItems.includes(item.id));
      const totalAmount = selectedItemDetails.reduce((sum, item) => sum + item.unitPrice, 0);

      const orderData = {
        items: selectedItemDetails,
        totalAmount,
        status: 'pending'
      };

      const response = await realApiService.create('purchaseOrders', orderData);
      
      setPurchaseOrders(prev => [response.data as PurchaseOrder, ...prev]);
      setSelectedItems([]);
      
      alert('Bulk order created successfully!');
    } catch (error) {
      alert('Failed to create bulk order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bulk Procurement Portal
        </h1>
        <p className="text-gray-600">
          Manage bulk purchases and vendor relationships
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Available Items</h2>
              <button
                onClick={handleBulkOrder}
                disabled={loading || selectedItems.length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Bulk Order ({selectedItems.length})
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedItems.includes(item.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleItemToggle(item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.category} • {item.supplier}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">${item.unitPrice}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vendors */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Vendors</h2>
            <div className="space-y-3">
              {vendors.slice(0, 5).map((vendor) => (
                <div key={vendor.id} className="p-3 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < vendor.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({vendor.rating})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {vendor.specialties.slice(0, 3).map((specialty, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Orders */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Purchase Orders</h2>
          <div className="space-y-4">
            {purchaseOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                    <p className="text-sm text-gray-600">
                      {order.items.length} items • {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${order.totalAmount}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {order.items.slice(0, 4).map((item) => (
                    <div key={item.id} className="text-sm text-gray-600">
                      {item.name}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="text-sm text-gray-500">
                      +{order.items.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkProcurementPortal; 