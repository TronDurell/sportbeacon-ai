import React, { useState } from "react";
import { useIsFollowingLocation, followLocation, unfollowLocation } from "../hooks/useLocations";
// import { Location } from "../types";

interface FollowLocationButtonProps {
  locationId: string;
  userId: string;
  onFollowChange: (isFollowing: boolean) => void;
}

export const FollowLocationButton: React.FC<FollowLocationButtonProps> = ({ 
  locationId, 
  userId, 
  onFollowChange 
}) => {
  const [notificationPref, setNotificationPref] = useState<"all" | "digest" | "mute">("all");
  const [showPreferences, setShowPreferences] = useState(false);
  
  const { isFollowing, loading } = useIsFollowingLocation(locationId, userId);

  const handleFollow = async () => {
    try {
      const result = await followLocation(locationId, userId, notificationPref);
      if (result.success) {
        onFollowChange(true);
        setShowPreferences(false);
      }
    } catch (error) {
      console.error("Failed to follow location:", error);
    }
  };

  const handleUnfollow = async () => {
    try {
      const result = await unfollowLocation(locationId, userId);
      if (result.success) {
        onFollowChange(false);
      }
    } catch (error) {
      console.error("Failed to unfollow location:", error);
    }
  };

  if (loading) {
    return (
      <div className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
        Loading...
      </div>
    );
  }

  if (isFollowing) {
    return (
      <div className="relative">
        <button
          onClick={handleUnfollow}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="text-green-600 mr-2">✓</span>
          Following
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPreferences(!showPreferences)}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span className="mr-2">+</span>
        Follow
      </button>

      {/* Notification Preferences Dropdown */}
      {showPreferences && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Notification Preferences</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="notification"
                  value="all"
                  checked={notificationPref === "all"}
                  onChange={(e) => setNotificationPref(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">All Updates</div>
                  <div className="text-xs text-gray-500">Get notified about every post and activity</div>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="notification"
                  value="digest"
                  checked={notificationPref === "digest"}
                  onChange={(e) => setNotificationPref(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Daily Digest</div>
                  <div className="text-xs text-gray-500">Get a summary once per day</div>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="notification"
                  value="mute"
                  checked={notificationPref === "mute"}
                  onChange={(e) => setNotificationPref(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Mute</div>
                  <div className="text-xs text-gray-500">No notifications, just follow for updates</div>
                </div>
              </label>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={handleFollow}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Follow
              </button>
              <button
                onClick={() => setShowPreferences(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
