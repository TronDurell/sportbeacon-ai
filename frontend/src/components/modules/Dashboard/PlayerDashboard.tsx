import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SmartTile from "../../SmartTile";
import { useAgentOrchestration } from "../../../contexts/AgentOrchestrationContext";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Trophy, 
  Target,
  TrendingUp,
  MapPin,
  Star,
  Activity
} from "lucide-react";

interface PlayerData {
  nextEvent?: {
    title: string;
    date: string;
    location: string;
    type: string;
  };
  pendingTasks?: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: "high" | "medium" | "low";
  }>;
  aiSuggestions?: Array<{
    id: string;
    title: string;
    description: string;
    type: "training" | "nutrition" | "recovery" | "mental";
  }>;
  recentAchievements?: Array<{
    id: string;
    title: string;
    date: string;
    category: string;
  }>;
  stats?: {
    sessionsThisWeek: number;
    goalsCompleted: number;
    improvementScore: number;
    teamRank: number;
  };
}

const PlayerDashboard: React.FC = () => {
  const { sendRequest } = useAgentOrchestration();
  const [playerData, setPlayerData] = useState<PlayerData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    const fetchPlayerData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPlayerData({
        nextEvent: {
          title: "Team Practice",
          date: "Tomorrow, 3:00 PM",
          location: "Main Field",
          type: "practice"
        },
        pendingTasks: [
          { id: "1", title: "Complete fitness assessment", dueDate: "Today", priority: "high" },
          { id: "2", title: "Review game footage", dueDate: "Tomorrow", priority: "medium" },
          { id: "3", title: "Update player profile", dueDate: "This week", priority: "low" }
        ],
        aiSuggestions: [
          { id: "1", title: "Focus on agility drills", description: "Based on your recent performance, try these specific drills", type: "training" },
          { id: "2", title: "Hydration reminder", description: "Increase water intake before practice sessions", type: "nutrition" },
          { id: "3", title: "Recovery routine", description: "Implement stretching routine after training", type: "recovery" }
        ],
        recentAchievements: [
          { id: "1", title: "Perfect Attendance", date: "2 days ago", category: "dedication" },
          { id: "2", title: "Skill Improvement", date: "1 week ago", category: "performance" }
        ],
        stats: {
          sessionsThisWeek: 4,
          goalsCompleted: 8,
          improvementScore: 85,
          teamRank: 3
        }
      });
      setLoading(false);
    };

    fetchPlayerData();
  }, []);

  const handleAIAssistance = (context: string) => {
    sendRequest({
      type: "player_assistance",
      context,
      data: playerData
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Player!</h1>
        <p className="text-gray-600">Ready to dominate today's training session?</p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Sessions This Week</p>
              <p className="text-2xl font-bold text-gray-900">{playerData.stats?.sessionsThisWeek || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Goals Completed</p>
              <p className="text-2xl font-bold text-gray-900">{playerData.stats?.goalsCompleted || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Improvement Score</p>
              <p className="text-2xl font-bold text-gray-900">{playerData.stats?.improvementScore || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Team Rank</p>
              <p className="text-2xl font-bold text-gray-900">#{playerData.stats?.teamRank || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Event */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Next Event"
            icon={<Calendar className="w-5 h-5" />}
            status="info"
            onClickAI={() => handleAIAssistance("next_event")}
            loading={loading}
          >
            {playerData.nextEvent && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{playerData.nextEvent.date}</span>
                </div>
                <h4 className="font-medium text-gray-900">{playerData.nextEvent.title}</h4>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{playerData.nextEvent.location}</span>
                </div>
              </div>
            )}
          </SmartTile>
        </motion.div>

        {/* Pending Tasks */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Pending Tasks"
            icon={<CheckCircle className="w-5 h-5" />}
            status={playerData.pendingTasks?.some(t => t.priority === "high") ? "warning" : "neutral"}
            onClickAI={() => handleAIAssistance("pending_tasks")}
            loading={loading}
          >
            <div className="space-y-2">
              {playerData.pendingTasks?.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{task.title}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.priority === "high" ? "bg-red-100 text-red-700" :
                    task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* AI Suggestions */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="AI Suggestions"
            icon={<Target className="w-5 h-5" />}
            status="success"
            onClickAI={() => handleAIAssistance("ai_suggestions")}
            loading={loading}
          >
            <div className="space-y-3">
              {playerData.aiSuggestions?.slice(0, 2).map((suggestion) => (
                <div key={suggestion.id} className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 text-sm">{suggestion.title}</h4>
                  <p className="text-xs text-blue-700 mt-1">{suggestion.description}</p>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* Recent Achievements */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Recent Achievements"
            icon={<Star className="w-5 h-5" />}
            status="success"
            onClickAI={() => handleAIAssistance("achievements")}
            loading={loading}
          >
            <div className="space-y-2">
              {playerData.recentAchievements?.map((achievement) => (
                <div key={achievement.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-yellow-900">{achievement.title}</p>
                    <p className="text-xs text-yellow-700">{achievement.date}</p>
                  </div>
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                    {achievement.category}
                  </span>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PlayerDashboard; 