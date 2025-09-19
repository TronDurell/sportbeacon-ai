import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Routes, Route } from "react-router-dom";
// Lazy load commerce components
const CommerceDashboard = React.lazy(() => import("../components/commerce/SocialCommerceFeed"));
const BeaconBuyBot = React.lazy(() => import("../components/commerce/BeaconBuyBot"));
const BulkProcurementPortal = React.lazy(() => import("../components/commerce/BulkProcurementPortal"));
const CommerceRoutes = () => {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(CommerceDashboard, {}) }), _jsx(Route, { path: "/buy-bot", element: _jsx(BeaconBuyBot, {}) }), _jsx(Route, { path: "/bulk-procurement", element: _jsx(BulkProcurementPortal, {}) })] }));
};
export default CommerceRoutes;
