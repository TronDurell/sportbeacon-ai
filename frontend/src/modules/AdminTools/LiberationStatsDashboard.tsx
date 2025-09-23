import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useAuth } from "../../contexts/AdminAuthContext";
import { 
  TrendingUp, 
  Target, 
  Activity,
  Download,
  Filter,
  Zap
} from "lucide-react";

interface LiberationStats {
  summaryMetrics: SummaryMetrics;
  scrollBehavior: ScrollBehaviorData;
  interventionMetrics: InterventionMetrics;
  engagementAnalytics: EngagementAnalytics;
  roleInsights: RoleInsights[];
  timeSeriesData: TimeSeriesData[];
}

interface SummaryMetrics {
  totalUsers: number;
  activeUsers: number;
  intentDeclarationRate: number;
  avgScrollSessionDuration: number;
  scrollLoopInterventions: number;
  timeSaved: number; // in minutes
  mostEffectiveNudge: string;
  clickThroughRate: number;
}

interface ScrollBehaviorData {
  roleBreakdown: Record<string, ScrollRoleData>;
  sessionTypes: Record<string, number>;
  scrollPatterns: ScrollPattern[];
}

interface ScrollRoleData {
  avgSessionDuration: number;
  scrollInterventions: number;
  recoveryActions: number;
  engagementRate: number;
}

interface ScrollPattern {
  pattern: string;
  frequency: number;
  avgDuration: number;
  recoveryRate: number;
}

interface InterventionMetrics {
  totalInterventions: number;
  interventionsByType: Record<string, number>;
  successRates: Record<string, number>;
  responseTimes: Record<string, number>;
  topNudges: NudgeEffectiveness[];
}

interface NudgeEffectiveness {
  nudgeType: string;
  served: number;
  clicked: number;
  successRate: number;
  avgResponseTime: number;
}

interface EngagementAnalytics {
  alertsClicked: AlertEngagement[];
  sessionsByIntent: IntentSessionData[];
  engagementByRole: RoleEngagement[];
  autopilotUsage: AutopilotData;
}

interface AlertEngagement {
  alertType: string;
  clicks: number;
  role: string;
  timestamp: number;
}

interface IntentSessionData {
  intent: string;
  sessions: number;
  avgDuration: number;
  actionsTaken: number;
}

interface RoleEngagement {
  role: string;
  totalSessions: number;
  activeSessions: number;
  avgEngagement: number;
  topActions: string[];
}

interface AutopilotData {
  totalUsers: number;
  usageByRole: Record<string, number>;
  avgSessionTime: number;
  effectiveness: number;
}

interface RoleInsights {
  role: string;
  strugglingUsers: number;
  topPerformers: number;
  recommendations: string[];
  trends: TrendData[];
}

interface TrendData {
  metric: string;
  value: number;
  change: number;
  direction: "up" | "down" | "stable";
}

interface TimeSeriesData {
  date: string;
  interventions: number;
  recoveries: number;
  engagement: number;
  scrollTime: number;
}

interface FilterOptions {
  dateRange: "7d" | "30d" | "90d" | "1y";
  role: string;
  sessionType: string;
}

const LiberationStatsDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [liberationStats, setLiberationStats] = useState<LiberationStats | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: "30d",
    role: "all",
    sessionType: "all"
  });
  const [isLoading, setIsLoading] = useState(true);

  // Mock data generation
  useEffect(() => {
    const generateMockStats = () => {
      const mockStats: LiberationStats = {
        summaryMetrics: {
          totalUsers: 1850,
          activeUsers: 1240,
          intentDeclarationRate: 73,
          avgScrollSessionDuration: 18.5,
          scrollLoopInterventions: 2847,
          timeSaved: 1240,
          mostEffectiveNudge: "Coach Nudge - Training",
          clickThroughRate: 68
        },
        scrollBehavior: {
          roleBreakdown: {
            player: {
              avgSessionDuration: 22.3,
              scrollInterventions: 1240,
              recoveryActions: 892,
              engagementRate: 72
            },
            coach: {
              avgSessionDuration: 28.7,
              scrollInterventions: 456,
              recoveryActions: 378,
              engagementRate: 83
            },
            parent: {
              avgSessionDuration: 15.2,
              scrollInterventions: 892,
              recoveryActions: 567,
              engagementRate: 64
            },
            admin: {
              avgSessionDuration: 35.1,
              scrollInterventions: 259,
              recoveryActions: 234,
              engagementRate: 90
            }
          },
          sessionTypes: {
            "Training": 45,
            "Learning": 28,
            "Scouting": 12,
            "Planning": 10,
            "Social": 5
          },
          scrollPatterns: [
            { pattern: "Rapid Scrolling", frequency: 1240, avgDuration: 8.5, recoveryRate: 45 },
            { pattern: "Passive Browsing", frequency: 892, avgDuration: 15.2, recoveryRate: 68 },
            { pattern: "Content Hunting", frequency: 567, avgDuration: 12.8, recoveryRate: 72 },
            { pattern: "Social Scrolling", frequency: 234, avgDuration: 25.3, recoveryRate: 38 }
          ]
        },
        interventionMetrics: {
          totalInterventions: 2847,
          interventionsByType: {
            "coach_nudge": 1240,
            "scroll_break": 892,
            "intent_reminder": 567,
            "achievement_celebration": 148
          },
          successRates: {
            "coach_nudge": 68,
            "scroll_break": 52,
            "intent_reminder": 75,
            "achievement_celebration": 88
          },
          responseTimes: {
            "coach_nudge": 45,
            "scroll_break": 120,
            "intent_reminder": 30,
            "achievement_celebration": 15
          },
          topNudges: [
            { nudgeType: "Coach Nudge - Training", served: 456, clicked: 324, successRate: 71, avgResponseTime: 42 },
            { nudgeType: "Scroll Break - Learning", served: 234, clicked: 156, successRate: 67, avgResponseTime: 85 },
            { nudgeType: "Intent Reminder - Planning", served: 189, clicked: 142, successRate: 75, avgResponseTime: 28 },
            { nudgeType: "Achievement Celebration", served: 98, clicked: 87, successRate: 89, avgResponseTime: 12 }
          ]
        },
        engagementAnalytics: {
          alertsClicked: [
            { alertType: "Start Workout", clicks: 324, role: "player", timestamp: Date.now() - 86400000 },
            { alertType: "Log Progress", clicks: 234, role: "player", timestamp: Date.now() - 172800000 },
            { alertType: "Plan Training", clicks: 156, role: "coach", timestamp: Date.now() - 259200000 },
            { alertType: "Check Schedule", clicks: 98, role: "parent", timestamp: Date.now() - 345600000 },
            { alertType: "Review Metrics", clicks: 67, role: "admin", timestamp: Date.now() - 432000000 }
          ],
          sessionsByIntent: [
            { intent: "train", sessions: 456, avgDuration: 22.3, actionsTaken: 324 },
            { intent: "learn", sessions: 234, avgDuration: 18.7, actionsTaken: 189 },
            { intent: "create", sessions: 156, avgDuration: 28.5, actionsTaken: 134 },
            { intent: "explore", sessions: 98, avgDuration: 15.2, actionsTaken: 67 },
            { intent: "connect", sessions: 67, avgDuration: 12.8, actionsTaken: 45 }
          ],
          engagementByRole: [
            { role: "player", totalSessions: 1240, activeSessions: 892, avgEngagement: 72, topActions: ["Start Workout", "Log Progress", "Find Game"] },
            { role: "coach", totalSessions: 456, activeSessions: 378, avgEngagement: 83, topActions: ["Plan Training", "Review Players", "Team Meeting"] },
            { role: "parent", totalSessions: 892, activeSessions: 567, avgEngagement: 64, topActions: ["Check Schedule", "Connect Coach", "Join Community"] },
            { role: "admin", totalSessions: 259, activeSessions: 234, avgEngagement: 90, topActions: ["Review Metrics", "Handle Alerts", "User Management"] }
          ],
          autopilotUsage: {
            totalUsers: 567,
            usageByRole: { player: 234, coach: 156, parent: 134, admin: 43 },
            avgSessionTime: 25.3,
            effectiveness: 78
          }
        },
        roleInsights: [
          {
            role: "player",
            strugglingUsers: 45,
            topPerformers: 234,
            recommendations: ["Increase training-focused nudges", "Add more achievement celebrations", "Optimize drill recommendations"],
            trends: [
              { metric: "Engagement Rate", value: 72, change: 8, direction: "up" },
              { metric: "Session Duration", value: 22.3, change: -2, direction: "down" },
              { metric: "Recovery Actions", value: 892, change: 15, direction: "up" }
            ]
          },
          {
            role: "coach",
            strugglingUsers: 12,
            topPerformers: 156,
            recommendations: ["Enhance planning tools", "Improve team analytics", "Add collaboration features"],
            trends: [
              { metric: "Engagement Rate", value: 83, change: 12, direction: "up" },
              { metric: "Session Duration", value: 28.7, change: 5, direction: "up" },
              { metric: "Recovery Actions", value: 378, change: 23, direction: "up" }
            ]
          },
          {
            role: "parent",
            strugglingUsers: 28,
            topPerformers: 134,
            recommendations: ["Simplify communication tools", "Add safety check reminders", "Improve community features"],
            trends: [
              { metric: "Engagement Rate", value: 64, change: -3, direction: "down" },
              { metric: "Session Duration", value: 15.2, change: 1, direction: "up" },
              { metric: "Recovery Actions", value: 567, change: 8, direction: "up" }
            ]
          },
          {
            role: "admin",
            strugglingUsers: 3,
            topPerformers: 43,
            recommendations: ["Add advanced analytics", "Improve system monitoring", "Enhance user management tools"],
            trends: [
              { metric: "Engagement Rate", value: 90, change: 5, direction: "up" },
              { metric: "Session Duration", value: 35.1, change: 8, direction: "up" },
              { metric: "Recovery Actions", value: 234, change: 18, direction: "up" }
            ]
          }
        ],
        timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0] || '',
          interventions: Math.floor(Math.random() * 100) + 50,
          recoveries: Math.floor(Math.random() * 60) + 30,
          engagement: Math.floor(Math.random() * 20) + 70,
          scrollTime: Math.floor(Math.random() * 40) + 20
        }))
      };

      setLiberationStats(mockStats);
      setIsLoading(false);
    };

    setTimeout(generateMockStats, 1000);
  }, [filters]);

  const exportLiberationData = () => {
    if (!liberationStats) return;
    
    const csvContent = [
      "Liberation Stats Summary",
      `Total Users,${liberationStats.summaryMetrics.totalUsers}`,
      `Active Users,${liberationStats.summaryMetrics.activeUsers}`,
      `Intent Declaration Rate,${liberationStats.summaryMetrics.intentDeclarationRate}%`,
      `Avg Scroll Session Duration,${liberationStats.summaryMetrics.avgScrollSessionDuration} minutes`,
      `Scroll Loop Interventions,${liberationStats.summaryMetrics.scrollLoopInterventions}`,
      `Time Saved,${liberationStats.summaryMetrics.timeSaved} minutes`,
      `Most Effective Nudge,${liberationStats.summaryMetrics.mostEffectiveNudge}`,
      `Click Through Rate,${liberationStats.summaryMetrics.clickThroughRate}%`,
      "",
      "Role Breakdown",
      "Role,Avg Session Duration,Scroll Interventions,Recovery Actions,Engagement Rate",
      ...Object.entries(liberationStats.scrollBehavior.roleBreakdown).map(([role, data]) => 
        `${role},${data.avgSessionDuration},${data.scrollInterventions},${data.recoveryActions},${data.engagementRate}%`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liberation-stats-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user || user.role !== "admin") {
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
          <h1 className="text-2xl font-bold text-gray-900">Liberation Stats Dashboard</h1>
          <p className="text-gray-600">Real-time insights on user scroll behavior, SmartLayer engagement, and session interventions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportLiberationData}>
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
              value={filters.sessionType}
              onChange={(e) => setFilters(prev => ({ ...prev, sessionType: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Session Types</option>
              <option value="Training">Training</option>
              <option value="Learning">Learning</option>
              <option value="Scouting">Scouting</option>
              <option value="Planning">Planning</option>
              <option value="Social">Social</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Intent Declaration Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {liberationStats?.summaryMetrics.intentDeclarationRate}%
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
                <p className="text-sm font-medium text-gray-600">Scroll Recovery ROI</p>
                <p className="text-2xl font-bold text-gray-900">
                  {liberationStats?.summaryMetrics.timeSaved} min
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Autopilot Behavior Map</p>
                <p className="text-2xl font-bold text-gray-900">
                  {liberationStats?.engagementAnalytics.autopilotUsage.totalUsers}
                </p>
              </div>
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coachable Moments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {liberationStats?.summaryMetrics.scrollLoopInterventions}
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="scroll">Scroll Behavior</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="insights">Role Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Intent-Driven Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liberationStats?.engagementAnalytics.sessionsByIntent.map((item) => (
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
                          <p className="text-sm text-gray-500">{item.sessions} sessions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{item.avgDuration}min</p>
                        <p className="text-sm text-gray-500">{item.actionsTaken} actions</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Effective Nudges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liberationStats?.interventionMetrics.topNudges.map((nudge) => (
                    <motion.div
                      key={nudge.nudgeType}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div>
                          <p className="font-medium text-gray-900">{nudge.nudgeType}</p>
                          <p className="text-sm text-gray-500">{nudge.served} served</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{nudge.successRate}%</p>
                        <p className="text-sm text-gray-500">{nudge.avgResponseTime}s</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scroll Recovery Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4">Role-Based Scroll Patterns</h4>
                    <div className="space-y-3">
                      {Object.entries(liberationStats?.scrollBehavior.roleBreakdown || {}).map(([role, data]) => (
                        <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium capitalize">{role}</p>
                            <p className="text-sm text-gray-500">{data.avgSessionDuration}min avg</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{data.engagementRate}%</p>
                            <p className="text-sm text-gray-500">{data.recoveryActions} recovered</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Scroll Pattern Analysis</h4>
                    <div className="space-y-3">
                      {liberationStats?.scrollBehavior.scrollPatterns.map((pattern) => (
                        <div key={pattern.pattern} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{pattern.pattern}</p>
                            <p className="text-sm text-gray-500">{pattern.frequency} occurrences</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{pattern.recoveryRate}%</p>
                            <p className="text-sm text-gray-500">{pattern.avgDuration}min avg</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Intervention Effectiveness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">Intervention Types</h4>
                  <div className="space-y-3">
                    {Object.entries(liberationStats?.interventionMetrics.interventionsByType || {}).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <p className="font-medium">{type.replace("_", " ")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{count}</p>
                          <p className="text-sm text-gray-500">
                            {liberationStats?.interventionMetrics.successRates[type]}% success
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-4">Response Times</h4>
                  <div className="space-y-3">
                    {Object.entries(liberationStats?.interventionMetrics.responseTimes || {}).map(([type, time]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <p className="font-medium">{type.replace("_", " ")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{time}s</p>
                          <p className="text-sm text-gray-500">avg response</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-4">Top Alert Actions</h4>
                  <div className="space-y-3">
                    {liberationStats?.engagementAnalytics.alertsClicked.map((alert) => (
                      <div key={alert.alertType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <div>
                            <p className="font-medium">{alert.alertType}</p>
                            <p className="text-sm text-gray-500 capitalize">{alert.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{alert.clicks}</p>
                          <p className="text-sm text-gray-500">clicks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-4">Autopilot Usage by Role</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(liberationStats?.engagementAnalytics.autopilotUsage.usageByRole || {}).map(([role, count]) => (
                      <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold capitalize">{role}</p>
                        <p className="text-2xl font-bold text-blue-600">{count}</p>
                        <p className="text-sm text-gray-500">users</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {liberationStats?.roleInsights.map((insight) => (
              <Card key={insight.role}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 capitalize">
                    {insight.role} Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Struggling Users:</span>
                      <span className="font-semibold text-red-600">{insight.strugglingUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Top Performers:</span>
                      <span className="font-semibold text-green-600">{insight.topPerformers}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-900">Recommendations:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {insight.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-900">Trends:</h5>
                      {insight.trends.map((trend, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{trend.metric}:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{trend.value}</span>
                            <span className={`flex items-center gap-1 ${
                              trend.direction === "up" ? "text-green-600" : 
                              trend.direction === "down" ? "text-red-600" : "text-gray-600"
                            }`}>
                              {trend.direction === "up" ? <TrendingUp className="w-3 h-3" /> :
                               trend.direction === "down" ? <TrendingUp className="w-3 h-3 rotate-180" /> :
                               <span>-</span>}
                              {trend.change}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiberationStatsDashboard; 