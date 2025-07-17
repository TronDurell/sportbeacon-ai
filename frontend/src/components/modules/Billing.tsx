import React from 'react';
import { CreditCard, Receipt } from 'lucide-react';

const Billing: React.FC = () => {
  const billingData = {
    currentPlan: 'Pro Plan',
    nextBilling: '2024-02-15',
    amount: '$99.00',
    usage: {
      users: 45,
      limit: 100,
      storage: '2.3GB',
      storageLimit: '10GB'
    }
  };

  const payments = [
    {
      id: '1',
      description: 'Pro Plan',
      amount: 99.00,
      date: new Date('2024-01-15'),
      status: 'completed'
    },
    {
      id: '2',
      description: 'Pro Plan',
      amount: 99.00,
      date: new Date('2024-01-10'),
      status: 'completed'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Billing & Subscription</h2>
        <div className="flex items-center space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Make Payment</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">{billingData.currentPlan}</p>
                <p className="text-gray-600">Next billing: {billingData.nextBilling}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{billingData.amount}</p>
                <p className="text-gray-600">per month</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Users</span>
                  <span>{billingData.usage.users}/{billingData.usage.limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(billingData.usage.users / billingData.usage.limit) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Storage</span>
                  <span>{billingData.usage.storage}/{billingData.usage.storageLimit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: '23%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Update Payment</span>
              </button>
              <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center justify-center space-x-2">
                <Receipt className="w-4 h-4" />
                <span>Download Invoice</span>
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{payment.description}</p>
                    <p className="text-sm text-gray-600">{payment.date.toLocaleDateString()}</p>
                  </div>
                  <span className="text-green-600 font-medium">${payment.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing; 