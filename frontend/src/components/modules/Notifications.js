import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Bell, Check, X, AlertCircle } from "lucide-react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const Notifications = () => {
    const { sendRequest } = useAgentOrchestration();
    const [notifications, setNotifications] = useState([
        {
            id: "1",
            title: "System Update",
            message: "New features have been deployed to the platform.",
            type: "info",
            timestamp: new Date(),
            read: false
        },
        {
            id: "2",
            title: "Schedule Conflict",
            message: "Multiple events scheduled for the same time slot.",
            type: "warning",
            timestamp: new Date(Date.now() - 3600000),
            read: false
        }
    ]);
    const markAsRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await sendRequest({
            type: "mark_notification_read",
            notificationId: id
        });
    };
    const deleteNotification = async (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        await sendRequest({
            type: "delete_notification",
            notificationId: id
        });
    };
    const getIcon = (type) => {
        switch (type) {
            case "success": return _jsx(Check, { className: "w-4 h-4 text-green-500" });
            case "warning": return _jsx(AlertCircle, { className: "w-4 h-4 text-yellow-500" });
            case "error": return _jsx(X, { className: "w-4 h-4 text-red-500" });
            default: return _jsx(Bell, { className: "w-4 h-4 text-blue-500" });
        }
    };
    const getTypeColor = (type) => {
        switch (type) {
            case "success": return "border-l-green-500";
            case "warning": return "border-l-yellow-500";
            case "error": return "border-l-red-500";
            default: return "border-l-blue-500";
        }
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Notifications" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsxs("span", { className: "text-sm text-gray-500", children: [notifications.filter(n => !n.read).length, " unread"] }) })] }), _jsx("div", { className: "space-y-4", children: notifications.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(Bell, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500", children: "No notifications" })] })) : (notifications.map((notification) => (_jsx("div", { className: `
                bg-white border rounded-lg p-4 shadow-sm
                ${getTypeColor(notification.type)}
                border-l-4
                ${notification.read ? "opacity-75" : ""}
              `, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-3 flex-1", children: [getIcon(notification.type), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-medium text-gray-900", children: notification.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: notification.message }), _jsx("p", { className: "text-xs text-gray-400 mt-2", children: notification.timestamp.toLocaleString() })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [!notification.read && (_jsx("button", { onClick: () => markAsRead(notification.id), className: "p-1 hover:bg-gray-100 rounded", title: "Mark as read", children: _jsx(Check, { className: "w-4 h-4 text-gray-500" }) })), _jsx("button", { onClick: () => deleteNotification(notification.id), className: "p-1 hover:bg-gray-100 rounded", title: "Delete", children: _jsx(X, { className: "w-4 h-4 text-gray-500" }) })] })] }) }, notification.id)))) })] }));
};
export default Notifications;
