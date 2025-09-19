import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, MapPin, Calendar, Users, Star, Phone, Mail, Globe, ChevronDown, ChevronUp, BookOpen, Settings, CheckCircle, Info } from "lucide-react";
import CivicAgent from "../../lib/ai/CivicAgent";
const CivicAgentUI = ({ municipalityName = "Cary", leaguePolicies = [], adminRole = "public" }) => {
    const [agent, setAgent] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showFacilities, setShowFacilities] = useState(false);
    const [showPolicies, setShowPolicies] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    // Initialize Civic Agent
    useEffect(() => {
        const civicAgent = new CivicAgent(municipalityName, leaguePolicies, adminRole);
        setAgent(civicAgent);
        // Send welcome message
        civicAgent.getOnboardingAssistant().then(response => {
            const welcomeMessage = {
                id: Date.now().toString(),
                type: "assistant",
                content: response.answer,
                timestamp: new Date(),
                response
            };
            setMessages([welcomeMessage]);
        });
        return () => {
            civicAgent.endSession();
        };
    }, [municipalityName, leaguePolicies, adminRole]);
    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    const handleSendMessage = async (content) => {
        if (!agent || !content.trim())
            return;
        const userMessage = {
            id: Date.now().toString(),
            type: "user",
            content: content.trim(),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);
        try {
            // Determine query type based on content
            const queryType = determineQueryType(content);
            const query = {
                type: queryType,
                question: content,
                context: extractContext(content)
            };
            const response = await agent.handleQuery(query);
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                type: "assistant",
                content: response.answer,
                timestamp: new Date(),
                response
            };
            setMessages(prev => [...prev, assistantMessage]);
        }
        catch (error) {
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                type: "assistant",
                content: "Sorry, I encountered an error. Please try again or contact our office for assistance.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const determineQueryType = (content) => {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes("policy") || lowerContent.includes("refund") || lowerContent.includes("cost") || lowerContent.includes("age")) {
            return "policy";
        }
        else if (lowerContent.includes("register") || lowerContent.includes("sign up") || lowerContent.includes("join")) {
            return "registration";
        }
        else if (lowerContent.includes("facility") || lowerContent.includes("location") || lowerContent.includes("where")) {
            return "facility";
        }
        else if (lowerContent.includes("recommend") || lowerContent.includes("suggest") || lowerContent.includes("best")) {
            return "recommendation";
        }
        else {
            return "general";
        }
    };
    const extractContext = (content) => {
        const context = {};
        const lowerContent = content.toLowerCase();
        // Extract age
        const ageMatch = lowerContent.match(/(\d+)\s*(?:years?\s*old|y\.?o\.?)/);
        if (ageMatch) {
            context.childAge = parseInt(ageMatch[1]);
        }
        // Extract sport
        const sports = ["soccer", "basketball", "baseball", "football", "volleyball", "tennis", "swimming"];
        for (const sport of sports) {
            if (lowerContent.includes(sport)) {
                context.sport = sport;
                break;
            }
        }
        // Extract skill level
        if (lowerContent.includes("beginner"))
            context.skillLevel = "beginner";
        else if (lowerContent.includes("intermediate"))
            context.skillLevel = "intermediate";
        else if (lowerContent.includes("advanced"))
            context.skillLevel = "advanced";
        return context;
    };
    const quickActions = [
        {
            title: "Registration",
            icon: Users,
            questions: [
                "How do I register my child for soccer?",
                "What are the registration deadlines?",
                "How much does it cost to register?"
            ]
        },
        {
            title: "Policies",
            icon: BookOpen,
            questions: [
                "What is the refund policy?",
                "What are the age requirements?",
                "Do you offer sibling discounts?"
            ]
        },
        {
            title: "Facilities",
            icon: MapPin,
            questions: [
                "Where are the soccer fields located?",
                "What facilities are available?",
                "What are the facility hours?"
            ]
        },
        {
            title: "Recommendations",
            icon: Star,
            questions: [
                "What league is best for my 8-year-old?",
                "Can you recommend a sport for beginners?",
                "What programs are available for teenagers?"
            ]
        }
    ];
    const handleQuickAction = (question) => {
        setInputValue(question);
        handleSendMessage(question);
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6", children: [_jsx("div", { className: "bg-white rounded-lg shadow-sm border p-6 mb-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-900", children: [municipalityName, " Parks & Recreation Assistant"] }), _jsx("p", { className: "text-gray-600 mt-1", children: "Get answers about leagues, registration, policies, and facilities" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("button", { onClick: () => setShowQuickActions(!showQuickActions), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: [showQuickActions ? _jsx(ChevronUp, { className: "w-4 h-4" }) : _jsx(ChevronDown, { className: "w-4 h-4" }), "Quick Actions"] }), _jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200", children: [_jsx(Settings, { className: "w-4 h-4" }), "Settings"] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-white rounded-lg shadow-sm border h-[600px] flex flex-col", children: [_jsx("div", { className: "p-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center", children: _jsx(MessageCircle, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: "Chat Assistant" }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Ask me anything about ", municipalityName, " sports"] })] })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [_jsx(AnimatePresence, { children: messages.map((message) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: `flex ${message.type === "user" ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `max-w-[80%] p-3 rounded-lg ${message.type === "user"
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-gray-100 text-gray-900"}`, children: [_jsx("p", { className: "text-sm", children: message.content }), message.response && (_jsxs("div", { className: "mt-3 pt-3 border-t border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-500 mb-2", children: [_jsx(Info, { className: "w-3 h-3" }), "Confidence: ", Math.round(message.response.confidence * 100), "%"] }), message.response.relatedPolicies && message.response.relatedPolicies.length > 0 && (_jsxs("div", { className: "mb-2", children: [_jsx("p", { className: "text-xs font-medium text-gray-700 mb-1", children: "Related Policies:" }), _jsx("div", { className: "space-y-1", children: message.response.relatedPolicies.slice(0, 2).map((policy, index) => (_jsxs("div", { className: "text-xs bg-white p-2 rounded border", children: [_jsx("p", { className: "font-medium", children: policy.sport }), _jsxs("p", { className: "text-gray-600", children: ["Cost: $", policy.cost] })] }, index))) })] })), message.response.nextSteps && message.response.nextSteps.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-700 mb-1", children: "Next Steps:" }), _jsx("ul", { className: "text-xs space-y-1", children: message.response.nextSteps.map((step, index) => (_jsxs("li", { className: "flex items-center gap-1", children: [_jsx(CheckCircle, { className: "w-3 h-3 text-green-500" }), step] }, index))) })] }))] }))] }) }, message.id))) }), isLoading && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "flex justify-start", children: _jsx("div", { className: "bg-gray-100 text-gray-900 p-3 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: "0.1s" } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: "0.2s" } })] }) }) })), _jsx("div", { ref: chatEndRef })] }), _jsx("div", { className: "p-4 border-t border-gray-200", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { ref: inputRef, type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyPress: (e) => e.key === "Enter" && handleSendMessage(inputValue), placeholder: "Ask about registration, policies, facilities...", className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), _jsx("button", { onClick: () => handleSendMessage(inputValue), disabled: !inputValue.trim() || isLoading, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: _jsx(Send, { className: "w-4 h-4" }) })] }) })] }) }), _jsxs("div", { className: "space-y-6", children: [showQuickActions && (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border p-4", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-4", children: "Quick Actions" }), _jsx("div", { className: "space-y-3", children: quickActions.map((category) => (_jsxs("div", { children: [_jsxs("button", { onClick: () => setSelectedCategory(selectedCategory === category.title ? "" : category.title), className: "flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(category.icon, { className: "w-4 h-4 text-blue-600" }), _jsx("span", { className: "text-sm font-medium", children: category.title })] }), selectedCategory === category.title ? (_jsx(ChevronUp, { className: "w-4 h-4" })) : (_jsx(ChevronDown, { className: "w-4 h-4" }))] }), selectedCategory === category.title && (_jsx("div", { className: "mt-2 ml-6 space-y-2", children: category.questions.map((question, index) => (_jsx("button", { onClick: () => handleQuickAction(question), className: "block w-full text-left text-xs text-gray-600 hover:text-blue-600 p-1 rounded", children: question }, index))) }))] }, category.title))) })] })), _jsxs("div", { className: "bg-white rounded-lg shadow-sm border p-4", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-4", children: "Contact Information" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Phone, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "text-sm", children: "(919) 469-4000" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Mail, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "text-sm", children: "parks@cary.gov" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Globe, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "text-sm", children: "cary.gov/parks" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "text-sm", children: "Mon-Fri 8AM-5PM" })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-sm border p-4", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-4", children: "Search" }), _jsxs("div", { className: "space-y-3", children: [_jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search policies, facilities...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setShowFacilities(!showFacilities), className: `flex-1 px-3 py-2 text-xs rounded-lg ${showFacilities
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`, children: "Facilities" }), _jsx("button", { onClick: () => setShowPolicies(!showPolicies), className: `flex-1 px-3 py-2 text-xs rounded-lg ${showPolicies
                                                            ? "bg-blue-600 text-white"
                                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`, children: "Policies" })] })] })] })] })] })] }));
};
export default CivicAgentUI;
