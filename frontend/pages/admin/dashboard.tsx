import React, { useState } from 'react';
import AdminDashboardLayout from '../../components/admin/AdminDashboardLayout';
import LeagueManager from '../../components/admin/LeagueManager';
import TeamRosters from '../../components/admin/TeamRosters';
import ScheduleBoard from '../../components/admin/ScheduleBoard';
import RegistrationReview from '../../components/admin/RegistrationReview';
import ReportsCenter from '../../components/admin/ReportsCenter';
import BroadcastTool from '../../components/admin/BroadcastTool';

const modules = {
  leagues: <LeagueManager />,
  teams: <TeamRosters />,
  schedule: <ScheduleBoard />,
  registration: <RegistrationReview />,
  reports: <ReportsCenter />,
  broadcast: <BroadcastTool />,
};

const AdminDashboardPage: React.FC = () => {
  const [active, setActive] = useState<keyof typeof modules>('leagues');

  // TODO: Replace with real data fetching and context

  return (
    <AdminDashboardLayout>
      <nav aria-label="Admin navigation" className="sr-only">
        <ul>
          {Object.keys(modules).map(key => (
            <li key={key}>{key}</li>
          ))}
        </ul>
      </nav>
      {modules[active]}
    </AdminDashboardLayout>
  );
};

export default AdminDashboardPage; 