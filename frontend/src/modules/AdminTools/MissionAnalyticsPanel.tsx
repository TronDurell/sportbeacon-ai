import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../contexts/AdminAuthContext';
import { 
  TrendingUp, 
  Target, 
  Activity,
  Download,
  Filter
} from 'lucide-react';

interface MissionData {
  intentTriggers: IntentTriggerData[];
  scrollInterventions: InterventionData[];
  aiActions: AIActionData[];
  roleBreakdown: RoleData[];
  timeSeriesData: TimeSeriesData[];
}

interface IntentTriggerData {
  intent: string;
  count: number;
  percentage: number;
  role: string;
  timestamp: number;
}

interface InterventionData {
  type: string;
  count: number;
  successRate: number;
  averageResponseTime: number;
  role: string;
}

interface AIActionData {
  action: string;
  count: number;
  completionRate: number;
  averageTime: number;
  role: string;
}

interface RoleData {
  role: string;
  totalUsers: number;
  activeUsers: number;
  engagementRate: number;
  averageSessionTime: number;
}

interface TimeSeriesData {
  date: string;
  interventions: number;
  actions: number;
  engagement: number;
}

interface FilterOptions {
  dateRange: '7d' | '30d' | '90d' | '1y';
  role: string;
  intent: string;
}

const MissionAnalyticsPanel: React.FC = () => {
  const { user } = useAuth();
  
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: '30d',
    role: 'all',
    intent: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Mock data generation
  useEffect(() => {
    const generateMockData = () => {
      const mockData: MissionData = {
        intentTriggers: [
          { intent: 'train', count: 245, percentage: 35, role: 'player', timestamp: Date.now() - 86400000 },
          { intent: 'learn', count: 180, percentage: 26, role: 'player', timestamp: Date.now() - 172800000 },
          { intent: 'create', count: 120, percentage: 17, role: 'coach', timestamp: Date.now() - 259200000 },
          { intent: 'explore', count: 95, percentage: 14, role: 'parent', timestamp: Date.now() - 345600000 },
          { intent: 'connect', count: 55, percentage: 8, role: 'admin', timestamp: Date.now() - 432000000 }
        ],
        scrollInterventions: [
          { type: 'coach_nudge', count: 320, successRate: 68, averageResponseTime: 45, role: 'player' },
          { type: 'scroll_break', count: 180, successRate: 52, averageResponseTime: 120, role: 'coach' },
          { type: 'intent_reminder', count: 95, successRate: 75, averageResponseTime: 30, role: 'parent' },
          { type: 'achievement_celebration', count: 45, successRate: 88, averageResponseTime: 15, role: 'admin' }
        ],
        aiActions: [
          { action: 'drill_started', count: 156, completionRate: 82, averageTime: 25, role: 'player' },
          { action: 'progress_logged', count: 98, completionRate: 91, averageTime: 12, role: 'player' },
          { action: 'goal_set', count: 67, completionRate: 78, averageTime: 18, role: 'coach' },
          { action: 'community_engaged', count: 43, completionRate: 65, averageTime: 35, role: 'parent' },
          { action: 'coach_contacted', count: 28, completionRate: 72, averageTime: 22, role: 'admin' }
        ],
        roleBreakdown: [
          { role: 'player', totalUsers: 1250, activeUsers: 890, engagementRate: 71, averageSessionTime: 18 },
          { role: 'coach', totalUsers: 180, activeUsers: 145, engagementRate: 81, averageSessionTime: 25 },
          { role: 'parent', totalUsers: 320, activeUsers: 210, engagementRate: 66, averageSessionTime: 12 },
          { role: 'admin', totalUsers: 45, activeUsers: 42, engagementRate: 93, averageSessionTime: 30 }
        ],
        timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
          interventions: Math.floor(Math.random() * 50) + 20,
          actions: Math.floor(Math.random() * 30) + 10,
          engagement: Math.floor(Math.random() * 30) + 60
        }))
      };

      setMissionData(mockData);
      setIsLoading(false);
    };

    // Simulate API call delay
    setTimeout(generateMockData, 1000);
  }, [filters]);

  const exportData = () => {
    if (!missionData) return;
    
    const csvContent = [
      'Intent Triggers,Count,Percentage,Role',
      ...missionData.intentTriggers.map(item => 
        `${item.intent},${item.count},${item.percentage},${item.role}`
      ),
      '',
      'Scroll Interventions,Count,Success Rate,Avg Response Time,Role',
      ...missionData.scrollInterventions.map(item => 
        `${item.type},${item.count},${item.successRate},${item.averageResponseTime},${item.role}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mission-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Access restricted to administrators</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mission Analytics Panel</h1>
          <p className="text-gray-600">Track user intent triggers, scroll interventions, and AI-driven actions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Roles</option>
              <option value="player">Players</option>
              <option value="coach">Coaches</option>
              <option value="parent">Parents</option>
              <option value="admin">Admins</option>
            </select>
            
            <select
              value={filters.intent}
              onChange={(e) => setFilters(prev => ({ ...prev, intent: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Intents</option>
              <option value="train">Train</option>
              <option value="learn">Learn</option>
              <option value="create">Create</option>
              <option value="explore">Explore</option>
              <option value="connect">Connect</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Intent Triggers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {missionData?.intentTriggers.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scroll Interventions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {missionData?.scrollInterventions.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Actions Taken</p>
                <p className="text-2xl font-bold text-gray-900">
                  {missionData?.aiActions.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Engagement Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {missionData?.roleBreakdown ? 
                    Math.round(missionData.roleBreakdown.reduce((sum, item) => sum + item.engagementRate, 0) / missionData.roleBreakdown.length) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="intents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="intents">Intent Triggers</TabsTrigger>
          <TabsTrigger value="interventions">Scroll Interventions</TabsTrigger>
          <TabsTrigger value="actions">AI Actions</TabsTrigger>
          <TabsTrigger value="roles">Role Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="intents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Intent Trigger Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {missionData?.intentTriggers.map((item) => (
                  <motion.div
                    key={item.intent}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{item.intent}</p>
                        <p className="text-sm text-gray-500">{item.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.count}</p>
                      <p className="text-sm text-gray-500">{item.percentage}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scroll Intervention Effectiveness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {missionData?.scrollInterventions.map((item) => (
                  <motion.div
                    key={item.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="font-medium text-gray-900">{item.type.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">{item.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.count}</p>
                      <p className="text-sm text-gray-500">{item.successRate}% success</p>
                      <p className="text-xs text-gray-400">{item.averageResponseTime}s avg</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Action Completion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {missionData?.aiActions.map((item) => (
                  <motion.div
                    key={item.action}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <div>
                        <p className="font-medium text-gray-900">{item.action.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">{item.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.count}</p>
                      <p className="text-sm text-gray-500">{item.completionRate}% completed</p>
                      <p className="text-xs text-gray-400">{item.averageTime}s avg</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {missionData?.roleBreakdown.map((item) => (
                  <motion.div
                    key={item.role}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{item.role}</p>
                        <p className="text-sm text-gray-500">{item.activeUsers}/{item.totalUsers} active</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.engagementRate}%</p>
                      <p className="text-sm text-gray-500">{item.averageSessionTime}min avg</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MissionAnalyticsPanel; 