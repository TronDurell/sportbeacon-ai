import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SmartTile from "../../SmartTile";
import { useAgentOrchestration } from "../../../contexts/AgentOrchestrationContext";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Settings, 
  BarChart3,
  DollarSign,
  Activity,
  Award,
  Globe
} from "lucide-react";

interface AdminData {
  platformStats?: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    growthRate: number;
  };
  systemAlerts?: Array<{
    id: string;
    type: "security" | "performance" | "maintenance" | "user";
    message: string;
    severity: "high" | "medium" | "low";
    timestamp: string;
  }>;
  pendingActions?: Array<{
    id: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    category: "user" | "system" | "financial" | "content" | "security";
  }>;
  aiInsights?: Array<{
    id: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    category: "performance" | "security" | "user_experience" | "revenue";
  }>;
  recentActivity?: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
    type: "login" | "registration" | "payment" | "admin";
  }>;
  revenueMetrics?: {
    monthlyRevenue: number;
    monthlyGrowth: number;
    topRevenueSources: Array<{
      source: string;
      amount: number;
      percentage: number;
    }>;
  };
  userMetrics?: {
    newRegistrations: number;
    activeSessions: number;
    userSatisfaction: number;
    topUserTypes: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
}

const AdminDashboard: React.FC = () => {
  const { sendRequest } = useAgentOrchestration();
  const [adminData, setAdminData] = useState<AdminData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    const fetchAdminData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAdminData({
        platformStats: {
          totalUsers: 15420,
          activeUsers: 8920,
          totalRevenue: 125000,
          growthRate: 23.5
        },
        systemAlerts: [
          {
            id: "1",
            type: "security",
            message: "Unusual login activity detected",
            severity: "high",
            timestamp: "2 hours ago"
          },
          {
            id: "2",
            type: "performance",
            message: "Server response time increased by 15%",
            severity: "medium",
            timestamp: "4 hours ago"
          },
          {
            id: "3",
            type: "maintenance",
            message: "Scheduled maintenance in 2 hours",
            severity: "low",
            timestamp: "6 hours ago"
          }
        ],
        pendingActions: [
          {
            id: "1",
            title: "Review suspicious user accounts",
            description: "5 accounts flagged for review",
            priority: "high",
            category: "security"
          },
          {
            id: "2",
            title: "Approve new coach applications",
            description: "12 pending coach verifications",
            priority: "medium",
            category: "user"
          },
          {
            id: "3",
            title: "Update payment processing",
            description: "New Stripe integration ready",
            priority: "medium",
            category: "financial"
          },
          {
            id: "4",
            title: "Content moderation review",
            description: "25 posts awaiting approval",
            priority: "low",
            category: "content"
          }
        ],
        aiInsights: [
          {
            id: "1",
            title: "User engagement peak times",
            description: "Peak activity between 4-6 PM, consider targeted features",
            impact: "high",
            category: "user_experience"
          },
          {
            id: "2",
            title: "Revenue optimization opportunity",
            description: "Premium features showing 40% conversion potential",
            impact: "high",
            category: "revenue"
          },
          {
            id: "3",
            title: "System performance trends",
            description: "Database queries optimized, 25% faster response times",
            impact: "medium",
            category: "performance"
          }
        ],
        recentActivity: [
          {
            id: "1",
            action: "New user registration",
            user: "john.doe@email.com",
            timestamp: "5 minutes ago",
            type: "registration"
          },
          {
            id: "2",
            action: "Payment processed",
            user: "coach.smith@email.com",
            timestamp: "12 minutes ago",
            type: "payment"
          },
          {
            id: "3",
            action: "Admin login",
            user: "admin@sportbeacon.com",
            timestamp: "1 hour ago",
            type: "admin"
          }
        ],
        revenueMetrics: {
          monthlyRevenue: 125000,
          monthlyGrowth: 23.5,
          topRevenueSources: [
            { source: "Premium Subscriptions", amount: 75000, percentage: 60 },
            { source: "Tournament Fees", amount: 35000, percentage: 28 },
            { source: "Equipment Sales", amount: 15000, percentage: 12 }
          ]
        },
        userMetrics: {
          newRegistrations: 245,
          activeSessions: 8920,
          userSatisfaction: 4.6,
          topUserTypes: [
            { type: "Players", count: 8920, percentage: 58 },
            { type: "Coaches", count: 1240, percentage: 8 },
            { type: "Parents", count: 4260, percentage: 28 },
            { type: "Admins", count: 1000, percentage: 6 }
          ]
        }
      });
      setLoading(false);
    };

    fetchAdminData();
  }, []);

  const handleAIAssistance = (context: string) => {
    sendRequest({
      type: "admin_assistance",
      context,
      data: adminData
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Platform overview and system management</p>
      </motion.div>

      {/* Platform Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{adminData.platformStats?.totalUsers.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{adminData.platformStats?.activeUsers.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${adminData.platformStats?.totalRevenue.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900">+{adminData.platformStats?.growthRate || 0}%</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="System Alerts"
            icon={<AlertTriangle className="w-5 h-5" />}
            status={adminData.systemAlerts?.some(a => a.severity === "high") ? "error" : "warning"}
            onClickAI={() => handleAIAssistance("system_alerts")}
            loading={loading}
          >
            <div className="space-y-2">
              {adminData.systemAlerts?.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg ${
                  alert.severity === "high" ? "bg-red-50 border border-red-200" :
                  alert.severity === "medium" ? "bg-yellow-50 border border-yellow-200" :
                  "bg-blue-50 border border-blue-200"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${
                      alert.severity === "high" ? "text-red-700" :
                      alert.severity === "medium" ? "text-yellow-700" :
                      "text-blue-700"
                    }`}>
                      {alert.type.toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      alert.severity === "high" ? "bg-red-200 text-red-800" :
                      alert.severity === "medium" ? "bg-yellow-200 text-yellow-800" :
                      "bg-blue-200 text-blue-800"
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* Pending Actions */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Pending Actions"
            icon={<Settings className="w-5 h-5" />}
            status={adminData.pendingActions?.some(a => a.priority === "high") ? "warning" : "neutral"}
            onClickAI={() => handleAIAssistance("pending_actions")}
            loading={loading}
          >
            <div className="space-y-2">
              {adminData.pendingActions?.map((action) => (
                <div key={action.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">{action.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      action.priority === "high" ? "bg-red-100 text-red-700" :
                      action.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {action.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{action.description}</p>
                  <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                    action.category === "security" ? "bg-red-100 text-red-700" :
                    action.category === "user" ? "bg-blue-100 text-blue-700" :
                    action.category === "financial" ? "bg-green-100 text-green-700" :
                    action.category === "content" ? "bg-purple-100 text-purple-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {action.category}
                  </span>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="AI Insights"
            icon={<Award className="w-5 h-5" />}
            status="success"
            onClickAI={() => handleAIAssistance("ai_insights")}
            loading={loading}
          >
            <div className="space-y-3">
              {adminData.aiInsights?.map((insight) => (
                <div key={insight.id} className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-green-900 text-sm">{insight.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      insight.impact === "high" ? "bg-green-200 text-green-800" :
                      insight.impact === "medium" ? "bg-yellow-200 text-yellow-800" :
                      "bg-gray-200 text-gray-800"
                    }`}>
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-xs text-green-700">{insight.description}</p>
                  <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                    insight.category === "user_experience" ? "bg-blue-100 text-blue-700" :
                    insight.category === "revenue" ? "bg-green-100 text-green-700" :
                    insight.category === "performance" ? "bg-purple-100 text-purple-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {insight.category}
                  </span>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Recent Activity"
            icon={<BarChart3 className="w-5 h-5" />}
            status="neutral"
            onClickAI={() => handleAIAssistance("recent_activity")}
            loading={loading}
          >
            <div className="space-y-2">
              {adminData.recentActivity?.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${
                      activity.type === "registration" ? "bg-green-100 text-green-700" :
                      activity.type === "payment" ? "bg-blue-100 text-blue-700" :
                      activity.type === "admin" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {activity.type}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* Revenue Metrics */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Revenue Metrics"
            icon={<DollarSign className="w-5 h-5" />}
            status="success"
            onClickAI={() => handleAIAssistance("revenue_metrics")}
            loading={loading}
          >
            <div className="space-y-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-900">${adminData.revenueMetrics?.monthlyRevenue.toLocaleString() || 0}</p>
                <p className="text-sm text-green-700">Monthly Revenue</p>
                <p className="text-xs text-green-600">+{adminData.revenueMetrics?.monthlyGrowth || 0}% from last month</p>
              </div>
              <div className="space-y-2">
                {adminData.revenueMetrics?.topRevenueSources.map((source) => (
                  <div key={source.source} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{source.source}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${source.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{source.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SmartTile>
        </motion.div>

        {/* User Metrics */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="User Metrics"
            icon={<Globe className="w-5 h-5" />}
            status="info"
            onClickAI={() => handleAIAssistance("user_metrics")}
            loading={loading}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-lg font-bold text-blue-900">{adminData.userMetrics?.newRegistrations || 0}</p>
                  <p className="text-xs text-blue-700">New Users</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-lg font-bold text-green-900">{adminData.userMetrics?.userSatisfaction || 0}/5</p>
                  <p className="text-xs text-green-700">Satisfaction</p>
                </div>
              </div>
              <div className="space-y-2">
                {adminData.userMetrics?.topUserTypes.map((userType) => (
                  <div key={userType.type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{userType.type}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{userType.count.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{userType.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SmartTile>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard; 