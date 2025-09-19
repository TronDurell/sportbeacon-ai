import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export const AdminRoutes = () => {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "/player-registration", element: _jsx(PlayerRegistrationReview, {}) }), _jsx(Route, { path: "/waitlist", element: _jsx(WaitlistManager, {}) }), _jsx(Route, { path: "/sibling-placement", element: _jsx(SiblingTeamPlacement, {}) }), _jsx(Route, { path: "/age-exceptions", element: _jsx(AgeExceptionRequests, {}) }), _jsx(Route, { path: "/incident-reports", element: _jsx(IncidentScoreReporting, {}) }), _jsx(Route, { path: "/referee-scheduler", element: _jsx(RefereeScheduler, {}) }), _jsx(Route, { path: "/league-overview", element: _jsx(LeagueOverview, {}) }), _jsx(Route, { path: "/payments", element: _jsx(PaymentRefundPanel, {}) })] }));
};
