#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const adminComponents = [
  'WaitlistManager',
  'SiblingTeamPlacementPanel',
  'AgeExceptionRequestsPanel',
  'IncidentScoreReportingReviewPanel',
  'RefereeSchedulerDashboard',
  'LeagueOverviewDashboard',
  'PaymentRefundPanel'
];

const componentTemplate = (name) => `import React from 'react';

const ${name}: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            ${name.replace(/([A-Z])/g, ' $1').trim()}
          </h1>
          <p className="text-gray-600">${name.replace(/([A-Z])/g, ' $1').trim()} functionality coming soon.</p>
        </div>
      </div>
    </div>
  );
};

export default ${name};
`;


adminComponents.forEach(componentName => {
  const filePath = path.join('frontend', 'src', 'components', 'admin', `${componentName}.tsx`);
  const content = componentTemplate(componentName);
  
  fs.writeFileSync(filePath, content);
});
