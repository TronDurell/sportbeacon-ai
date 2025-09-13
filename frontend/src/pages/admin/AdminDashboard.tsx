import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AdminAuthContext";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";

interface AdminDashboardProps {
  className?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const { getSystemHealth } = useAgentOrchestration();
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSystemHealth();
  }, []);

  const loadSystemHealth = async () => {
    setLoading(true);
    try {
      const health = await getSystemHealth();
      setSystemHealth(health);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "Active Leagues",
      value: "45",
      change: "+5%",
      changeType: "positive"
    },
    {
      title: "Total Teams",
      value: "156",
      change: "+8%",
      changeType: "positive"
    },
    {
      title: "System Status",
      value: systemHealth?.status || "Loading...",
      change: "",
      changeType: "neutral"
    }
  ];

  const recentActivities = [
    {
      id: "1",
      type: "user_registration",
      message: "New user registered: John Doe",
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: "2",
      type: "league_created",
      message: "New league created: Spring Soccer League",
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      id: "3",
      type: "game_scheduled",
      message: "Game scheduled: Team Alpha vs Team Beta",
      timestamp: new Date(Date.now() - 10800000)
    }
  ];

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return `${days} days ago`;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.firstName} {user?.lastName}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                {stat.change && (
                  <span className={`text-sm font-medium ${
                    stat.changeType === "positive" ? "text-green-600" :
                    stat.changeType === "negative" ? "text-red-600" :
                    "text-gray-600"
                  }`}>
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* System Health */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          {loading ? (
            <p className="text-gray-600">Loading system health...</p>
          ) : systemHealth ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  systemHealth.status === "healthy" ? "bg-green-100 text-green-800" :
                  systemHealth.status === "warning" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {systemHealth.status}
                </span>
              </div>
              {systemHealth.agents && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Active Agents:</span>
                  <div className="mt-2 space-y-1">
                    {systemHealth.agents.map((agent: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{agent}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600">Unable to load system health</p>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <h4 className="font-medium text-gray-900">Create League</h4>
              <p className="text-sm text-gray-600">Set up a new sports league</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <h4 className="font-medium text-gray-900">Manage Users</h4>
              <p className="text-sm text-gray-600">View and manage user accounts</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <h4 className="font-medium text-gray-900">System Settings</h4>
              <p className="text-sm text-gray-600">Configure system preferences</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 