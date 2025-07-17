import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminRole } from '../../contexts/AdminAuthContext';

interface DashboardCard {
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
  stats?: {
    count: number;
    label: string;
    trend?: 'up' | 'down' | 'neutral';
  };
}

export const AdminDashboard: React.FC = () => {
  const { user, canViewPlayers, canApproveRegistrations, canManageWaitlist, canManageSiblings, canApproveAgeExceptions, canViewIncidents, canManageScores, canViewPayments, canProcessRefunds, canManageReferees, canViewLeagueDashboard } = useAdminRole();

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Player Registration Review',
      description: 'Review and approve player registrations with AI-powered flagging',
      path: '/admin/player-reviews',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      permission: 'approve_registrations',
      stats: {
        count: 23,
        label: 'Pending Reviews',
        trend: 'up'
      }
    },
    {
      title: 'Waitlist Manager',
      description: 'Manage waitlists and auto-fill roster gaps with smart matching',
      path: '/admin/waitlist',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      permission: 'manage_waitlist',
      stats: {
        count: 156,
        label: 'Waitlisted Players',
        trend: 'neutral'
      }
    },
    {
      title: 'Sibling Team Placement',
      description: 'Group siblings and manage team assignments with AI suggestions',
      path: '/admin/siblings',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      permission: 'manage_siblings',
      stats: {
        count: 12,
        label: 'Sibling Groups',
        trend: 'down'
      }
    },
    {
      title: 'Age Exception Requests',
      description: 'Review and approve age exception requests with 1-click approval',
      path: '/admin/age-exceptions',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      permission: 'approve_age_exceptions',
      stats: {
        count: 8,
        label: 'Pending Requests',
        trend: 'up'
      }
    },
    {
      title: 'Incident & Score Reports',
      description: 'Review incidents, resolve scores, and manage comment logs',
      path: '/admin/reports',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      permission: 'view_incidents',
      stats: {
        count: 5,
        label: 'New Reports',
        trend: 'neutral'
      }
    },
    {
      title: 'Referee Scheduler',
      description: 'Schedule referees with weekly calendar and skill-based matching',
      path: '/admin/referee-scheduler',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      permission: 'manage_referees',
      stats: {
        count: 18,
        label: 'Unassigned Games',
        trend: 'up'
      }
    },
    {
      title: 'League Overview Dashboard',
      description: 'Comprehensive view of league operations and statistics',
      path: '/admin/league-dashboard',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      permission: 'view_league_dashboard',
      stats: {
        count: 4,
        label: 'Active Leagues',
        trend: 'neutral'
      }
    },
    {
      title: 'Payments & Refunds',
      description: 'Manage payments, process refunds, and view financial data',
      path: '/admin/payments',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      permission: 'view_payments',
      stats: {
        count: 234,
        label: 'Total Revenue',
        trend: 'up'
      }
    }
  ];

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true;
    
    switch (permission) {
      case 'approve_registrations':
        return canApproveRegistrations;
      case 'manage_waitlist':
        return canManageWaitlist;
      case 'manage_siblings':
        return canManageSiblings;
      case 'approve_age_exceptions':
        return canApproveAgeExceptions;
      case 'view_incidents':
        return canViewIncidents;
      case 'manage_scores':
        return canManageScores;
      case 'view_payments':
        return canViewPayments;
      case 'process_refunds':
        return canProcessRefunds;
      case 'manage_referees':
        return canManageReferees;
      case 'view_league_dashboard':
        return canViewLeagueDashboard;
      default:
        return true;
    }
  };

  const filteredCards = dashboardCards.filter(card => hasPermission(card.permission));

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Town-Rec Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}. Here's what needs your attention today.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Current Role</div>
              <div className="text-lg font-semibold text-gray-900">
                {user?.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Actions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredCards.reduce((total, card) => total + (card.stats?.count || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <p className="text-2xl font-semibold text-gray-900">47</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">System Status</p>
              <p className="text-2xl font-semibold text-green-600">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                  <div className="text-blue-600 group-hover:text-blue-700">
                    {card.icon}
                  </div>
                </div>
                {card.stats && (
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(card.stats.trend)}
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{card.stats.count}</div>
                      <div className="text-xs text-gray-500">{card.stats.label}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                {card.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {card.description}
              </p>
              
              <div className="flex items-center text-blue-600 group-hover:text-blue-700 transition-colors duration-200">
                <span className="text-sm font-medium">Access Panel</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Player registration approved</p>
                <p className="text-sm text-gray-500">Sarah Johnson - Spring Soccer League</p>
              </div>
              <div className="text-sm text-gray-500">2 minutes ago</div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New waitlist entry added</p>
                <p className="text-sm text-gray-500">Michael Chen - Summer Baseball League</p>
              </div>
              <div className="text-sm text-gray-500">15 minutes ago</div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Incident report submitted</p>
                <p className="text-sm text-gray-500">Coach Smith - Fall Football League</p>
              </div>
              <div className="text-sm text-gray-500">1 hour ago</div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Payment processed</p>
                <p className="text-sm text-gray-500">$150.00 - Registration fee</p>
              </div>
              <div className="text-sm text-gray-500">2 hours ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 