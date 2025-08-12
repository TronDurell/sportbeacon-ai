import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Plus,
  Settings,
  BarChart3,
  CreditCard,
  Banknote,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import useStripePayouts from '../hooks/useStripePayouts';
import type { PayoutFormData, PayoutFilters } from '../types/stripePayout';

/**
 * Comprehensive Payout Dashboard for Creators
 * Manages payouts, accounts, schedules, and analytics
 */
const PayoutDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts' | 'accounts' | 'schedule' | 'analytics'>('overview');
  const [showCreatePayout, setShowCreatePayout] = useState(false);
  const [payoutFilters, setPayoutFilters] = useState<PayoutFilters>({});
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'week' | 'month' | 'year'>('month');

  const {
    usePayouts,
    usePayoutAccounts,
    usePayoutSchedule,
    usePayoutSettings,
    usePayoutAnalytics,
    usePayoutLimits,
    formatAmount,
    getPayoutStatusColor,
    getPayoutStatusIcon
  } = useStripePayouts();

  // Hooks
  const { payouts, loading: payoutsLoading, createPayout, cancelPayout, retryPayout } = usePayouts(payoutFilters);
  const { accounts, loading: accountsLoading, addAccount, removeAccount } = usePayoutAccounts();
  const { schedule, loading: scheduleLoading, updateSchedule } = usePayoutSchedule();
  const { settings, loading: settingsLoading, updateSettings } = usePayoutSettings();
  const { analytics, loading: analyticsLoading } = usePayoutAnalytics(analyticsPeriod);
  const { limits, loading: limitsLoading } = usePayoutLimits();

  // Payout form state
  const [payoutForm, setPayoutForm] = useState<PayoutFormData>({
    amount: 0,
    currency: 'usd',
    destination: '',
    description: ''
  });

  // Handle payout creation
  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPayout(payoutForm);
      setShowCreatePayout(false);
      setPayoutForm({ amount: 0, currency: 'usd', destination: '', description: '' });
    } catch (error) {
      console.error('Failed to create payout:', error);
    }
  };

  // Handle payout cancellation
  const handleCancelPayout = async (payoutId: string) => {
    if (window.confirm('Are you sure you want to cancel this payout?')) {
      try {
        await cancelPayout(payoutId);
      } catch (error) {
        console.error('Failed to cancel payout:', error);
      }
    }
  };

  // Handle payout retry
  const handleRetryPayout = async (payoutId: string) => {
    try {
      await retryPayout(payoutId);
    } catch (error) {
      console.error('Failed to retry payout:', error);
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    totalPayouts: payouts.length,
    totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    failedAmount: payouts.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0),
    successRate: payouts.length > 0 ? (payouts.filter(p => p.status === 'paid').length / payouts.length) * 100 : 0
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payout Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your earnings and payouts</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreatePayout(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Payout</span>
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold text-blue-600">{summaryStats.totalPayouts}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(summaryStats.totalAmount, 'usd')}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatAmount(summaryStats.pendingAmount, 'usd')}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {summaryStats.successRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'payouts', label: 'Payouts', icon: DollarSign },
                { id: 'accounts', label: 'Accounts', icon: CreditCard },
                { id: 'schedule', label: 'Schedule', icon: Calendar },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
              
              {/* Recent Payouts */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Payouts</h3>
                <div className="space-y-3">
                  {payouts.slice(0, 5).map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={getPayoutStatusColor(payout.status)}>
                          {getPayoutStatusIcon(payout.status)}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{payout.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(payout.created * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatAmount(payout.amount, payout.currency)}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">{payout.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analytics Summary */}
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">This {analyticsPeriod}</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatAmount(analytics.totalAmount, analytics.currency)}
                    </p>
                    <p className="text-sm text-blue-700">{analytics.totalPayouts} payouts</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Success Rate</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.successRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-green-700">{analytics.failedPayouts} failed</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Average Payout</h4>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatAmount(analytics.averagePayout, analytics.currency)}
                    </p>
                    <p className="text-sm text-purple-700">per payout</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Payouts</h2>
                <div className="flex space-x-2">
                  <select
                    value={payoutFilters.status || ''}
                    onChange={(e) => setPayoutFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  <button
                    onClick={() => window.location.reload()}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {payoutsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading payouts...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payout.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatAmount(payout.amount, payout.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={getPayoutStatusColor(payout.status)}>
                                {getPayoutStatusIcon(payout.status)}
                              </span>
                              <span className={`text-sm font-medium ${getPayoutStatusColor(payout.status)}`}>
                                {payout.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payout.created * 1000).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {payout.status === 'pending' && (
                                <button
                                  onClick={() => handleCancelPayout(payout.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              )}
                              {payout.status === 'failed' && (
                                <button
                                  onClick={() => handleRetryPayout(payout.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Retry
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Payout Accounts</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Account</span>
                </button>
              </div>

              {accountsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading accounts...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accounts.map((account) => (
                    <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {account.type === 'bank_account' ? (
                            <Banknote className="w-5 h-5 text-blue-500" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-green-500" />
                          )}
                          <span className="font-medium text-gray-900">
                            {account.type === 'bank_account' ? 'Bank Account' : 'Debit Card'}
                          </span>
                        </div>
                        <button
                          onClick={() => removeAccount(account.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          {account.account_holder_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          ****{account.last4}
                        </p>
                        <p className="text-sm text-gray-600">
                          {account.bank_name || account.country}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            account.status === 'verified' ? 'bg-green-100 text-green-800' :
                            account.status === 'validated' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {account.status}
                          </span>
                          {account.default_for_currency && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payout Schedule</h2>
              
              {scheduleLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading schedule...</p>
                </div>
              ) : schedule ? (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Current Schedule</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Interval:</span> {schedule.interval}
                        </p>
                        {schedule.weekly_anchor && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Day:</span> {schedule.weekly_anchor}
                          </p>
                        )}
                        {schedule.monthly_anchor && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Day:</span> {schedule.monthly_anchor}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Delay:</span> {schedule.delay_days} days
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Update Schedule</h3>
                      <div className="space-y-3">
                        <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                          <option value="manual">Manual</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                          Update Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No payout schedule configured</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
                <select
                  value={analyticsPeriod}
                  onChange={(e) => setAnalyticsPeriod(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              {analyticsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading analytics...</p>
                </div>
              ) : analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Payouts</h3>
                    <p className="text-2xl font-bold text-blue-600">{analytics.totalPayouts}</p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Amount</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {formatAmount(analytics.totalAmount, analytics.currency)}
                    </p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Success Rate</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {analytics.successRate.toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Average Payout</h3>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatAmount(analytics.averagePayout, analytics.currency)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No analytics data available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Payout Modal */}
        {showCreatePayout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Payout</h3>
              
              <form onSubmit={handleCreatePayout} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={payoutForm.currency}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="usd">USD</option>
                    <option value="eur">EUR</option>
                    <option value="gbp">GBP</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Account
                  </label>
                  <select
                    value={payoutForm.destination}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, destination: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_holder_name} - ****{account.last4}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={payoutForm.description}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Payout description"
                    required
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Create Payout
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreatePayout(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutDashboard; 