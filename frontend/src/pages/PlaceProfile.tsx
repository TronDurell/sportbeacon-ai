import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useLocation, useLocationPosts } from "../hooks/useLocations";
import { PlaceHeader } from "../components/PlaceHeader";
import { FollowLocationButton } from "../components/FollowLocationButton";
import { LocationComposer } from "../components/LocationComposer";
import { LocationPostCard } from "../components/LocationPostCard";
import { LocationPost, PostFilters } from "../types";

const PlaceProfile: React.FC = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const [activeTab, setActiveTab] = useState<"thread" | "runs" | "notes" | "media">("thread");
  const [filters, setFilters] = useState<PostFilters>({});
  
  const { location, loading: locationLoading, error: locationError } = useLocation(locationId!);
  const { posts, loading: postsLoading, hasMore, loadMore } = useLocationPosts(locationId!, filters, 20);

  if (locationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (locationError || !location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Location Not Found</h1>
          <p className="text-gray-600">The location you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const filteredPosts = posts.filter(post => {
    switch (activeTab) {
      case "runs":
        return post.type === "run";
      case "notes":
        return post.type === "note";
      case "media":
        return post.type === "clip" && post.media && post.media.length > 0;
      default:
        return true; // thread shows all posts
    }
  });

  const pinnedNotes = posts.filter(post => post.type === "note" && post.pinned);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Place Header */}
      <PlaceHeader location={location} />
      
      {/* Follow Button */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <FollowLocationButton 
            locationId={location.id}
            userId="current-user-id" // TODO: Get from auth context
            onFollowChange={(isFollowing) => {
              console.log("Follow status changed:", isFollowing);
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Composer */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Something</h3>
              <LocationComposer 
                locationId={location.id}
                onPostCreated={(post) => {
                  console.log("New post created:", post);
                  // TODO: Refresh posts or add to list
                }}
              />
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-yellow-500 mr-2">📌</span>
                  Pinned Notes
                </h3>
                <div className="space-y-3">
                  {pinnedNotes.map((post) => (
                    <LocationPostCard 
                      key={post.id}
                      post={post}
                      location={location}
                      onLike={() => console.log("Like post:", post.id)}
                      onReport={() => console.log("Report post:", post.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: "thread", label: "Thread", count: posts.length },
                    { id: "runs", label: "Runs", count: posts.filter(p => p.type === "run").length },
                    { id: "notes", label: "Notes", count: posts.filter(p => p.type === "note").length },
                    { id: "media", label: "Media", count: posts.filter(p => p.type === "clip" && p.media && p.media.length > 0).length }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.label}
                      <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {postsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">🏟️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} yet</h3>
                    <p className="text-gray-500">
                      {activeTab === "thread" && "Be the first to share something about this place!"}
                      {activeTab === "runs" && "No runs scheduled yet. Create one to get people together!"}
                      {activeTab === "notes" && "No notes yet. Share your thoughts about this place!"}
                      {activeTab === "media" && "No media shared yet. Post photos or videos!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map((post) => (
                      <LocationPostCard 
                        key={post.id}
                        post={post}
                        location={location}
                        onLike={() => console.log("Like post:", post.id)}
                        onReport={() => console.log("Report post:", post.id)}
                      />
                    ))}
                    
                    {/* Load More Button */}
                    {hasMore && (
                      <div className="text-center pt-4">
                        <button
                          onClick={loadMore}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceProfile;
