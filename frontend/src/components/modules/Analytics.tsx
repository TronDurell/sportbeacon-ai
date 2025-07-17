import React from 'react';
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';

const Analytics: React.FC = () => {
  const stats = [
    { label: 'Total Users', value: '1,234', icon: Users, change: '+12%' },
    { label: 'Active Sessions', value: '456', icon: TrendingUp, change: '+8%' },
    { label: 'Events This Month', value: '89', icon: Calendar, change: '+15%' },
    { label: 'Engagement Rate', value: '78%', icon: BarChart3, change: '+5%' }
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600">{stat.change}</span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">User Growth</h4>
            <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-500">Chart placeholder</span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Engagement Metrics</h4>
            <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-500">Chart placeholder</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 