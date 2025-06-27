import React from 'react';
import { useFirestoreLeagues } from '../../hooks/useFirestoreLeagues';
import { useFirestorePayments } from '../../hooks/useFirestorePayments';
import { useFirestoreCoaches } from '../../hooks/useFirestoreCoaches';
import { Card } from 'shadcn/ui/card';
import { Bar, Pie } from 'react-chartjs-2';

const TownAnalyticsDashboard: React.FC = () => {
  const { leagues, loading: leaguesLoading } = useFirestoreLeagues();
  const { payments, loading: paymentsLoading } = useFirestorePayments();
  const { coaches, loading: coachesLoading } = useFirestoreCoaches();

  // Example analytics
  const totalLeagues = leagues.length;
  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const coachLoad = coaches.map(coach => ({ name: coach.name, teams: coach.teams?.length || 0 }));

  return (
    <div className="w-full" role="region" aria-label="Town analytics dashboard" tabIndex={0}>
      <div className="p-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Town Analytics Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-lg font-semibold">Total Leagues</div>
            <div className="text-3xl">{leaguesLoading ? '...' : totalLeagues}</div>
          </Card>
          <Card className="p-4">
            <div className="text-lg font-semibold">Total Payments</div>
            <div className="text-3xl">{paymentsLoading ? '...' : `$${totalPayments}`}</div>
          </Card>
          <Card className="p-4">
            <div className="text-lg font-semibold">Coaches</div>
            <div className="text-3xl">{coachesLoading ? '...' : coaches.length}</div>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="font-semibold mb-2">Coach Team Load</div>
            <Bar
              data={{
                labels: coachLoad.map(c => c.name),
                datasets: [{ label: 'Teams', data: coachLoad.map(c => c.teams), backgroundColor: '#2563eb' }],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </Card>
          <Card className="p-4">
            <div className="font-semibold mb-2">Payments by League</div>
            <Pie
              data={{
                labels: leagues.map(l => l.name),
                datasets: [{
                  data: leagues.map(l => payments.filter(p => p.leagueId === l.id).reduce((sum, p) => sum + (p.amount || 0), 0)),
                  backgroundColor: ['#2563eb', '#f59e42', '#10b981', '#f43f5e', '#6366f1'],
                }],
              }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TownAnalyticsDashboard; 