import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AdminAuthContext";
import { useSmartLayer } from "../contexts/SmartLayerContext";
import { useAgentOrchestration } from "../contexts/AgentOrchestrationContext";
import { 
  Target, 
  TrendingUp,
  Clock,
  Users,
  Zap,
  X,
  Star,
  Trophy,
  Lightbulb,
  Heart
} from "lucide-react";

interface SmartAlert {
  id: string;
  type: "info" | "success" | "warning" | "error" | "achievement" | "motivation" | "action" | "insight";
  title: string;
  message: string;
  icon?: React.ReactNode;
  actions?: AlertAction[];
  priority: "low" | "medium" | "high" | "critical";
  role?: string;
  intent?: string;
  sessionType?: string;
  expiresAt?: number;
  dismissible: boolean;
  autoDismiss?: number;
  metadata?: Record<string, any>;
}

interface AlertAction {
  label: string;
  variant: "primary" | "secondary" | "ghost" | "destructive";
  onClick: () => void;
  aiPrompt?: string;
}

interface SmartAlertsProps {
  className?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center";
  maxAlerts?: number;
  autoDismiss?: boolean;
  roleBased?: boolean;
  intentAware?: boolean;
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({
  className = "",
  position = "top-right",
  maxAlerts = 3,
  roleBased = true,
  intentAware = true
}) => {
  const { user } = useAuth();
  const { userIntent } = useSmartLayer();
  const { sendRequest } = useAgentOrchestration();
  
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);

  // Generate role-based and intent-aware alerts
  useEffect(() => {
    if (!user) return;

    const generateAlerts = async () => {
      const newAlerts: SmartAlert[] = [];

      // Role-based alerts
      if (roleBased) {
        const roleAlerts = generateRoleBasedAlerts(user.role);
        newAlerts.push(...roleAlerts);
      }

      // Intent-aware alerts
      if (intentAware && userIntent) {
        const intentAlerts = generateIntentBasedAlerts(userIntent);
        newAlerts.push(...intentAlerts);
      }

      // Session-based alerts
      const sessionAlerts = generateSessionBasedAlerts();
      newAlerts.push(...sessionAlerts);

      // Achievement alerts
      const achievementAlerts = await generateAchievementAlerts();
      newAlerts.push(...achievementAlerts);

      // Motivation alerts
      const motivationAlerts = generateMotivationAlerts();
      newAlerts.push(...motivationAlerts);

      // Filter and prioritize alerts
      const filteredAlerts = filterAndPrioritizeAlerts(newAlerts);
      
      setAlerts(filteredAlerts.slice(0, maxAlerts));
    };

    generateAlerts();
  }, [user, userIntent, roleBased, intentAware, maxAlerts]);

  const generateRoleBasedAlerts = (role: string): SmartAlert[] => {
    const alerts: SmartAlert[] = [];

    switch (role) {
      case "player":
        alerts.push({
          id: "player-training-reminder",
          type: "action",
          title: "Training Time!",
          message: "Ready to improve your skills? Check out today's recommended drills.",
          icon: <Target className="w-5 h-5" />,
          priority: "medium",
          role: "player",
          dismissible: true,
          autoDismiss: 10000,
          actions: [
            {
              label: "View Drills",
              variant: "primary",
              onClick: () => handleAction("view_drills", "Show me today's training drills"),
              aiPrompt: "Show me today's training drills"
            },
            {
              label: "Log Progress",
              variant: "secondary",
              onClick: () => handleAction("log_progress", "Help me log my recent training progress"),
              aiPrompt: "Help me log my recent training progress"
            }
          ]
        });
        break;

      case "coach":
        alerts.push({
          id: "coach-team-update",
          type: "info",
          title: "Team Update",
          message: "3 players have completed their weekly assessments. Review their progress?",
          icon: <Users className="w-5 h-5" />,
          priority: "medium",
          role: "coach",
          dismissible: true,
          autoDismiss: 15000,
          actions: [
            {
              label: "Review",
              variant: "primary",
              onClick: () => handleAction("review_assessments", "Show me the completed player assessments"),
              aiPrompt: "Show me the completed player assessments"
            }
          ]
        });
        break;

      case "parent":
        alerts.push({
          id: "parent-schedule-reminder",
          type: "info",
          title: "Upcoming Game",
          message: "Your child has a game tomorrow at 3:00 PM. Don't forget to bring water!",
          icon: <Clock className="w-5 h-5" />,
          priority: "high",
          role: "parent",
          dismissible: true,
          autoDismiss: 20000,
          actions: [
            {
              label: "View Details",
              variant: "primary",
              onClick: () => handleAction("view_game_details", "Show me the game details"),
              aiPrompt: "Show me the game details"
            }
          ]
        });
        break;

      case "admin":
        alerts.push({
          id: "admin-system-status",
          type: "info",
          title: "System Status",
          message: "All systems operational. 156 active users, 23 sessions in progress.",
          icon: <TrendingUp className="w-5 h-5" />,
          priority: "low",
          role: "admin",
          dismissible: true,
          autoDismiss: 8000
        });
        break;
    }

    return alerts;
  };

