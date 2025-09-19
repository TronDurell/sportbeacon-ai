import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { createLocationPost } from "../hooks/useLocations";
export const LocationComposer = ({ locationId, onPostCreated }) => {
    const [postType, setPostType] = useState("note");
    const [text, setText] = useState("");
    const [visibility, setVisibility] = useState("place");
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Poll-specific state
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);
    // Run-specific state
    const [runStartsAt, setRunStartsAt] = useState("");
    const [runEndsAt, setRunEndsAt] = useState("");
    const [runLevel, setRunLevel] = useState("open");
    const getPlaceholderText = () => {
        switch (postType) {
            case "note": return "Share a note about this place...";
            case "alert": return "What's happening here?";
            case "run": return "Organizing a run? Share the details...";
            case "clip": return "Describe your video or photo...";
            case "poll": return "Ask a question...";
            default: return "Share something...";
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim())
            return;
        setIsSubmitting(true);
        try {
            const postData = {
                locationId,
                type: postType,
                text: text.trim(),
                visibility,
                likeCount: 0,
                replyCount: 0,
                reportCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            // Add type-specific data
            if (postType === "poll" && pollQuestion.trim() && pollOptions.filter(opt => opt.trim()).length >= 2) {
                postData.poll = {
                    question: pollQuestion.trim(),
                    options: pollOptions.filter(opt => opt.trim()),
                    closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
                };
            }
            if (postType === "run" && runStartsAt) {
                postData.run = {
                    startsAt: new Date(runStartsAt).toISOString(),
                    endsAt: runEndsAt ? new Date(runEndsAt).toISOString() : undefined,
                    level: runLevel
                };
            }
            const result = await createLocationPost(locationId, postData);
            if (result.success) {
                // Reset form
                setText("");
                setPollQuestion("");
                setPollOptions(["", ""]);
                setRunStartsAt("");
                setRunEndsAt("");
                setPostType("note");
                setVisibility("place");
                // Notify parent with the created post data
                onPostCreated({
                    id: result.postId,
                    locationId,
                    ...postData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        }
        catch (error) {
            console.error("Failed to create post:", error);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const addPollOption = () => {
        if (pollOptions.length < 6) {
            setPollOptions([...pollOptions, ""]);
        }
    };
    const removePollOption = (index) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== index));
        }
    };
    const updatePollOption = (index, value) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Post Type" }), _jsx("div", { className: "grid grid-cols-5 gap-2", children: [
                            { value: "note", label: "Note", icon: "📝" },
                            { value: "alert", label: "Alert", icon: "🚨" },
                            { value: "run", label: "Run", icon: "🏃" },
                            { value: "clip", label: "Clip", icon: "📹" },
                            { value: "poll", label: "Poll", icon: "📊" }
                        ].map((type) => (_jsxs("button", { type: "button", onClick: () => setPostType(type.value), className: `p-2 text-xs rounded-md border transition-colors ${postType === type.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`, children: [_jsx("div", { className: "text-lg mb-1", children: type.icon }), _jsx("div", { children: type.label })] }, type.value))) })] }), _jsx("div", { children: _jsx("textarea", { value: text, onChange: (e) => setText(e.target.value), placeholder: getPlaceholderText(), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", required: true }) }), postType === "poll" && (_jsxs("div", { className: "space-y-3 p-3 bg-gray-50 rounded-md", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Question" }), _jsx("input", { type: "text", value: pollQuestion, onChange: (e) => setPollQuestion(e.target.value), placeholder: "What would you like to ask?", className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Options" }), _jsxs("div", { className: "space-y-2", children: [pollOptions.map((option, index) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "text", value: option, onChange: (e) => updatePollOption(index, e.target.value), placeholder: `Option ${index + 1}`, className: "flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", required: true }), pollOptions.length > 2 && (_jsx("button", { type: "button", onClick: () => removePollOption(index), className: "p-2 text-red-600 hover:text-red-800", children: "\u2715" }))] }, index))), pollOptions.length < 6 && (_jsx("button", { type: "button", onClick: addPollOption, className: "text-sm text-blue-600 hover:text-blue-800", children: "+ Add Option" }))] })] })] })), postType === "run" && (_jsxs("div", { className: "space-y-3 p-3 bg-gray-50 rounded-md", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Start Time" }), _jsx("input", { type: "datetime-local", value: runStartsAt, onChange: (e) => setRunStartsAt(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "End Time (optional)" }), _jsx("input", { type: "datetime-local", value: runEndsAt, onChange: (e) => setRunEndsAt(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Level" }), _jsxs("select", { value: runLevel, onChange: (e) => setRunLevel(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "open", children: "Open to All" }), _jsx("option", { value: "league", children: "League/Competitive" }), _jsx("option", { value: "private", children: "Private/Invite Only" })] })] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Visibility" }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: [
                            { value: "place", label: "Place", icon: "🏟️" },
                            { value: "followers", label: "Followers", icon: "👥" },
                            { value: "team", label: "Team", icon: "🏆" }
                        ].map((vis) => (_jsxs("button", { type: "button", onClick: () => setVisibility(vis.value), className: `p-2 text-xs rounded-md border transition-colors ${visibility === vis.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`, children: [_jsx("div", { className: "text-lg mb-1", children: vis.icon }), _jsx("div", { children: vis.label })] }, vis.value))) })] }), _jsx("button", { type: "submit", disabled: isSubmitting || !text.trim(), className: "w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed", children: isSubmitting ? (_jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }), "Posting..."] })) : (`Post ${postType.charAt(0).toUpperCase() + postType.slice(1)}`) })] }));
};
