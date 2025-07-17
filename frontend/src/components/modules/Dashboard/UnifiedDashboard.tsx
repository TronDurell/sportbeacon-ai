import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../contexts/AdminAuthContext';
import { useSmartLayer } from '../../../contexts/SmartLayerContext';
import { useAgentOrchestration } from '../../../contexts/AgentOrchestrationContext';
import { useInsightsScan } from '../../../hooks/useInsightsScan';
import { useScrollIntentEngine } from '../../../hooks/ScrollIntentEngine';
import SmartAlert from '../../SmartAlert';
import ScrollInterventionModal from '../../ScrollInterventionModal';
import IntentTrigger from '../../IntentTrigger';
import PlayerDashboard from './PlayerDashboard';
import CoachDashboard from './CoachDashboard';
import ParentDashboard from './ParentDashboard';
import AdminDashboard from './AdminDashboard';
import { 
  AlertCircle,
  Trophy
} from 'lucide-react';

const UnifiedDashboard: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { 
    autopilot, 
    showScrollIntervention, 
    currentIntervention, 
    scrollTime, 
    dismissScrollIntervention,
    userIntent,
    setUserIntent,
    hasDeclaredIntent
  } = useSmartLayer();
  const { sendRequest } = useAgentOrchestration();
  const { insights, dismissInsight } = useInsightsScan(user?.role || 'player', autopilot);
  
  // Initialize scroll intent engine
  useScrollIntentEngine();

  const handleInterventionAction = (action: any) => {
    sendRequest({
      type: 'scroll_intervention_action',
      context: action.aiPrompt,
      data: { action, intervention: currentIntervention }
    });
  };

  const handleIntentComplete = (intent: string) => {
    setUserIntent(intent);
  };

  // Handle loading state
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gray-50 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </motion.div>
    );
  }

  // Handle unauthenticated state
  if (!isAuthenticated || !user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      >
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to SportBeacon AI</h2>
            <p className="text-gray-600 mb-6">
              Please log in to access your personalized sports management dashboard.
            </p>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Login
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Role-based dashboard rendering
  const renderRoleDashboard = () => {
    switch (user.role) {
      case 'player':
        return <PlayerDashboard />;
      case 'coach':
        return <CoachDashboard />;
      case 'parent':
        return <ParentDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
          >
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Role Not Configured</h2>
              <p className="text-gray-600 mb-4">
                Your account role "{user.role}" is not currently supported.
              </p>
              <p className="text-sm text-gray-500">
                Please contact your administrator to set up the appropriate role.
              </p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Intent Trigger Modal */}
      <IntentTrigger
        isOpen={isAuthenticated && !hasDeclaredIntent}
        onComplete={handleIntentComplete}
      />

      {/* Sticky Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white shadow-sm border-b sticky top-0 z-40"
      >
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SB</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">SportBeacon AI</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500 capitalize">
                  {user.role} Dashboard
                </p>
                {userIntent && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {userIntent}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user.role}
              </p>
            </div>
            
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.firstName?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* SmartAlerts (Autopilot) */}
      <div className="max-w-2xl mx-auto mt-4">
        <AnimatePresence>
          {autopilot && insights.map(alert => (
            <SmartAlert
              key={alert.id}
              id={alert.id}
              title={alert.title}
              message={alert.message}
              status={alert.status}
              actions={alert.actions.map(a => ({
                ...a,
                onClick: () => {
                  if (a.aiPrompt) {
                    sendRequest({ type: 'autopilot_action', context: a.aiPrompt, data: alert });
                  }
                  if (a.label === 'Dismiss' || a.variant === 'ghost') {
                    dismissInsight(alert.id);
                  }
                  if (a.label === 'Remind me later') {
                    dismissInsight(alert.id);
                  }
                }
              }))}
              onDismiss={dismissInsight}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={user.role}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-4 sm:p-6 lg:p-8"
        >
          {renderRoleDashboard()}
        </motion.main>
      </AnimatePresence>

      {/* Scroll Intervention Modal */}
      {currentIntervention && (
        <ScrollInterventionModal
          isOpen={showScrollIntervention}
          onClose={dismissScrollIntervention}
          intervention={currentIntervention}
          onAction={handleInterventionAction}
          scrollTime={scrollTime}
        />
      )}
    </motion.div>
  );
};

export default UnifiedDashboard; 