  const generateIntentBasedAlerts = (intent: string): SmartAlert[] => {
    const alerts: SmartAlert[] = [];

    switch (intent) {
      case "train":
        alerts.push({
          id: "intent-training-focus",
          type: "motivation",
          title: "Training Focus",
          message: "Great choice! Let's focus on improving your skills. What would you like to work on today?",
          icon: <Zap className="w-5 h-5" />,
          priority: "medium",
          intent: "train",
          dismissible: true,
          autoDismiss: 12000,
          actions: [
            {
              label: "Start Training",
              variant: "primary",
              onClick: () => handleAction("start_training", "Help me start a focused training session"),
              aiPrompt: "Help me start a focused training session"
            }
          ]
        });
        break;

      case "learn":
        alerts.push({
          id: "intent-learning-resources",
          type: "insight",
          title: "Learning Resources",
          message: "I found 5 new articles and 3 video tutorials that match your learning goals.",
          icon: <Lightbulb className="w-5 h-5" />,
          priority: "medium",
          intent: "learn",
          dismissible: true,
          autoDismiss: 15000,
          actions: [
            {
              label: "Explore",
              variant: "primary",
              onClick: () => handleAction("explore_resources", "Show me the learning resources"),
              aiPrompt: "Show me the learning resources"
            }
          ]
        });
        break;

      case "connect":
        alerts.push({
          id: "intent-community-connect",
          type: "action",
          title: "Community Connection",
          message: "There are 12 players in your area looking to connect. Ready to build your network?",
          icon: <Users className="w-5 h-5" />,
          priority: "medium",
          intent: "connect",
          dismissible: true,
          autoDismiss: 18000,
          actions: [
            {
              label: "Connect",
              variant: "primary",
              onClick: () => handleAction("connect_community", "Help me connect with local players"),
              aiPrompt: "Help me connect with local players"
            }
          ]
        });
        break;
    }

    return alerts;
  };

  const generateSessionBasedAlerts = (): SmartAlert[] => {
    const alerts: SmartAlert[] = [];

    // Session duration alerts
    const sessionDuration = 25 * 60 * 1000; // 25 minutes
    if (sessionDuration > 20 * 60 * 1000) { // After 20 minutes
      alerts.push({
        id: "session-break-reminder",
        type: "warning",
        title: "Take a Break",
        message: "You've been active for 25 minutes. Consider taking a short break to maintain focus.",
        icon: <Clock className="w-5 h-5" />,
        priority: "medium",
        dismissible: true,
        autoDismiss: 10000,
        actions: [
          {
            label: "Take Break",
            variant: "secondary",
            onClick: () => handleAction("take_break", "Help me take a productive break"),
            aiPrompt: "Help me take a productive break"
          }
        ]
      });
    }

    return alerts;
  };

