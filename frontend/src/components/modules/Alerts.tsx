import React, { useState } from "react";
import { AlertTriangle, Bell, X, Check } from "lucide-react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";

interface Alert {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: Date;
  acknowledged: boolean;
  priority: "low" | "medium" | "high";
}

const Alerts: React.FC = () => {
  const { sendRequest } = useAgentOrchestration();
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "1",
      title: "System Maintenance",
      message: "Scheduled maintenance will occur tonight at 2 AM EST.",
      type: "info",
      timestamp: new Date(),
      acknowledged: false,
      priority: "medium"
    },
    {
      id: "2",
      title: "High CPU Usage",
      message: "Server CPU usage is above 90% for the last 10 minutes.",
      type: "warning",
      timestamp: new Date(Date.now() - 300000),
      acknowledged: false,
      priority: "high"
    },
    {
      id: "3",
      title: "Backup Completed",
      message: "Daily backup completed successfully.",
      type: "success",
      timestamp: new Date(Date.now() - 3600000),
      acknowledged: true,
      priority: "low"
    }
  ]);

  const acknowledgeAlert = async (id: string) => {
    setAlerts(prev => 
      prev.map(alert => alert.id === id ? { ...alert, acknowledged: true } : alert)
    );
    
    await sendRequest({
      type: "acknowledge_alert",
      alertId: id
    });
  };

  const dismissAlert = async (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    
    await sendRequest({
      type: "dismiss_alert",
      alertId: id
    });
  };

  const getTypeIcon = (type: Alert["type"]) => {
    switch (type) {
      case "success": return <Check className="w-5 h-5 text-green-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "error": return <X className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: Alert["priority"]) => {
    switch (priority) {
      case "high": return "border-l-red-500";
      case "medium": return "border-l-yellow-500";
      case "low": return "border-l-green-500";
      default: return "border-l-gray-500";
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">System Alerts</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {unacknowledgedAlerts.length} active alerts
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {unacknowledgedAlerts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
            <div className="space-y-4">
              {unacknowledgedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white border rounded-lg p-4 shadow-sm ${getPriorityColor(alert.priority)} border-l-4`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getTypeIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            alert.priority === "high" ? "bg-red-100 text-red-800" :
                            alert.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                            "bg-green-100 text-green-800"
                          }`}>
                            {alert.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                        <p className="text-xs text-gray-400">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {acknowledgedAlerts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acknowledged Alerts</h3>
            <div className="space-y-4">
              {acknowledgedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-gray-50 border rounded-lg p-4 ${getPriorityColor(alert.priority)} border-l-4`}
                >
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <span className="text-xs text-gray-500">Acknowledged</span>
                      </div>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {alerts.length === 0 && (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No alerts at this time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts; 