import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TownAnalyticsDashboard from '../../components/admin/TownAnalyticsDashboard';
import TownOnboarding from '../../components/onboarding/TownOnboarding';

const CaryTownPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  useEffect(() => {
    // Simulate onboarding auto-launch for first login (replace with Firestore check in prod)
    if (isAuthenticated && user && user.role === 'admin') {
      // TODO: Check Firestore onboardingStatus for this town
      setShowOnboarding(true); // Set to true if onboarding not complete
    }
  }, [isAuthenticated, user]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated || !user || user.role !== 'admin') return <div className="p-8 text-center">Access denied</div>;

  return (
    <div>
      {showOnboarding ? <TownOnboarding /> : <TownAnalyticsDashboard />}
    </div>
  );
};

export default CaryTownPage; 