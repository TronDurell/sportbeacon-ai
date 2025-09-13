import React, { useState } from "react";
import { LocationPost, Location } from "../types";

interface LocationPostCardProps {
  post: LocationPost;
  location: Location;
  onLike: () => void;
  onReport: () => void;
}

export const LocationPostCard: React.FC<LocationPostCardProps> = ({ 
  post, 
  location, 
  onLike, 
  onReport 
}) => {
  const [showActions, setShowActions] = useState(false);

  const getPostIcon = () => {
    switch (post.type) {
      case "note": return "📝";
      case "alert": return "🚨";
      case "run": return "🏃";
      case "clip": return "📹";
      case "poll": return "📊";
      default: return "💬";
    }
  };

  const getPostTypeLabel = () => {
    switch (post.type) {
      case "note": return "Note";
      case "alert": return "Alert";
      case "run": return "Run";
      case "clip": return "Media";
      case "poll": return "Poll";
      default: return "Post";
    }
  };

  const getVisibilityIcon = () => {
    switch (post.visibility) {
      case "place": return "🏟️";
      case "followers": return "👥";
      case "team": return "🏆";
      default: return "🌐";
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return dateObj.toLocaleDateString();
  };

  const renderPoll = () => {
    if (!post.poll) return null;
    
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-md">
        <h4 className="font-medium text-gray-900 mb-2">{post.poll.question}</h4>
        <div className="space-y-2">
          {post.poll.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="radio"
                name={`poll-${post.id}`}
                id={`option-${post.id}-${index}`}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor={`option-${post.id}-${index}`} className="text-sm text-gray-700">
                {option}
              </label>
            </div>
          ))}
        </div>
        {post.poll.closesAt && (
          <p className="text-xs text-gray-500 mt-2">
            Closes {formatDate(post.poll.closesAt)}
          </p>
        )}
      </div>
    );
  };

  const renderRun = () => {
    if (!post.run) return null;
    
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-blue-600">🏃</span>
          <span className="font-medium text-blue-900">Run Details</span>
        </div>
        {post.run.startsAt && (
          <p className="text-sm text-blue-800">
            <span className="font-medium">Starts:</span> {formatDate(post.run.startsAt)}
          </p>
        )}
        {post.run.endsAt && (
          <p className="text-sm text-blue-800">
            <span className="font-medium">Ends:</span> {formatDate(post.run.endsAt)}
          </p>
        )}
        <p className="text-sm text-blue-800">
          <span className="font-medium">Level:</span> {post.run.level}
        </p>
      </div>
    );
  };

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;
    
    return (
      <div className="mt-3 space-y-2">
        {post.media.map((media, index) => (
          <div key={index} className="relative">
            {media.type === "image" ? (
              <img
                src={media.url}
                alt="Post media"
                className="w-full h-48 object-cover rounded-md"
              />
            ) : (
              <video
                src={media.url}
                controls
                className="w-full h-48 object-cover rounded-md"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getPostIcon()}</span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {getPostTypeLabel()}
                </span>
                {post.pinned && (
                  <span className="text-yellow-500 text-xs">📌 Pinned</span>
                )}
                <span className="text-xs text-gray-500">
                  {getVisibilityIcon()} {post.visibility}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            ⋯
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                <button
                  onClick={onLike}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  ❤️ Like
                </button>
                <button
                  onClick={onReport}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  🚨 Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      {post.text && (
        <p className="text-gray-900 mb-3">{post.text}</p>
      )}

      {/* Type-specific Content */}
      {post.type === "poll" && renderPoll()}
      {post.type === "run" && renderRun()}
      {post.type === "clip" && renderMedia()}

      {/* Post Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <button
            onClick={onLike}
            className="flex items-center space-x-1 hover:text-red-500 transition-colors"
          >
            <span>❤️</span>
            <span>{post.likeCount}</span>
          </button>
          
          <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
            <span>💬</span>
            <span>{post.replyCount}</span>
          </button>
          
          {post.reportCount > 0 && (
            <span className="text-red-500">
              🚨 {post.reportCount} report{post.reportCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        
        <div className="text-xs text-gray-400">
          {location.name}
        </div>
      </div>
    </div>
  );
};
