import React from "react";
import { Routes, Route } from "react-router-dom";

// Lazy load admin components
const AdminDashboard = React.lazy(() => import("../pages/admin/dashboard"));
const PlayerRegistrationReview = React.lazy(() => import("../components/admin/PlayerRegistrationReviewPanel"));
const WaitlistManager = React.lazy(() => import("../components/admin/WaitlistManager"));
const SiblingTeamPlacement = React.lazy(() => import("../components/admin/SiblingTeamPlacementPanel"));
const AgeExceptionRequests = React.lazy(() => import("../components/admin/AgeExceptionRequestsPanel"));
const IncidentScoreReporting = React.lazy(() => import("../components/admin/IncidentScoreReportingReviewPanel"));
const RefereeScheduler = React.lazy(() => import("../components/admin/RefereeSchedulerDashboard"));
const LeagueOverview = React.lazy(() => import("../components/admin/LeagueOverviewDashboard"));
const PaymentRefundPanel = React.lazy(() => import("../components/admin/PaymentRefundPanel"));

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/player-registration" element={<PlayerRegistrationReview />} />
      <Route path="/waitlist" element={<WaitlistManager />} />
      <Route path="/sibling-placement" element={<SiblingTeamPlacement />} />
      <Route path="/age-exceptions" element={<AgeExceptionRequests />} />
      <Route path="/incident-reports" element={<IncidentScoreReporting />} />
      <Route path="/referee-scheduler" element={<RefereeScheduler />} />
      <Route path="/league-overview" element={<LeagueOverview />} />
      <Route path="/payments" element={<PaymentRefundPanel />} />
    </Routes>
  );
}; 