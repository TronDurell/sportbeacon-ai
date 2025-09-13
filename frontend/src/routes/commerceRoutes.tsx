import React from "react";
import { Routes, Route } from "react-router-dom";

// Lazy load commerce components
const CommerceDashboard = React.lazy(() => import("../components/commerce/SocialCommerceFeed"));
const BeaconBuyBot = React.lazy(() => import("../components/commerce/BeaconBuyBot"));
const BulkProcurementPortal = React.lazy(() => import("../components/commerce/BulkProcurementPortal"));

const CommerceRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<CommerceDashboard />} />
      <Route path="/buy-bot" element={<BeaconBuyBot />} />
      <Route path="/bulk-procurement" element={<BulkProcurementPortal />} />
    </Routes>
  );
};

export default CommerceRoutes; 