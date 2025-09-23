import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AdminAuthContext";
import { useSmartLayer } from "../../contexts/SmartLayerContext";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const SCOUT_CONTENT_LIBRARY = [
    // Player-focused content
    {
        id: "drill-001",
        type: "drill",
        title: "Ball Control Mastery",
        description: "Advanced dribbling drills to improve your ball control",
        tags: ["dribbling", "ball-control", "skill-development"],
        difficulty: "intermediate",
        duration: 15,
        engagement: 85,
        relevance: 90
    },
    {
        id: "highlight-001",
        type: "highlight",
        title: "Weekend Tournament Highlights",
        description: "Best plays from this weekend's local tournament",
        tags: ["highlights", "tournament", "community"],
        difficulty: "beginner",
        duration: 5,
        engagement: 92,
        relevance: 75
    },
    {
        id: "article-001",
        type: "article",
        title: "Nutrition for Peak Performance",
        description: "Fuel your game with the right nutrition strategy",
        tags: ["nutrition", "performance", "health"],
        difficulty: "beginner",
        duration: 8,
        engagement: 78,
        relevance: 80
    },
    // Coach-focused content
    {
        id: "drill-002",
        type: "drill",
        title: "Team Building Exercises",
        description: "Drills that build team chemistry and communication",
        tags: ["team-building", "chemistry", "communication"],
        difficulty: "intermediate",
        duration: 20,
        engagement: 88,
        relevance: 95
    },
    {
        id: "video-001",
        type: "video",
        title: "Game Strategy Analysis",
        description: "Breakdown of successful game strategies",
        tags: ["strategy", "analysis", "tactics"],
        difficulty: "advanced",
        duration: 12,
        engagement: 90,
        relevance: 92
    },
    // Parent-focused content
    {
        id: "event-001",
        type: "event",
        title: "Parent-Coach Communication Workshop",
        description: "Learn effective ways to communicate with coaches",
        tags: ["communication", "parenting", "coaching"],
        difficulty: "beginner",
        duration: 10,
        engagement: 82,
        relevance: 88
    },
    {
        id: "community-001",
        type: "community",
        title: "Local Sports Community Updates",
        description: "Stay connected with your local sports community",
        tags: ["community", "local", "updates"],
        difficulty: "beginner",
        duration: 3,
        engagement: 75,
        relevance: 85
    }
];
const ROLE_SCOUT_PREFERENCES = {
    player: {
        contentTypes: ["drill", "highlight", "article", "video"],
        difficulty: ["beginner", "intermediate"],
        maxDuration: 20,
        tags: ["skill-development", "performance", "training"],
        engagement: 70
    },
    coach: {
        contentTypes: ["drill", "video", "article"],
        difficulty: ["intermediate", "advanced"],
        maxDuration: 30,
        tags: ["strategy", "team-building", "coaching"],
        engagement: 80
    },
    parent: {
        contentTypes: ["article", "event", "community"],
        difficulty: ["beginner"],
        maxDuration: 15,
        tags: ["parenting", "communication", "safety"],
        engagement: 75
    },
    admin: {
        contentTypes: ["article", "community", "event"],
        difficulty: ["beginner", "intermediate"],
        maxDuration: 25,
        tags: ["management", "analytics", "operations"],
        engagement: 85
    }
};
export const useScoutRoleCurationHub = () => {
    const { user } = useAuth();
    const { userIntent } = useSmartLayer();
    const { sendRequest } = useAgentOrchestration();
    const [scoutSession, setScoutSession] = useState(null);
    const [curatedContent, setCuratedContent] = useState([]);
    const [currentContentIndex, setCurrentContentIndex] = useState(0);
    // Initialize scout session
    useEffect(() => {
        if (!user)
            return;
        const rolePrefs = ROLE_SCOUT_PREFERENCES[user.role] || ROLE_SCOUT_PREFERENCES.player;
        const newScoutSession = {
            role: user.role,
            intent: userIntent || "explore",
            filters: {
                contentTypes: rolePrefs?.contentTypes || ["drill", "highlight", "article"],
                difficulty: rolePrefs?.difficulty || ["beginner", "intermediate"],
                maxDuration: rolePrefs?.maxDuration || 20,
                tags: rolePrefs?.tags || [],
                engagement: rolePrefs?.engagement || 70
            },
            contentQueue: [],
            viewedContent: [],
            engagement: {}
        };
        setScoutSession(newScoutSession);
        curateContent(newScoutSession);
    }, [user, userIntent]);
    const curateContent = useCallback((session) => {
        const filteredContent = SCOUT_CONTENT_LIBRARY.filter(content => {
            // Filter by content type
            if (!session.filters.contentTypes.includes(content.type))
                return false;
            // Filter by difficulty
            if (!session.filters.difficulty.includes(content.difficulty))
                return false;
            // Filter by duration
            if (content.duration > session.filters.maxDuration)
                return false;
            // Filter by engagement
            if (content.engagement < session.filters.engagement)
                return false;
            // Filter by tags if specified
            if (session.filters.tags.length > 0) {
                const hasRelevantTag = session.filters.tags.some(tag => content.tags.some(contentTag => contentTag.includes(tag)));
                if (!hasRelevantTag)
                    return false;
            }
            return true;
        });
        // Sort by relevance and engagement
        filteredContent.sort((a, b) => {
            const aScore = (a.relevance * 0.6) + (a.engagement * 0.4);
            const bScore = (b.relevance * 0.6) + (b.engagement * 0.4);
            return bScore - aScore;
        });
        // Limit to 10 items for the session
        const curatedQueue = filteredContent.slice(0, 10);
        setCuratedContent(curatedQueue);
        setCurrentContentIndex(0);
        if (scoutSession) {
            setScoutSession(prev => prev ? {
                ...prev,
                contentQueue: curatedQueue
            } : null);
        }
    }, [scoutSession]);
    const getCurrentContent = useCallback(() => {
        if (curatedContent.length === 0 || currentContentIndex >= curatedContent.length) {
            return null;
        }
        return curatedContent[currentContentIndex];
    }, [curatedContent, currentContentIndex]);
    const nextContent = useCallback(() => {
        if (currentContentIndex < curatedContent.length - 1) {
            setCurrentContentIndex(prev => prev + 1);
        }
    }, [currentContentIndex, curatedContent.length]);
    const previousContent = useCallback(() => {
        if (currentContentIndex > 0) {
            setCurrentContentIndex(prev => prev - 1);
        }
    }, [currentContentIndex]);
    const markContentViewed = useCallback((contentId, engagement) => {
        if (!scoutSession)
            return;
        const updatedSession = {
            ...scoutSession,
            viewedContent: [...scoutSession.viewedContent, contentId],
            engagement: {
                ...scoutSession.engagement,
                [contentId]: engagement
            }
        };
        setScoutSession(updatedSession);
        // Send engagement data to analytics
        sendRequest({
            type: "scout_content_engagement",
            context: "growth_session",
            data: {
                contentId,
                engagement,
                session: updatedSession,
                user: user?.id
            }
        });
    }, [scoutSession, user, sendRequest]);
    const getScoutSessionProgress = useCallback(() => {
        if (!scoutSession)
            return { viewed: 0, total: 0, progress: 0 };
        const viewed = scoutSession.viewedContent.length;
        const total = scoutSession.contentQueue.length;
        const progress = total > 0 ? (viewed / total) * 100 : 0;
        return { viewed, total, progress };
    }, [scoutSession]);
    const getScoutRecommendations = useCallback(() => {
        if (!scoutSession)
            return [];
        // Get content not yet viewed
        const unviewedContent = scoutSession.contentQueue.filter(content => !scoutSession.viewedContent.includes(content.id));
        // Sort by engagement and relevance
        return unviewedContent
            .sort((a, b) => {
            const aScore = (a.relevance * 0.7) + (a.engagement * 0.3);
            const bScore = (b.relevance * 0.7) + (b.engagement * 0.3);
            return bScore - aScore;
        })
            .slice(0, 3);
    }, [scoutSession]);
    const updateScoutFilters = useCallback((newFilters) => {
        if (!scoutSession)
            return;
        const updatedSession = {
            ...scoutSession,
            filters: { ...scoutSession.filters, ...newFilters }
        };
        setScoutSession(updatedSession);
        curateContent(updatedSession);
    }, [scoutSession, curateContent]);
    return {
        scoutSession,
        curatedContent,
        currentContent: getCurrentContent(),
        nextContent,
        previousContent,
        markContentViewed,
        getScoutSessionProgress,
        getScoutRecommendations,
        updateScoutFilters,
        hasNext: currentContentIndex < curatedContent.length - 1,
        hasPrevious: currentContentIndex > 0
    };
};
