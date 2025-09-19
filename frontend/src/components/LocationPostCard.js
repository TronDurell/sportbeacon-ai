import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export const LocationPostCard = ({ post, location, onLike, onReport }) => {
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
    const formatDate = (date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diff = now.getTime() - dateObj.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1)
            return "Just now";
        if (minutes < 60)
            return `${minutes}m ago`;
        if (hours < 24)
            return `${hours}h ago`;
        if (days < 7)
            return `${days}d ago`;
        return dateObj.toLocaleDateString();
    };
    const renderPoll = () => {
        if (!post.poll)
            return null;
        return (_jsxs("div", { className: "mt-3 p-3 bg-gray-50 rounded-md", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: post.poll.question }), _jsx("div", { className: "space-y-2", children: post.poll.options.map((option, index) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: `poll-${post.id}`, id: `option-${post.id}-${index}`, className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" }), _jsx("label", { htmlFor: `option-${post.id}-${index}`, className: "text-sm text-gray-700", children: option })] }, index))) }), post.poll.closesAt && (_jsxs("p", { className: "text-xs text-gray-500 mt-2", children: ["Closes ", formatDate(post.poll.closesAt)] }))] }));
    };
    const renderRun = () => {
        if (!post.run)
            return null;
        return (_jsxs("div", { className: "mt-3 p-3 bg-blue-50 rounded-md border border-blue-200", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx("span", { className: "text-blue-600", children: "\uD83C\uDFC3" }), _jsx("span", { className: "font-medium text-blue-900", children: "Run Details" })] }), post.run.startsAt && (_jsxs("p", { className: "text-sm text-blue-800", children: [_jsx("span", { className: "font-medium", children: "Starts:" }), " ", formatDate(post.run.startsAt)] })), post.run.endsAt && (_jsxs("p", { className: "text-sm text-blue-800", children: [_jsx("span", { className: "font-medium", children: "Ends:" }), " ", formatDate(post.run.endsAt)] })), _jsxs("p", { className: "text-sm text-blue-800", children: [_jsx("span", { className: "font-medium", children: "Level:" }), " ", post.run.level] })] }));
    };
    const renderMedia = () => {
        if (!post.media || post.media.length === 0)
            return null;
        return (_jsx("div", { className: "mt-3 space-y-2", children: post.media.map((media, index) => (_jsx("div", { className: "relative", children: media.type === "image" ? (_jsx("img", { src: media.url, alt: "Post media", className: "w-full h-48 object-cover rounded-md" })) : (_jsx("video", { src: media.url, controls: true, className: "w-full h-48 object-cover rounded-md" })) }, index))) }));
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("div", { className: "flex items-center space-x-3", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-2xl", children: getPostIcon() }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-900", children: getPostTypeLabel() }), post.pinned && (_jsx("span", { className: "text-yellow-500 text-xs", children: "\uD83D\uDCCC Pinned" })), _jsxs("span", { className: "text-xs text-gray-500", children: [getVisibilityIcon(), " ", post.visibility] })] }), _jsx("p", { className: "text-xs text-gray-500", children: formatDate(post.createdAt) })] })] }) }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowActions(!showActions), className: "p-1 text-gray-400 hover:text-gray-600 focus:outline-none", children: "\u22EF" }), showActions && (_jsx("div", { className: "absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10", children: _jsxs("div", { className: "py-1", children: [_jsx("button", { onClick: onLike, className: "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: "\u2764\uFE0F Like" }), _jsx("button", { onClick: onReport, className: "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: "\uD83D\uDEA8 Report" })] }) }))] })] }), post.text && (_jsx("p", { className: "text-gray-900 mb-3", children: post.text })), post.type === "poll" && renderPoll(), post.type === "run" && renderRun(), post.type === "clip" && renderMedia(), _jsxs("div", { className: "flex items-center justify-between mt-4 pt-3 border-t border-gray-100", children: [_jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-500", children: [_jsxs("button", { onClick: onLike, className: "flex items-center space-x-1 hover:text-red-500 transition-colors", children: [_jsx("span", { children: "\u2764\uFE0F" }), _jsx("span", { children: post.likeCount })] }), _jsxs("button", { className: "flex items-center space-x-1 hover:text-blue-500 transition-colors", children: [_jsx("span", { children: "\uD83D\uDCAC" }), _jsx("span", { children: post.replyCount })] }), post.reportCount > 0 && (_jsxs("span", { className: "text-red-500", children: ["\uD83D\uDEA8 ", post.reportCount, " report", post.reportCount !== 1 ? "s" : ""] }))] }), _jsx("div", { className: "text-xs text-gray-400", children: location.name })] })] }));
};
