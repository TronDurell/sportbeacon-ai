import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "../../contexts/AdminAuthContext";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
import { User, Bell, Shield, Palette } from "lucide-react";
const Settings = () => {
    const { user, updateUser } = useAuth();
    const { sendRequest } = useAgentOrchestration();
    const [activeSection, setActiveSection] = useState("profile");
    const settingsSections = [
        {
            id: "profile",
            title: "Profile Settings",
            icon: User,
            description: "Manage your personal information and preferences"
        },
        {
            id: "notifications",
            title: "Notifications",
            icon: Bell,
            description: "Configure how you receive notifications"
        },
        {
            id: "security",
            title: "Security",
            icon: Shield,
            description: "Manage your account security settings"
        },
        {
            id: "appearance",
            title: "Appearance",
            icon: Palette,
            description: "Customize the look and feel of the app"
        }
    ];
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: "",
        bio: ""
    });
    const [notificationSettings, setNotificationSettings] = useState({
        email: true,
        push: true,
        sms: false,
        teamUpdates: true,
        gameReminders: true,
        performanceReports: false
    });
    const handleProfileUpdate = async () => {
        try {
            await updateUser(profileData);
            await sendRequest({
                type: "update_profile",
                data: profileData
            });
        }
        catch (error) {
        }
    };
    const handleNotificationToggle = async (key) => {
        const newSettings = {
            ...notificationSettings,
            [key]: !notificationSettings[key]
        };
        setNotificationSettings(newSettings);
        await sendRequest({
            type: "update_notifications",
            settings: newSettings
        });
    };
    const renderSectionContent = () => {
        switch (activeSection) {
            case "profile":
                return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Personal Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "First Name" }), _jsx("input", { type: "text", value: profileData.firstName, onChange: (e) => setProfileData(prev => ({ ...prev, firstName: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Last Name" }), _jsx("input", { type: "text", value: profileData.lastName, onChange: (e) => setProfileData(prev => ({ ...prev, lastName: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { type: "email", value: profileData.email, onChange: (e) => setProfileData(prev => ({ ...prev, email: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Phone" }), _jsx("input", { type: "tel", value: profileData.phone, onChange: (e) => setProfileData(prev => ({ ...prev, phone: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Bio" }), _jsx("textarea", { value: profileData.bio, onChange: (e) => setProfileData(prev => ({ ...prev, bio: e.target.value })), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsx("button", { onClick: handleProfileUpdate, className: "mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700", children: "Save Changes" })] }) }));
            case "notifications":
                return (_jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Notification Preferences" }), _jsx("div", { className: "space-y-4", children: Object.entries(notificationSettings).map(([key, value]) => (_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 capitalize", children: key.replace(/([A-Z])/g, " $1").trim() }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Receive notifications for ", key.replace(/([A-Z])/g, " $1").toLowerCase()] })] }), _jsx("button", { onClick: () => handleNotificationToggle(key), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-200"}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}` }) })] }, key))) })] }));
            case "security":
                return (_jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Security Settings" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 border border-gray-200 rounded-lg", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Two-Factor Authentication" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Add an extra layer of security to your account" }), _jsx("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700", children: "Enable 2FA" })] }), _jsxs("div", { className: "p-4 border border-gray-200 rounded-lg", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Change Password" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Update your account password" }), _jsx("button", { className: "bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700", children: "Change Password" })] })] })] }));
            case "appearance":
                return (_jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Appearance Settings" }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "p-4 border border-gray-200 rounded-lg", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Theme" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { className: "px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50", children: "Light" }), _jsx("button", { className: "px-4 py-2 bg-gray-900 text-white rounded-md", children: "Dark" }), _jsx("button", { className: "px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50", children: "Auto" })] })] }) })] }));
            default:
                return null;
        }
    };
    return (_jsxs("div", { className: "flex h-full", children: [_jsxs("div", { className: "w-64 bg-white border-r border-gray-200 p-4", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Settings" }), _jsx("nav", { className: "space-y-2", children: settingsSections.map((section) => (_jsxs("button", { onClick: () => setActiveSection(section.id), className: `w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${activeSection === section.id
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "text-gray-700 hover:bg-gray-50"}`, children: [_jsx(section.icon, { className: "w-5 h-5" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: section.title }), _jsx("p", { className: "text-xs text-gray-500", children: section.description })] })] }, section.id))) })] }), _jsx("div", { className: "flex-1 p-6 bg-gray-50", children: _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: renderSectionContent() }) })] }));
};
export default Settings;
