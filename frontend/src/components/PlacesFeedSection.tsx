import React, { useState } from "react";
import { useHomeLocationFeed } from "../hooks/useLocations";
// import { LocationPostCard } from "./LocationPostCard";
// import { HomeFeedItem, LocationPost, Location } from "../types";

interface PlacesFeedSectionProps {
  userId: string;
  title?: string;
  maxItems?: number;
}

export const PlacesFeedSection: React.FC<PlacesFeedSectionProps> = ({ 
  userId, 
  title = "From places you follow",
  maxItems = 10
}) => {
  const [expanded, setExpanded] = useState(false);
  const { feedItems, loading, hasMore, loadMore } = useHomeLocationFeed(userId, maxItems);

  if (loading && feedItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">🏟️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No places followed yet</h3>
          <p className="text-gray-500">
            Follow some places to see their updates here!
          </p>
        </div>
      </div>
    );
  }

  const displayedItems = expanded ? feedItems : feedItems.slice(0, maxItems);
  const hasHiddenItems = feedItems.length > maxItems;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">
              {feedItems.length} update{feedItems.length !== 1 ? "s" : ""} from your followed places
            </p>
          </div>
          
          {hasHiddenItems && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {expanded ? "Show Less" : `Show ${feedItems.length - maxItems} More`}
            </button>
          )}
        </div>
      </div>

      {/* Feed Items */}
      <div className="divide-y divide-gray-200">
        {displayedItems.map((feedItem) => (
          <div key={feedItem.id} className="p-6">
            {/* Feed Item Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">🏟️</span>
                <span className="text-sm font-medium text-gray-900">
                  {feedItem.source.kind === "location" ? "Location Update" : "Update"}
                </span>
                <span className="text-xs text-gray-400">
                  Rank: {feedItem.rank.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(feedItem.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Post Content - This would be fetched separately in a real implementation */}
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-600">
                <em>Post content would be loaded here based on {feedItem.postRef}</em>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Reference: {feedItem.postRef}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={loadMore}
            className="w-full bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Load More Updates
          </button>
        </div>
      )}

      {/* Show More/Less Toggle */}
      {hasHiddenItems && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {expanded ? "Show Less" : `Show ${feedItems.length - maxItems} More Updates`}
          </button>
        </div>
      )}
    </div>
  );
};
