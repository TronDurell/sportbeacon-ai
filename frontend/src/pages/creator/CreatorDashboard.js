import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, TrendingUp, Users, Star, Target, Download, Settings, CreditCard, Gift, Flame, Crown, CheckCircle, AlertCircle, Clock, Eye, Heart, MessageCircle, Badge, Star as StarIcon, Zap as ZapIcon } from "lucide-react";
const CreatorDashboard = () => {
    const [activeTab, setActiveTab] = useState("earnings");
    const [creatorStats, setCreatorStats] = useState(null);
    const [earningsData, setEarningsData] = useState([]);
    const [tipsData, setTipsData] = useState([]);
    const [payoutData, setPayoutData] = useState([]);
    const [stripeAccount, setStripeAccount] = useState(null);
    const [badgeLevel, setBadgeLevel] = useState(null);
    const [likeStreak, setLikeStreak] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("30d");
    // Mock data for development
    useEffect(() => {
        const loadMockData = async () => {
            setIsLoading(true);
            // Simulate API calls
            await new Promise(resolve => setTimeout(resolve, 1000));
            setCreatorStats({
                totalEarnings: 15420.50,
                monthlyEarnings: 3240.75,
                totalTips: 8920.25,
                totalFollowers: 15420,
                totalLikes: 89250,
                totalViews: 1250000,
                badgeLevel: 8,
                likeStreak: 45,
                completionRate: 94.5,
                averageRating: 4.8
            });
            setEarningsData([
                { date: "2024-01-01", amount: 120.50, source: "tips" },
                { date: "2024-01-02", amount: 85.25, source: "subscriptions" },
                { date: "2024-01-03", amount: 200.00, source: "sponsorships" },
                { date: "2024-01-04", amount: 45.75, source: "tips" },
                { date: "2024-01-05", amount: 150.00, source: "merchandise" },
                { date: "2024-01-06", amount: 95.30, source: "tips" },
                { date: "2024-01-07", amount: 180.45, source: "subscriptions" }
            ]);
            setTipsData([
                {
                    id: "1",
                    amount: 25.00,
                    message: "Amazing content! Keep it up!",
                    fromUser: "soccer_fan_123",
                    timestamp: new Date("2024-01-15T10:30:00"),
                    isAnonymous: false
                },
                {
                    id: "2",
                    amount: 50.00,
                    message: "Your drills helped my team so much!",
                    fromUser: "coach_mike",
                    timestamp: new Date("2024-01-14T15:45:00"),
                    isAnonymous: false
                },
                {
                    id: "3",
                    amount: 15.00,
                    message: "",
                    fromUser: "Anonymous",
                    timestamp: new Date("2024-01-13T09:20:00"),
                    isAnonymous: true
                },
                {
                    id: "4",
                    amount: 100.00,
                    message: "Best coach on the platform!",
                    fromUser: "parent_sarah",
                    timestamp: new Date("2024-01-12T18:15:00"),
                    isAnonymous: false
                }
            ]);
            setPayoutData([
                {
                    id: "payout-1",
                    amount: 2500.00,
                    status: "completed",
                    method: "stripe",
                    date: new Date("2024-01-10"),
                    reference: "STRIPE_PAYOUT_001"
                },
                {
                    id: "payout-2",
                    amount: 1800.50,
                    status: "processing",
                    method: "stripe",
                    date: new Date("2024-01-15"),
                    reference: "STRIPE_PAYOUT_002"
                },
                {
                    id: "payout-3",
                    amount: 3200.75,
                    status: "pending",
                    method: "stripe",
                    date: new Date("2024-01-20"),
                    reference: "STRIPE_PAYOUT_003"
                }
            ]);
            setStripeAccount({
                id: "acct_stripe123",
                isConnected: true,
                isVerified: true,
                balance: 15420.50,
                pendingBalance: 3240.75,
                currency: "USD",
                payoutSchedule: "weekly",
                minimumPayout: 50.00
            });
            setBadgeLevel({
                level: 8,
                name: "Elite Coach",
                description: "Consistently delivering exceptional coaching content",
                requirements: [
                    "Maintain 4.5+ rating for 3 months",
                    "Complete 100+ sessions",
                    "Earn $10,000+ in total",
                    "Have 10,000+ followers"
                ],
                benefits: [
                    "Priority support",
                    "Advanced analytics",
                    "Exclusive features",
                    "Higher payout rates"
                ],
                progress: 85,
                nextLevel: 9
            });
            setLikeStreak({
                currentStreak: 45,
                longestStreak: 67,
                startDate: new Date("2023-12-01"),
                lastActivity: new Date("2024-01-15"),
                milestones: [7, 30, 60, 90, 180, 365],
                rewards: [
                    "Badge boost",
                    "Featured placement",
                    "Bonus earnings",
                    "Exclusive content access"
                ]
            });
            setIsLoading(false);
        };
        loadMockData();
    }, []);
    const tabs = [
        { id: "earnings", label: "Earnings", icon: DollarSign },
        { id: "tips", label: "Tips", icon: Gift },
        { id: "payout-setup", label: "Payout Setup", icon: CreditCard }
    ];
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(amount);
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        }).format(date);
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "completed": return "text-green-600 bg-green-100";
            case "processing": return "text-blue-600 bg-blue-100";
            case "pending": return "text-yellow-600 bg-yellow-100";
            case "failed": return "text-red-600 bg-red-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };
    const getBadgeIcon = (level) => {
        if (level >= 10)
            return _jsx(Crown, { className: "w-6 h-6 text-yellow-500" });
        if (level >= 7)
            return _jsx(StarIcon, { className: "w-6 h-6 text-purple-500" });
        if (level >= 4)
            return _jsx(ZapIcon, { className: "w-6 h-6 text-blue-500" });
        return _jsx(Badge, { className: "w-6 h-6 text-gray-500" });
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Creator Dashboard" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Manage your earnings, tips, and payouts" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full", children: [getBadgeIcon(creatorStats?.badgeLevel || 0), _jsxs("span", { className: "text-sm font-medium", children: ["Level ", creatorStats?.badgeLevel, " Creator"] })] }), _jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full", children: [_jsx(Flame, { className: "w-4 h-4" }), _jsxs("span", { className: "text-sm font-medium", children: [likeStreak?.currentStreak, " Day Streak"] })] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Earnings" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: formatCurrency(creatorStats?.totalEarnings || 0) })] }), _jsx(DollarSign, { className: "w-8 h-8 text-green-500" })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-green-600", children: [_jsx(TrendingUp, { className: "w-4 h-4 mr-1" }), "+12.5% this month"] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Tips" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: formatCurrency(creatorStats?.totalTips || 0) })] }), _jsx(Gift, { className: "w-8 h-8 text-purple-500" })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-purple-600", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), creatorStats?.totalFollowers?.toLocaleString(), " followers"] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Likes" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: creatorStats?.totalLikes?.toLocaleString() })] }), _jsx(Heart, { className: "w-8 h-8 text-red-500" })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-red-600", children: [_jsx(Eye, { className: "w-4 h-4 mr-1" }), creatorStats?.totalViews?.toLocaleString(), " views"] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Rating" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [creatorStats?.averageRating, "/5.0"] })] }), _jsx(Star, { className: "w-8 h-8 text-yellow-500" })] }), _jsxs("div", { className: "mt-4 flex items-center text-sm text-yellow-600", children: [_jsx(Target, { className: "w-4 h-4 mr-1" }), creatorStats?.completionRate, "% completion"] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow mb-8", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "flex space-x-8 px-6", children: tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`, children: [_jsx(Icon, { className: "w-4 h-4" }), tab.label] }, tab.id));
                            }) }) }), _jsx("div", { className: "p-6", children: _jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.2 }, children: [activeTab === "earnings" && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Earnings Overview" }), _jsx("div", { className: "flex items-center gap-2", children: ["7d", "30d", "90d", "1y"].map((range) => (_jsx("button", { onClick: () => setTimeRange(range), className: `px-3 py-1 rounded-lg text-sm font-medium ${timeRange === range
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`, children: range }, range))) })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Earnings Trend" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-blue-500 rounded" }), _jsx("span", { className: "text-sm text-gray-600", children: "Tips" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-green-500 rounded" }), _jsx("span", { className: "text-sm text-gray-600", children: "Subscriptions" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-purple-500 rounded" }), _jsx("span", { className: "text-sm text-gray-600", children: "Sponsorships" })] })] })] }), _jsx("div", { className: "h-64 flex items-end justify-between gap-2", children: earningsData.map((data, index) => (_jsxs("div", { className: "flex-1 flex flex-col items-center", children: [_jsx("div", { className: "w-full bg-blue-500 rounded-t", style: { height: `${(data.amount / 200) * 100}%` } }), _jsx("span", { className: "text-xs text-gray-500 mt-2", children: data.date })] }, index))) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg border p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Earnings by Source" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Tips" }), _jsx("span", { className: "font-medium", children: formatCurrency(creatorStats?.totalTips || 0) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Subscriptions" }), _jsx("span", { className: "font-medium", children: formatCurrency(5000) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Sponsorships" }), _jsx("span", { className: "font-medium", children: formatCurrency(3000) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Merchandise" }), _jsx("span", { className: "font-medium", children: formatCurrency(2500) })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg border p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Recent Payouts" }), _jsx("div", { className: "space-y-3", children: payoutData.slice(0, 3).map((payout) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: formatCurrency(payout.amount) }), _jsx("p", { className: "text-xs text-gray-500", children: formatDate(payout.date) })] }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`, children: payout.status })] }, payout.id))) })] })] })] })), activeTab === "tips" && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Recent Tips" }), _jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: [_jsx(Download, { className: "w-4 h-4" }), "Export"] })] }), _jsx("div", { className: "space-y-4", children: tipsData.map((tip) => (_jsx(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, className: "bg-white rounded-lg border p-6 hover:shadow-md transition-shadow", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: formatCurrency(tip.amount) }), _jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-500", children: [_jsx(Clock, { className: "w-4 h-4" }), formatDate(tip.timestamp)] })] }), _jsx("p", { className: "text-sm font-medium text-gray-900 mb-1", children: tip.isAnonymous ? "Anonymous" : tip.fromUser }), tip.message && (_jsxs("p", { className: "text-sm text-gray-600 italic", children: ["\"", tip.message, "\""] }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "p-2 text-gray-400 hover:text-gray-600", children: _jsx(Heart, { className: "w-4 h-4" }) }), _jsx("button", { className: "p-2 text-gray-400 hover:text-gray-600", children: _jsx(MessageCircle, { className: "w-4 h-4" }) })] })] }) }, tip.id))) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg border p-6 text-center", children: [_jsx(Gift, { className: "w-8 h-8 text-purple-500 mx-auto mb-2" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: formatCurrency(creatorStats?.totalTips || 0) }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Tips Received" })] }), _jsxs("div", { className: "bg-white rounded-lg border p-6 text-center", children: [_jsx(Users, { className: "w-8 h-8 text-blue-500 mx-auto mb-2" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: tipsData.length }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Tippers" })] }), _jsxs("div", { className: "bg-white rounded-lg border p-6 text-center", children: [_jsx(TrendingUp, { className: "w-8 h-8 text-green-500 mx-auto mb-2" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: formatCurrency((creatorStats?.totalTips || 0) / tipsData.length) }), _jsx("p", { className: "text-sm text-gray-600", children: "Average Tip" })] })] })] })), activeTab === "payout-setup" && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Payout Setup" }), _jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: [_jsx(Settings, { className: "w-4 h-4" }), "Settings"] })] }), _jsxs("div", { className: "bg-white rounded-lg border p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Stripe Account" }), _jsx("div", { className: "flex items-center gap-2", children: stripeAccount?.isConnected ? (_jsxs("div", { className: "flex items-center gap-2 text-green-600", children: [_jsx(CheckCircle, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm font-medium", children: "Connected" })] })) : (_jsxs("div", { className: "flex items-center gap-2 text-red-600", children: [_jsx(AlertCircle, { className: "w-5 h-5" }), _jsx("span", { className: "text-sm font-medium", children: "Not Connected" })] })) })] }), stripeAccount?.isConnected ? (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Account Balance" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Available Balance" }), _jsx("span", { className: "font-medium", children: formatCurrency(stripeAccount.balance) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Pending Balance" }), _jsx("span", { className: "font-medium", children: formatCurrency(stripeAccount.pendingBalance) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Currency" }), _jsx("span", { className: "font-medium", children: stripeAccount.currency })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 mb-3", children: "Payout Settings" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Schedule" }), _jsx("span", { className: "font-medium capitalize", children: stripeAccount.payoutSchedule })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Minimum Payout" }), _jsx("span", { className: "font-medium", children: formatCurrency(stripeAccount.minimumPayout) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Verification" }), _jsx("span", { className: "font-medium", children: stripeAccount.isVerified ? "Verified" : "Pending" })] })] })] })] })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx(CreditCard, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h4", { className: "text-lg font-medium text-gray-900 mb-2", children: "Connect Your Stripe Account" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Connect your Stripe account to start receiving payouts" }), _jsx("button", { className: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Connect Stripe" })] }))] }), _jsxs("div", { className: "bg-white rounded-lg border p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Payout History" }), _jsx("div", { className: "space-y-3", children: payoutData.map((payout) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: formatCurrency(payout.amount) }), _jsx("p", { className: "text-sm text-gray-500", children: formatDate(payout.date) })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`, children: payout.status }), _jsx("span", { className: "text-xs text-gray-500", children: payout.reference })] })] }, payout.id))) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg border p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Badge Level" }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex items-center justify-center mb-3", children: getBadgeIcon(badgeLevel?.level || 0) }), _jsx("h4", { className: "text-xl font-bold text-gray-900 mb-1", children: badgeLevel?.name }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: badgeLevel?.description }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2 mb-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: `${badgeLevel?.progress}%` } }) }), _jsxs("p", { className: "text-xs text-gray-500", children: [badgeLevel?.progress, "% to Level ", badgeLevel?.nextLevel] })] })] }), _jsxs("div", { className: "bg-white rounded-lg border p-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Like Streak" }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "flex items-center justify-center mb-3", children: _jsx(Flame, { className: "w-8 h-8 text-orange-500" }) }), _jsxs("h4", { className: "text-2xl font-bold text-gray-900 mb-1", children: [likeStreak?.currentStreak, " Days"] }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Current Streak" }), _jsxs("div", { className: "text-left space-y-2", children: [_jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("span", { className: "font-medium", children: "Longest Streak:" }), " ", likeStreak?.longestStreak, " days"] }), _jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("span", { className: "font-medium", children: "Started:" }), " ", likeStreak?.startDate.toLocaleDateString()] })] })] })] })] })] }))] }, activeTab) }) })] })] }));
};
export default CreatorDashboard;
