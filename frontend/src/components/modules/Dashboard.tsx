import React from "react";
import { 
  Calendar, 
  Target, 
  MessageSquare, 
  Activity,
  BarChart3
} from "lucide-react";
import { useAuth } from "../../contexts/AdminAuthContext";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      label: "Upcoming Events",
      value: "5",
      change: "+2",
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      label: "Performance Score",
      value: "87%",
      change: "+5%",
      icon: Target,
      color: "text-green-600"
    },
    {
      label: "Unread Messages",
      value: "3",
      change: "-1",
      icon: MessageSquare,
      color: "text-purple-600"
    },
    {
      label: "Active Sessions",
      value: "12",
      change: "+3",
      icon: Activity,
      color: "text-orange-600"
    }
  ];

  const recentActivity = [
    {
      id: "1",
      type: "practice",
      title: "Team Practice Completed",
      time: "2 hours ago",
      description: "Great session focusing on passing drills"
    },
    {
      id: "2",
      type: "game",
      title: "Game Scheduled",
      time: "1 day ago",
      description: "Next game vs Eagles on Saturday"
    },
    {
      id: "3",
      type: "message",
      title: "New Message from Coach",
      time: "2 days ago",
      description: "Updated training schedule available"
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "practice": return "⚽";
      case "game": return "🏆";
      case "message": return "💬";
      default: return "📅";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your sports activities today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600">{stat.change}</span>
              <span className="text-sm text-gray-500 ml-1">from last week</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span>Schedule Practice</span>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-3">
              <Target className="w-5 h-5 text-green-500" />
              <span>View Performance</span>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <span>Send Message</span>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 