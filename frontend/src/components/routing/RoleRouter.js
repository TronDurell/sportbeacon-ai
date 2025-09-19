import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AdminAuthContext";
import PlayerLayout from "../layouts/PlayerLayout";
import CoachLayout from "../layouts/CoachLayout";
import ParentLayout from "../layouts/ParentLayout";
import AdminLayout from "../layouts/AdminLayout";
import MissionAnalyticsPanel from "../../modules/AdminTools/MissionAnalyticsPanel";
import LiberationStatsDashboard from "../../modules/AdminTools/LiberationStatsDashboard";
import RecAdminHub from "../../modules/TownRecSystem/RecAdminHub";
import RecAuditPanel from "../../modules/AdminTools/RecAuditPanel";
import TownCarySandbox from "../../modules/TownRecSystem/TownCarySandbox";
import UnifiedDashboard from "../modules/Dashboard/UnifiedDashboard";
const RoleRouter = () => {
    const { user, isAuthenticated, loading } = useAuth();
    // Handle loading state
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "Loading..." })] }) }));
    }
    // Handle unauthenticated state
    if (!isAuthenticated || !user) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "bg-white p-8 rounded-lg shadow-md max-w-md w-full", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Welcome to SportBeacon AI" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Please log in to access your personalized sports management dashboard." }), _jsx("button", { className: "w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700", children: "Login" })] }) }));
    }
    // Check if user has Town Staff role
    const hasTownStaffRole = ["TownStaff", "RecDirector", "RecCoordinator"].includes(user.role);
    return (_jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/player/*", element: user.role === "player" ? _jsx(PlayerLayout, {}) : _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "/coach/*", element: user.role === "coach" ? _jsx(CoachLayout, {}) : _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "/parent/*", element: user.role === "parent" ? _jsx(ParentLayout, {}) : _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "/admin/*", element: user.role === "admin" ? (_jsx(AdminLayout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(UnifiedDashboard, {}) }), _jsx(Route, { path: "/mission-analytics", element: _jsx(MissionAnalyticsPanel, {}) }), _jsx(Route, { path: "/liberation-stats", element: _jsx(LiberationStatsDashboard, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/admin", replace: true }) })] }) })) : _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "/admin/rec-admin", element: hasTownStaffRole ? _jsx(RecAdminHub, {}) : _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "/admin/rec-audit", element: hasTownStaffRole ? _jsx(RecAuditPanel, {}) : _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "/admin/rec-sandbox", element: hasTownStaffRole ? _jsx(TownCarySandbox, {}) : _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: `/${user.role}`, replace: true }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: `/${user.role}`, replace: true }) })] }) }));
};
export default RoleRouter;