  const generateAchievementAlerts = async (): Promise<SmartAlert[]> => {
    const alerts: SmartAlert[] = [];

    // Mock achievement data - in real implementation, fetch from API
    const achievements = [
      {
        id: "first_workout",
        title: "First Workout Complete!",
        message: "Congratulations on completing your first workout! You're on your way to greatness.",
        type: "achievement" as const,
        icon: <Trophy className="w-5 h-5" />
      },
      {
        id: "streak_7_days",
        title: "7-Day Streak!",
        message: "Amazing! You've been consistent for 7 days. Keep up the momentum!",
        type: "achievement" as const,
        icon: <Star className="w-5 h-5" />
      }
    ];

    // Randomly select achievements (in real implementation, check actual user achievements)
    if (Math.random() > 0.7) {
      const achievement = achievements[Math.floor(Math.random() * achievements.length)];
      alerts.push({
        id: achievement.id,
        type: achievement.type,
        title: achievement.title,
        message: achievement.message,
        icon: achievement.icon,
        priority: "high",
        dismissible: true,
        autoDismiss: 15000,
        actions: [
          {
            label: "View Achievements",
            variant: "primary",
            onClick: () => handleAction("view_achievements", "Show me my achievements"),
            aiPrompt: "Show me my achievements"
          }
        ]
      });
    }

    return alerts;
  };

  const generateMotivationAlerts = (): SmartAlert[] => {
    const alerts: SmartAlert[] = [];

    const motivations = [
      {
        id: "motivation_1",
        title: "You've Got This!",
        message: "Every expert was once a beginner. Your dedication is what sets you apart.",
        icon: <Heart className="w-5 h-5" />
      },
      {
        id: "motivation_2",
        title: "Progress Over Perfection",
        message: "Focus on getting 1% better each day. Small improvements compound into massive results.",
        icon: <TrendingUp className="w-5 h-5" />
      }
    ];

    // Show motivation alerts occasionally
    if (Math.random() > 0.8) {
      const motivation = motivations[Math.floor(Math.random() * motivations.length)];
      alerts.push({
        id: motivation.id,
        type: "motivation",
        title: motivation.title,
        message: motivation.message,
        icon: motivation.icon,
        priority: "low",
        dismissible: true,
        autoDismiss: 12000
      });
    }

    return alerts;
  };

  const filterAndPrioritizeAlerts = (alerts: SmartAlert[]): SmartAlert[] => {
    const now = Date.now();
    
    return alerts
      .filter(alert => {
        // Filter out expired alerts
        if (alert.expiresAt && alert.expiresAt < now) return false;
        
        // Filter by role if specified
        if (alert.role && alert.role !== user?.role) return false;
        
        // Filter by intent if specified
        if (alert.intent && alert.intent !== userIntent) return false;
        
        return true;
      })
      .sort((a, b) => {
        // Sort by priority
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  };

  const handleAction = useCallback(async (actionType: string, aiPrompt: string) => {
    try {
      // Send to AI orchestration
      await sendRequest({
        type: "smart_alert_action",
        data: {
          actionType,
          aiPrompt,
          userId: user?.id,
          userRole: user?.role,
          userIntent
        }
      });

      // Dismiss the alert
      dismissAlert(actionType);
    } catch (error) {
      }
  }, [sendRequest, user, userIntent]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const getAlertStyles = (type: SmartAlert["type"]) => {
    const baseStyles = "rounded-lg p-4 shadow-lg border-l-4 max-w-sm";
    
    switch (type) {
      case "success":
        return `${baseStyles} bg-green-50 border-green-400 text-green-800`;
      case "warning":
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case "error":
        return `${baseStyles} bg-red-50 border-red-400 text-red-800`;
      case "achievement":
        return `${baseStyles} bg-purple-50 border-purple-400 text-purple-800`;
      case "motivation":
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`;
      case "action":
        return `${baseStyles} bg-indigo-50 border-indigo-400 text-indigo-800`;
      case "insight":
        return `${baseStyles} bg-cyan-50 border-cyan-400 text-cyan-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-400 text-gray-800`;
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case "top-right":
        return "top-4 right-4";
      case "top-left":
        return "top-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "center":
        return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
      default:
        return "top-4 right-4";
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className={`fixed z-50 ${getPositionStyles()} space-y-3 ${className}`}>
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: position.includes("right") ? 100 : -100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: position.includes("right") ? 100 : -100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={getAlertStyles(alert.type)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {alert.icon && (
                  <div className="flex-shrink-0 mt-0.5">
                    {alert.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                  <p className="text-sm opacity-90">{alert.message}</p>
                  
                  {alert.actions && alert.actions.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {alert.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.onClick}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            action.variant === "primary"
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : action.variant === "secondary"
                              ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                              : action.variant === "ghost"
                              ? "bg-transparent text-gray-600 hover:bg-gray-100"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {alert.dismissible && (
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SmartAlerts; 