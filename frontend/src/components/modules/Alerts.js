import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { AlertTriangle, Bell, X, Check } from "lucide-react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const Alerts = () => {
    const { sendRequest } = useAgentOrchestration();
    const [alerts, setAlerts] = useState([
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
    const acknowledgeAlert = async (id) => {
        setAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, acknowledged: true } : alert));
        await sendRequest({
            type: "acknowledge_alert",
            alertId: id
        });
    };
    const dismissAlert = async (id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
        await sendRequest({
            type: "dismiss_alert",
            alertId: id
        });
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case "success": return _jsx(Check, { className: "w-5 h-5 text-green-500" });
            case "warning": return _jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-500" });
            case "error": return _jsx(X, { className: "w-5 h-5 text-red-500" });
            default: return _jsx(Bell, { className: "w-5 h-5 text-blue-500" });
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high": return "border-l-red-500";
            case "medium": return "border-l-yellow-500";
            case "low": return "border-l-green-500";
            default: return "border-l-gray-500";
        }
    };
    const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
    const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "System Alerts" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsxs("span", { className: "text-sm text-gray-500", children: [unacknowledgedAlerts.length, " active alerts"] }) })] }), _jsxs("div", { className: "space-y-6", children: [unacknowledgedAlerts.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Active Alerts" }), _jsx("div", { className: "space-y-4", children: unacknowledgedAlerts.map((alert) => (_jsx("div", { className: `bg-white border rounded-lg p-4 shadow-sm ${getPriorityColor(alert.priority)} border-l-4`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-3 flex-1", children: [getTypeIcon(alert.type), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("h4", { className: "font-medium text-gray-900", children: alert.title }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${alert.priority === "high" ? "bg-red-100 text-red-800" :
                                                                            alert.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                                                                                "bg-green-100 text-green-800"}`, children: alert.priority })] }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: alert.message }), _jsx("p", { className: "text-xs text-gray-400", children: alert.timestamp.toLocaleString() })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => acknowledgeAlert(alert.id), className: "px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700", children: "Acknowledge" }), _jsx("button", { onClick: () => dismissAlert(alert.id), className: "p-1 hover:bg-gray-100 rounded", children: _jsx(X, { className: "w-4 h-4 text-gray-500" }) })] })] }) }, alert.id))) })] })), acknowledgedAlerts.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Acknowledged Alerts" }), _jsx("div", { className: "space-y-4", children: acknowledgedAlerts.map((alert) => (_jsx("div", { className: `bg-gray-50 border rounded-lg p-4 ${getPriorityColor(alert.priority)} border-l-4`, children: _jsxs("div", { className: "flex items-start space-x-3", children: [getTypeIcon(alert.type), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("h4", { className: "font-medium text-gray-900", children: alert.title }), _jsx("span", { className: "text-xs text-gray-500", children: "Acknowledged" })] }), _jsx("p", { className: "text-sm text-gray-600", children: alert.message }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: alert.timestamp.toLocaleString() })] })] }) }, alert.id))) })] })), alerts.length === 0 && (_jsxs("div", { className: "text-center py-8", children: [_jsx(Bell, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500", children: "No alerts at this time" })] }))] })] }));
};
export default Alerts;
