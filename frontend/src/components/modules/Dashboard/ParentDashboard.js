import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SmartTile from "../../SmartTile";
import { useAgentOrchestration } from "../../../contexts/AgentOrchestrationContext";
import { Calendar, Users, CreditCard, BookOpen, Bell, Heart, Award } from "lucide-react";
const ParentDashboard = () => {
    const { sendRequest } = useAgentOrchestration();
    const [parentData, setParentData] = useState({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Simulate data fetching
        const fetchParentData = async () => {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setParentData({
                children: [
                    {
                        id: "1",
                        name: "Alex Johnson",
                        age: 12,
                        team: "U12 Thunder",
                        role: "Forward",
                        nextEvent: {
                            title: "Team Practice",
                            date: "Tomorrow, 4:00 PM",
                            location: "Main Field"
                        }
                    },
                    {
                        id: "2",
                        name: "Sarah Johnson",
                        age: 10,
                        team: "U10 Lightning",
                        role: "Midfielder",
                        nextEvent: {
                            title: "Game vs Eagles",
                            date: "Saturday, 2:00 PM",
                            location: "Community Stadium"
                        }
                    }
                ],
                upcomingEvents: [
                    {
                        id: "1",
                        title: "Team Practice",
                        date: "Tomorrow, 4:00 PM",
                        location: "Main Field",
                        childName: "Alex Johnson",
                        type: "practice"
                    },
                    {
                        id: "2",
                        title: "Game vs Eagles",
                        date: "Saturday, 2:00 PM",
                        location: "Community Stadium",
                        childName: "Sarah Johnson",
                        type: "game"
                    },
                    {
                        id: "3",
                        title: "Parent Meeting",
                        date: "Next Tuesday, 7:00 PM",
                        location: "Club House",
                        childName: "Both",
                        type: "meeting"
                    }
                ],
                notifications: [
                    {
                        id: "1",
                        title: "Alex scored a goal!",
                        message: "Great performance in today's practice",
                        date: "2 hours ago",
                        type: "achievement",
                        read: false
                    },
                    {
                        id: "2",
                        title: "Payment reminder",
                        message: "Monthly fee due in 3 days",
                        date: "1 day ago",
                        type: "payment",
                        read: true
                    },
                    {
                        id: "3",
                        title: "Schedule update",
                        message: "Next game rescheduled to Saturday",
                        date: "2 days ago",
                        type: "update",
                        read: false
                    }
                ],
                payments: [
                    {
                        id: "1",
                        description: "Monthly fee - Alex",
                        amount: 85,
                        dueDate: "Tomorrow",
                        status: "pending"
                    },
                    {
                        id: "2",
                        description: "Tournament fee - Sarah",
                        amount: 120,
                        dueDate: "Next week",
                        status: "pending"
                    },
                    {
                        id: "3",
                        description: "Equipment fee - Alex",
                        amount: 45,
                        dueDate: "Last week",
                        status: "paid"
                    }
                ],
                aiRecommendations: [
                    {
                        id: "1",
                        title: "Nutrition for young athletes",
                        description: "Optimize your child's performance with proper nutrition",
                        category: "nutrition"
                    },
                    {
                        id: "2",
                        title: "New cleats needed",
                        description: "Alex's current cleats are showing wear",
                        category: "equipment"
                    },
                    {
                        id: "3",
                        title: "Skill development tips",
                        description: "Practice drills to improve passing accuracy",
                        category: "development"
                    }
                ],
                familyStats: {
                    totalChildren: 2,
                    activePrograms: 3,
                    totalSpent: 450,
                    upcomingPayments: 205
                }
            });
            setLoading(false);
        };
        fetchParentData();
    }, []);
    const handleAIAssistance = (context) => {
        sendRequest({
            type: "parent_assistance",
            context,
            data: parentData
        });
    };
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };
    return (_jsxs(motion.div, { variants: containerVariants, initial: "hidden", animate: "visible", className: "space-y-6", children: [_jsxs(motion.div, { variants: itemVariants, className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Family Dashboard" }), _jsx("p", { className: "text-gray-600", children: "Supporting your young athletes' journey" })] }), _jsxs(motion.div, { variants: itemVariants, className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Users, { className: "w-8 h-8 text-blue-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Children" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: parentData.familyStats?.totalChildren || 0 })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(BookOpen, { className: "w-8 h-8 text-green-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Active Programs" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: parentData.familyStats?.activePrograms || 0 })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CreditCard, { className: "w-8 h-8 text-purple-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Spent" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["$", parentData.familyStats?.totalSpent || 0] })] })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg border border-gray-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Bell, { className: "w-8 h-8 text-yellow-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Upcoming" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: ["$", parentData.familyStats?.upcomingPayments || 0] })] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "My Children", icon: _jsx(Heart, { className: "w-5 h-5" }), status: "success", onClickAI: () => handleAIAssistance("children_overview"), loading: loading, children: _jsx("div", { className: "space-y-3", children: parentData.children?.map((child) => (_jsxs("div", { className: "p-3 bg-blue-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h4", { className: "font-medium text-blue-900", children: child.name }), _jsxs("span", { className: "text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded", children: ["Age ", child.age] })] }), _jsxs("div", { className: "text-sm text-blue-700 space-y-1", children: [_jsxs("p", { children: [_jsx("strong", { children: "Team:" }), " ", child.team] }), _jsxs("p", { children: [_jsx("strong", { children: "Position:" }), " ", child.role] }), child.nextEvent && (_jsxs("div", { className: "mt-2 p-2 bg-white rounded border", children: [_jsx("p", { className: "text-xs font-medium text-gray-700", children: "Next Event" }), _jsx("p", { className: "text-xs text-gray-600", children: child.nextEvent.title }), _jsx("p", { className: "text-xs text-gray-500", children: child.nextEvent.date })] }))] })] }, child.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Upcoming Events", icon: _jsx(Calendar, { className: "w-5 h-5" }), status: "info", onClickAI: () => handleAIAssistance("upcoming_events"), loading: loading, children: _jsx("div", { className: "space-y-2", children: parentData.upcomingEvents?.slice(0, 3).map((event) => (_jsxs("div", { className: "p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h4", { className: "font-medium text-gray-900 text-sm", children: event.title }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${event.type === "game" ? "bg-red-100 text-red-700" :
                                                        event.type === "practice" ? "bg-blue-100 text-blue-700" :
                                                            event.type === "tournament" ? "bg-purple-100 text-purple-700" :
                                                                "bg-gray-100 text-gray-700"}`, children: event.type })] }), _jsx("p", { className: "text-xs text-gray-600", children: event.date }), _jsx("p", { className: "text-xs text-gray-500", children: event.location }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["For: ", event.childName] })] }, event.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Notifications", icon: _jsx(Bell, { className: "w-5 h-5" }), status: parentData.notifications?.some(n => !n.read) ? "warning" : "neutral", onClickAI: () => handleAIAssistance("notifications"), loading: loading, children: _jsx("div", { className: "space-y-2", children: parentData.notifications?.slice(0, 3).map((notification) => (_jsxs("div", { className: `p-3 rounded-lg ${notification.read ? "bg-gray-50" : "bg-yellow-50 border border-yellow-200"}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h4", { className: "font-medium text-gray-900 text-sm", children: notification.title }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${notification.type === "achievement" ? "bg-green-100 text-green-700" :
                                                        notification.type === "payment" ? "bg-blue-100 text-blue-700" :
                                                            notification.type === "update" ? "bg-purple-100 text-purple-700" :
                                                                "bg-gray-100 text-gray-700"}`, children: notification.type })] }), _jsx("p", { className: "text-xs text-gray-600", children: notification.message }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: notification.date })] }, notification.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, children: _jsx(SmartTile, { title: "Payments", icon: _jsx(CreditCard, { className: "w-5 h-5" }), status: parentData.payments?.some(p => p.status === "overdue") ? "error" : "neutral", onClickAI: () => handleAIAssistance("payments"), loading: loading, children: _jsx("div", { className: "space-y-2", children: parentData.payments?.map((payment) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-50 rounded", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm text-gray-700", children: payment.description }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Due: ", payment.dueDate] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900", children: ["$", payment.amount] }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${payment.status === "paid" ? "bg-green-100 text-green-700" :
                                                        payment.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                                            "bg-red-100 text-red-700"}`, children: payment.status })] })] }, payment.id))) }) }) }), _jsx(motion.div, { variants: itemVariants, className: "lg:col-span-2", children: _jsx(SmartTile, { title: "AI Recommendations", icon: _jsx(Award, { className: "w-5 h-5" }), status: "success", onClickAI: () => handleAIAssistance("recommendations"), loading: loading, children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: parentData.aiRecommendations?.map((recommendation) => (_jsxs("div", { className: "p-3 bg-green-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h4", { className: "font-medium text-green-900 text-sm", children: recommendation.title }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${recommendation.category === "nutrition" ? "bg-green-200 text-green-800" :
                                                        recommendation.category === "equipment" ? "bg-blue-200 text-blue-800" :
                                                            recommendation.category === "support" ? "bg-purple-200 text-purple-800" :
                                                                "bg-yellow-200 text-yellow-800"}`, children: recommendation.category })] }), _jsx("p", { className: "text-xs text-green-700", children: recommendation.description })] }, recommendation.id))) }) }) })] })] }));
};
export default ParentDashboard;
