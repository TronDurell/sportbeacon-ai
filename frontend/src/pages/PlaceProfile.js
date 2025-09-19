import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useLocation, useLocationPosts } from "../hooks/useLocations";
import { PlaceHeader } from "../components/PlaceHeader";
import { FollowLocationButton } from "../components/FollowLocationButton";
import { LocationComposer } from "../components/LocationComposer";
import { LocationPostCard } from "../components/LocationPostCard";
const PlaceProfile = () => {
    const { locationId } = useParams();
    const [activeTab, setActiveTab] = useState("thread");
    const [filters, setFilters] = useState({});
    const { location, loading: locationLoading, error: locationError } = useLocation(locationId);
    const { posts, loading: postsLoading, hasMore, loadMore } = useLocationPosts(locationId, filters, 20);
    if (locationLoading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" }) }));
    }
    if (locationError || !location) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Location Not Found" }), _jsx("p", { className: "text-gray-600", children: "The location you're looking for doesn't exist or has been removed." })] }) }));
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
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(PlaceHeader, { location: location }), _jsx("div", { className: "bg-white border-b border-gray-200 px-4 py-3", children: _jsx("div", { className: "max-w-4xl mx-auto", children: _jsx(FollowLocationButton, { locationId: location.id, userId: "current-user-id" // TODO: Get from auth context
                        , onFollowChange: (isFollowing) => {
                            console.log("Follow status changed:", isFollowing);
                        } }) }) }), _jsx("div", { className: "max-w-4xl mx-auto px-4 py-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-1", children: _jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Share Something" }), _jsx(LocationComposer, { locationId: location.id, onPostCreated: (post) => {
                                            console.log("New post created:", post);
                                            // TODO: Refresh posts or add to list
                                        } })] }) }), _jsxs("div", { className: "lg:col-span-2", children: [pinnedNotes.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-3 flex items-center", children: [_jsx("span", { className: "text-yellow-500 mr-2", children: "\uD83D\uDCCC" }), "Pinned Notes"] }), _jsx("div", { className: "space-y-3", children: pinnedNotes.map((post) => (_jsx(LocationPostCard, { post: post, location: location, onLike: () => console.log("Like post:", post.id), onReport: () => console.log("Report post:", post.id) }, post.id))) })] })), _jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 mb-6", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "flex space-x-8 px-6", children: [
                                                    { id: "thread", label: "Thread", count: posts.length },
                                                    { id: "runs", label: "Runs", count: posts.filter(p => p.type === "run").length },
                                                    { id: "notes", label: "Notes", count: posts.filter(p => p.type === "note").length },
                                                    { id: "media", label: "Media", count: posts.filter(p => p.type === "clip" && p.media && p.media.length > 0).length }
                                                ].map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                                        ? "border-blue-500 text-blue-600"
                                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`, children: [tab.label, _jsx("span", { className: "ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium", children: tab.count })] }, tab.id))) }) }), _jsx("div", { className: "p-6", children: postsLoading ? (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) })) : filteredPosts.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "text-gray-400 text-6xl mb-4", children: "\uD83C\uDFDF\uFE0F" }), _jsxs("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: ["No ", activeTab, " yet"] }), _jsxs("p", { className: "text-gray-500", children: [activeTab === "thread" && "Be the first to share something about this place!", activeTab === "runs" && "No runs scheduled yet. Create one to get people together!", activeTab === "notes" && "No notes yet. Share your thoughts about this place!", activeTab === "media" && "No media shared yet. Post photos or videos!"] })] })) : (_jsxs("div", { className: "space-y-4", children: [filteredPosts.map((post) => (_jsx(LocationPostCard, { post: post, location: location, onLike: () => console.log("Like post:", post.id), onReport: () => console.log("Report post:", post.id) }, post.id))), hasMore && (_jsx("div", { className: "text-center pt-4", children: _jsx("button", { onClick: loadMore, className: "inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Load More" }) }))] })) })] })] })] }) })] }));
};
export default PlaceProfile;
