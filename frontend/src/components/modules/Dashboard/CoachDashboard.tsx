import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SmartTile from "../../SmartTile";
import { useAgentOrchestration } from "../../../contexts/AgentOrchestrationContext";
import { 
  Calendar, 
  Users, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Trophy,
  Clipboard,
  BarChart3
} from "lucide-react";

interface CoachData {
  nextSession?: {
    title: string;
    date: string;
    players: number;
    focus: string;
  };
  teamStats?: {
    totalPlayers: number;
    activePlayers: number;
    averageAttendance: number;
    teamRank: number;
  };
  pendingTasks?: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: "high" | "medium" | "low";
    type: "planning" | "evaluation" | "communication" | "admin";
  }>;
  aiInsights?: Array<{
    id: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
  }>;
  recentEvaluations?: Array<{
    id: string;
    playerName: string;
    date: string;
    score: number;
  }>;
  alerts?: Array<{
    id: string;
    type: "injury" | "attendance" | "performance" | "schedule";
    message: string;
    severity: "high" | "medium" | "low";
  }>;
}

const CoachDashboard: React.FC = () => {
  const { sendRequest } = useAgentOrchestration();
  const [coachData, setCoachData] = useState<CoachData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    const fetchCoachData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCoachData({
        nextSession: {
          title: "Advanced Skills Training",
          date: "Tomorrow, 4:00 PM",
          players: 18,
          focus: "Passing & Movement"
        },
        teamStats: {
          totalPlayers: 22,
          activePlayers: 20,
          averageAttendance: 85,
          teamRank: 2
        },
        pendingTasks: [
          { id: "1", title: "Review player evaluations", dueDate: "Today", priority: "high", type: "evaluation" },
          { id: "2", title: "Plan next week's training", dueDate: "Tomorrow", priority: "high", type: "planning" },
          { id: "3", title: "Send parent updates", dueDate: "This week", priority: "medium", type: "communication" },
          { id: "4", title: "Update team roster", dueDate: "Next week", priority: "low", type: "admin" }
        ],
        aiInsights: [
          { id: "1", title: "Team chemistry improving", description: "Recent group activities showing positive results", impact: "high" },
          { id: "2", title: "Focus on defensive positioning", description: "Analysis shows gaps in defensive coverage", impact: "medium" },
          { id: "3", title: "Individual player development", description: "3 players ready for advanced training", impact: "medium" }
        ],
        recentEvaluations: [
          { id: "1", playerName: "Alex Johnson", date: "2 days ago", score: 85 },
          { id: "2", playerName: "Sarah Chen", date: "3 days ago", score: 92 },
          { id: "3", playerName: "Mike Davis", date: "4 days ago", score: 78 }
        ],
        alerts: [
          { id: "1", type: "attendance", message: "5 players missed last session", severity: "medium" },
          { id: "2", type: "performance", message: "Team performance up 15% this month", severity: "low" },
          { id: "3", type: "schedule", message: "Next game rescheduled to Saturday", severity: "high" }
        ]
      });
      setLoading(false);
    };

    fetchCoachData();
  }, []);

  const handleAIAssistance = (context: string) => {
    sendRequest({
      type: "coach_assistance",
      context,
      data: coachData
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Coach Dashboard</h1>
        <p className="text-gray-600">Lead your team to victory with data-driven insights</p>
      </motion.div>

      {/* Team Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Players</p>
              <p className="text-2xl font-bold text-gray-900">{coachData.teamStats?.totalPlayers || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Active Players</p>
              <p className="text-2xl font-bold text-gray-900">{coachData.teamStats?.activePlayers || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{coachData.teamStats?.averageAttendance || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Team Rank</p>
              <p className="text-2xl font-bold text-gray-900">#{coachData.teamStats?.teamRank || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Session */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Next Training Session"
            icon={<Calendar className="w-5 h-5" />}
            status="info"
            onClickAI={() => handleAIAssistance("next_session")}
            loading={loading}
          >
            {coachData.nextSession && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{coachData.nextSession.date}</span>
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {coachData.nextSession.players} players
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">{coachData.nextSession.title}</h4>
                <p className="text-sm text-gray-600">Focus: {coachData.nextSession.focus}</p>
              </div>
            )}
          </SmartTile>
        </motion.div>

        {/* Pending Tasks */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Pending Tasks"
            icon={<Clipboard className="w-5 h-5" />}
            status={coachData.pendingTasks?.some(t => t.priority === "high") ? "warning" : "neutral"}
            onClickAI={() => handleAIAssistance("pending_tasks")}
            loading={loading}
          >
            <div className="space-y-2">
              {coachData.pendingTasks?.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.dueDate}</p>
                  </div>
                  <div className="flex gap-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.priority === "high" ? "bg-red-100 text-red-700" :
                      task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {task.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="AI Insights"
            icon={<Target className="w-5 h-5" />}
            status="success"
            onClickAI={() => handleAIAssistance("ai_insights")}
            loading={loading}
          >
            <div className="space-y-3">
              {coachData.aiInsights?.slice(0, 2).map((insight) => (
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
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* Recent Evaluations */}
        <motion.div variants={itemVariants}>
          <SmartTile
            title="Recent Evaluations"
            icon={<BarChart3 className="w-5 h-5" />}
            status="neutral"
            onClickAI={() => handleAIAssistance("evaluations")}
            loading={loading}
          >
            <div className="space-y-2">
              {coachData.recentEvaluations?.map((evaluation) => (
                <div key={evaluation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{evaluation.playerName}</p>
                    <p className="text-xs text-gray-500">{evaluation.date}</p>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded ${
                    evaluation.score >= 90 ? "bg-green-100 text-green-700" :
                    evaluation.score >= 80 ? "bg-blue-100 text-blue-700" :
                    evaluation.score >= 70 ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {evaluation.score}
                  </span>
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>

        {/* Alerts */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <SmartTile
            title="Team Alerts"
            icon={<AlertTriangle className="w-5 h-5" />}
            status={coachData.alerts?.some(a => a.severity === "high") ? "error" : "warning"}
            onClickAI={() => handleAIAssistance("alerts")}
            loading={loading}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {coachData.alerts?.map((alert) => (
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
                </div>
              ))}
            </div>
          </SmartTile>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CoachDashboard; 