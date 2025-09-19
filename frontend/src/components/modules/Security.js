import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Shield, Lock, Eye, EyeOff, Key } from "lucide-react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const Security = () => {
    const { sendRequest } = useAgentOrchestration();
    const [showPassword, setShowPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const securityFeatures = [
        {
            title: "Two-Factor Authentication",
            description: "Add an extra layer of security to your account",
            enabled: true,
            icon: Shield
        },
        {
            title: "Login Notifications",
            description: "Get notified when someone logs into your account",
            enabled: true,
            icon: Lock
        },
        {
            title: "Session Management",
            description: "View and manage active sessions",
            enabled: false,
            icon: Key
        }
    ];
    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match");
            return;
        }
        await sendRequest({
            type: "change_password",
            currentPassword,
            newPassword
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };
    return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Security Settings" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Change Password" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Current Password" }), _jsx("input", { type: "password", value: currentPassword, onChange: (e) => setCurrentPassword(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "New Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPassword ? "text" : "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2", children: showPassword ? _jsx(EyeOff, { className: "w-4 h-4 text-gray-500" }) : _jsx(Eye, { className: "w-4 h-4 text-gray-500" }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Confirm New Password" }), _jsx("input", { type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsx("button", { onClick: handlePasswordChange, className: "w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700", children: "Update Password" })] })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Security Features" }), _jsx("div", { className: "space-y-4", children: securityFeatures.map((feature, index) => (_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(feature.icon, { className: "w-5 h-5 text-blue-500" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: feature.title }), _jsx("p", { className: "text-sm text-gray-600", children: feature.description })] })] }), _jsx("button", { className: `px-3 py-1 rounded-full text-sm font-medium ${feature.enabled
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"}`, children: feature.enabled ? "Enabled" : "Disabled" })] }, index))) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Recent Activity" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Login from new device" }), _jsx("p", { className: "text-sm text-gray-600", children: "Chrome on Windows \u2022 2 hours ago" })] }), _jsx("span", { className: "text-green-600 text-sm", children: "\u2713 Verified" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Password changed" }), _jsx("p", { className: "text-sm text-gray-600", children: "1 day ago" })] }), _jsx("span", { className: "text-blue-600 text-sm", children: "\u2713 Confirmed" })] })] })] })] })] })] }));
};
export default Security;
