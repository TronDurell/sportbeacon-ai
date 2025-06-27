import React from 'react';
import { Button } from 'shadcn/ui/button';

const ReportsCenter: React.FC = () => {
  return (
    <div className="w-full" role="region" aria-label="Reports center" tabIndex={0}>
      <div className="p-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Reports Center</h2>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl">
            <h3 className="font-semibold mb-2">Export Data</h3>
            <Button className="w-full mb-2">Export Leagues CSV</Button>
            <Button className="w-full mb-2">Export Teams CSV</Button>
            <Button className="w-full mb-2">Export Players CSV</Button>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl">
            <h3 className="font-semibold mb-2">Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Coming soon: Participation, equity, and financial dashboards.</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl">
            <h3 className="font-semibold mb-2">Documents</h3>
            <Button className="w-full mb-2">Download League Handbook (PDF)</Button>
            <Button className="w-full mb-2">Download Facility Map (PDF)</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsCenter; 