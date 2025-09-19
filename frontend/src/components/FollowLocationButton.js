import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useIsFollowingLocation, followLocation, unfollowLocation } from "../hooks/useLocations";
export const FollowLocationButton = ({ locationId, userId, onFollowChange }) => {
    const [notificationPref, setNotificationPref] = useState("all");
    const [showPreferences, setShowPreferences] = useState(false);
    const { isFollowing, loading } = useIsFollowingLocation(locationId, userId);
    const handleFollow = async () => {
        try {
            const result = await followLocation(locationId, userId, notificationPref);
            if (result.success) {
                onFollowChange(true);
                setShowPreferences(false);
            }
        }
        catch (error) {
            console.error("Failed to follow location:", error);
        }
    };
    const handleUnfollow = async () => {
        try {
            const result = await unfollowLocation(locationId, userId);
            if (result.success) {
                onFollowChange(false);
            }
        }
        catch (error) {
            console.error("Failed to unfollow location:", error);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" }), "Loading..."] }));
    }
    if (isFollowing) {
        return (_jsx("div", { className: "relative", children: _jsxs("button", { onClick: handleUnfollow, className: "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: [_jsx("span", { className: "text-green-600 mr-2", children: "\u2713" }), "Following"] }) }));
    }
    return (_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setShowPreferences(!showPreferences), className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: [_jsx("span", { className: "mr-2", children: "+" }), "Follow"] }), showPreferences && (_jsx("div", { className: "absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10", children: _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900 mb-3", children: "Notification Preferences" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "notification", value: "all", checked: notificationPref === "all", onChange: (e) => setNotificationPref(e.target.value), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" }), _jsxs("div", { className: "ml-3", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: "All Updates" }), _jsx("div", { className: "text-xs text-gray-500", children: "Get notified about every post and activity" })] })] }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "notification", value: "digest", checked: notificationPref === "digest", onChange: (e) => setNotificationPref(e.target.value), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" }), _jsxs("div", { className: "ml-3", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: "Daily Digest" }), _jsx("div", { className: "text-xs text-gray-500", children: "Get a summary once per day" })] })] }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "notification", value: "mute", checked: notificationPref === "mute", onChange: (e) => setNotificationPref(e.target.value), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" }), _jsxs("div", { className: "ml-3", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: "Mute" }), _jsx("div", { className: "text-xs text-gray-500", children: "No notifications, just follow for updates" })] })] })] }), _jsxs("div", { className: "mt-4 flex space-x-2", children: [_jsx("button", { onClick: handleFollow, className: "flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Follow" }), _jsx("button", { onClick: () => setShowPreferences(false), className: "flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500", children: "Cancel" })] })] }) }))] }));
};
