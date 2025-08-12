import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  DollarSign, 
  FileText,
  UserPlus,
  UserCheck,
  UserX,
  Crown,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedComponent from '../auth/RoleBasedComponent';
import type { UserRole, Permission } from '../../types/auth';
import { ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS, getAssignableRoles } from '../../config/rolePermissions';

/**
 * Admin Dashboard Component
 * Demonstrates role-based access control and permission management
 */
const AdminDashboard: React.FC = () => {
  const { authState, assignRole, removeRole, hasPermission } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('guest');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // Mock user data - in real app, this would come from Firestore
  const mockUsers = [
    {
      id: '1',
      email: 'admin@sportbeacon.ai',
      displayName: 'System Administrator',
      role: 'admin' as UserRole,
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      email: 'coach@sportbeacon.ai',
      displayName: 'John Coach',
      role: 'coach' as UserRole,
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2024-01-15')
    },
    {
      id: '3',
      email: 'athlete@sportbeacon.ai',
      displayName: 'Sarah Athlete',
      role: 'athlete' as UserRole,
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2024-01-20')
    },
    {
      id: '4',
      email: 'creator@sportbeacon.ai',
      displayName: 'Mike Creator',
      role: 'creator' as UserRole,
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2024-01-25')
    }
  ];

  // Filter users based on search and role filter
  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle role assignment
  const handleAssignRole = async (userId: string, role: UserRole) => {
    try {
      await assignRole(userId, role, 'Admin role assignment');
      alert(`Role ${ROLE_DISPLAY_NAMES[role]} assigned successfully`);
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Failed to assign role');
    }
  };

  // Handle role removal
  const handleRemoveRole = async (userId: string) => {
    try {
      await removeRole(userId, 'Admin role removal');
      alert('Role removed successfully');
    } catch (error) {
      console.error('Error removing role:', error);
      alert('Failed to remove role');
    }
  };

  // Get assignable roles for current user
  const assignableRoles = authState.role ? getAssignableRoles(authState.role) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {authState.profile?.displayName} ({ROLE_DISPLAY_NAMES[authState.role || 'guest']})
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Active
              </div>
              <div className="text-sm text-gray-500">
                Last login: {authState.profile?.lastLoginAt ? 
                  (authState.profile.lastLoginAt instanceof Date 
                    ? authState.profile.lastLoginAt.toLocaleDateString()
                    : authState.profile.lastLoginAt.toDate?.()?.toLocaleDateString() || 'Invalid date')
                  : 'Never'}
              </div>
            </div>
          </div>
        </div>

        {/* Permission-based Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <RoleBasedComponent permission="users.read">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{mockUsers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </RoleBasedComponent>

          <RoleBasedComponent permission="analytics.read">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-green-600">1,234</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </RoleBasedComponent>

          <RoleBasedComponent permission="payments.read">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">$45,678</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </RoleBasedComponent>

          <RoleBasedComponent permission="system.settings">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <p className="text-2xl font-bold text-orange-600">Healthy</p>
                </div>
                <Settings className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </RoleBasedComponent>
        </div>

        {/* User Management Section */}
        <RoleBasedComponent permission="users.read">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <RoleBasedComponent permission="users.create">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Add User</span>
                  </button>
                </RoleBasedComponent>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="text-gray-400 w-4 h-4" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    {Object.entries(ROLE_DISPLAY_NAMES).map(([role, displayName]) => (
                      <option key={role} value={role}>{displayName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.displayName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Crown className="w-4 h-4 text-yellow-500" />
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {ROLE_DISPLAY_NAMES[user.role]}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {ROLE_DESCRIPTIONS[user.role]}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.isActive ? (
                            <UserCheck className="w-4 h-4 text-green-500 mr-2" />
                          ) : (
                            <UserX className="w-4 h-4 text-red-500 mr-2" />
                          )}
                          <span className={`text-sm font-medium ${
                            user.isActive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLoginAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <RoleBasedComponent permission="users.read">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                          </RoleBasedComponent>
                          
                          <RoleBasedComponent permission="users.update">
                            <button className="text-green-600 hover:text-green-900">
                              <Edit className="w-4 h-4" />
                            </button>
                          </RoleBasedComponent>
                          
                          <RoleBasedComponent permission="users.roles.assign">
                            <select
                              value={user.role}
                              onChange={(e) => handleAssignRole(user.id, e.target.value as UserRole)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              {assignableRoles.map(role => (
                                <option key={role} value={role}>
                                  {ROLE_DISPLAY_NAMES[role]}
                                </option>
                              ))}
                            </select>
                          </RoleBasedComponent>
                          
                          <RoleBasedComponent permission="users.delete">
                            <button 
                              onClick={() => handleRemoveRole(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </RoleBasedComponent>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </RoleBasedComponent>

        {/* Permission-based Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Analytics Section */}
          <RoleBasedComponent permission="analytics.read">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User Growth</span>
                  <span className="text-sm font-medium text-green-600">+12.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Sessions</span>
                  <span className="text-sm font-medium text-blue-600">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="text-sm font-medium text-purple-600">$45,678</span>
                </div>
              </div>
            </div>
          </RoleBasedComponent>

          {/* System Status Section */}
          <RoleBasedComponent permission="system.settings">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="text-sm font-medium text-green-600">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Services</span>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="text-sm font-medium text-yellow-600">75% Used</span>
                </div>
              </div>
            </div>
          </RoleBasedComponent>
        </div>

        {/* Permission Denied Fallback */}
        <RoleBasedComponent 
          permission="users.read"
          fallback={
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <Shield className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Access Restricted</h3>
              <p className="text-yellow-700">
                You don't have permission to view user management features.
              </p>
            </div>
          }
        >
          <div></div>
        </RoleBasedComponent>
      </div>
    </div>
  );
};

export default AdminDashboard; 