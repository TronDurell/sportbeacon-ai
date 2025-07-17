import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AdminAuthContext';
import PlayerLayout from '../layouts/PlayerLayout';
import CoachLayout from '../layouts/CoachLayout';
import ParentLayout from '../layouts/ParentLayout';
import AdminLayout from '../layouts/AdminLayout';
import MissionAnalyticsPanel from '../../modules/AdminTools/MissionAnalyticsPanel';
import LiberationStatsDashboard from '../../modules/AdminTools/LiberationStatsDashboard';
import RecAdminHub from '../../modules/TownRecSystem/RecAdminHub';
import RecAuditPanel from '../../modules/AdminTools/RecAuditPanel';
import TownCarySandbox from '../../modules/TownRecSystem/TownCarySandbox';
import UnifiedDashboard from '../modules/Dashboard/UnifiedDashboard';

const RoleRouter: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to SportBeacon AI</h2>
          <p className="text-gray-600 mb-6">
            Please log in to access your personalized sports management dashboard.
          </p>
          <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user has Town Staff role
  const hasTownStaffRole = ['TownStaff', 'RecDirector', 'RecCoordinator'].includes(user.role);

  return (
    <Router>
      <Routes>
        {/* Player Routes */}
        <Route path="/player/*" element={
          user.role === 'player' ? <PlayerLayout /> : <Navigate to="/" replace />
        } />
        
        {/* Coach Routes */}
        <Route path="/coach/*" element={
          user.role === 'coach' ? <CoachLayout /> : <Navigate to="/" replace />
        } />
        
        {/* Parent Routes */}
        <Route path="/parent/*" element={
          user.role === 'parent' ? <ParentLayout /> : <Navigate to="/" replace />
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={
          user.role === 'admin' ? (
            <AdminLayout>
              <Routes>
                <Route path="/" element={<UnifiedDashboard />} />
                <Route path="/mission-analytics" element={<MissionAnalyticsPanel />} />
                <Route path="/liberation-stats" element={<LiberationStatsDashboard />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </AdminLayout>
          ) : <Navigate to="/" replace />
        } />

        {/* Town Rec Routes - Only accessible by Town Staff */}
        <Route path="/admin/rec-admin" element={
          hasTownStaffRole ? <RecAdminHub /> : <Navigate to="/" replace />
        } />
        
        <Route path="/admin/rec-audit" element={
          hasTownStaffRole ? <RecAuditPanel /> : <Navigate to="/" replace />
        } />
        
        <Route path="/admin/rec-sandbox" element={
          hasTownStaffRole ? <TownCarySandbox /> : <Navigate to="/" replace />
        } />
        
        {/* Default Route - Redirect to role-specific dashboard */}
        <Route path="/" element={
          <Navigate to={`/${user.role}`} replace />
        } />
        
        {/* Catch all - redirect to role dashboard */}
        <Route path="*" element={
          <Navigate to={`/${user.role}`} replace />
        } />
      </Routes>
    </Router>
  );
};

export default RoleRouter; 