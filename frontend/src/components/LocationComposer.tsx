import React, { useState } from "react";
import { createLocationPost } from "../hooks/useLocations";
import { LocationPost } from "../types";

interface LocationComposerProps {
  locationId: string;
  onPostCreated: (post: LocationPost) => void;
}

export const LocationComposer: React.FC<LocationComposerProps> = ({ 
  locationId, 
  onPostCreated 
}) => {
  const [postType, setPostType] = useState<"note" | "alert" | "run" | "clip" | "poll">("note");
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<"place" | "followers" | "team">("place");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Poll-specific state
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  
  // Run-specific state
  const [runStartsAt, setRunStartsAt] = useState("");
  const [runEndsAt, setRunEndsAt] = useState("");
  const [runLevel, setRunLevel] = useState<"open" | "league" | "private">("open");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const postData: Partial<LocationPost> = {
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

      const result = await createLocationPost(locationId, postData as any);
      
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
          id: result.postId!,
          locationId,
          ...postData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as LocationPost);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Post Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
        <div className="grid grid-cols-5 gap-2">
          {[
            { value: "note", label: "Note", icon: "📝" },
            { value: "alert", label: "Alert", icon: "🚨" },
            { value: "run", label: "Run", icon: "🏃" },
            { value: "clip", label: "Clip", icon: "📹" },
            { value: "poll", label: "Poll", icon: "📊" }
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setPostType(type.value as any)}
              className={`p-2 text-xs rounded-md border transition-colors ${
                postType === type.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="text-lg mb-1">{type.icon}</div>
              <div>{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Text Input */}
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={getPlaceholderText()}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Poll Configuration */}
      {postType === "poll" && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
            <div className="space-y-2">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePollOption(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <button
                  type="button"
                  onClick={addPollOption}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Option
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Run Configuration */}
      {postType === "run" && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-md">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={runStartsAt}
                onChange={(e) => setRunStartsAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time (optional)</label>
              <input
                type="datetime-local"
                value={runEndsAt}
                onChange={(e) => setRunEndsAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={runLevel}
              onChange={(e) => setRunLevel(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="open">Open to All</option>
              <option value="league">League/Competitive</option>
              <option value="private">Private/Invite Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Visibility Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "place", label: "Place", icon: "🏟️" },
            { value: "followers", label: "Followers", icon: "👥" },
            { value: "team", label: "Team", icon: "🏆" }
          ].map((vis) => (
            <button
              key={vis.value}
              type="button"
              onClick={() => setVisibility(vis.value as any)}
              className={`p-2 text-xs rounded-md border transition-colors ${
                visibility === vis.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="text-lg mb-1">{vis.icon}</div>
              <div>{vis.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !text.trim()}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Posting...
          </div>
        ) : (
          `Post ${postType.charAt(0).toUpperCase() + postType.slice(1)}`
        )}
      </button>
    </form>
  );
};
