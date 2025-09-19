import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AdminAuthContext";
import { Users, Clock, AlertTriangle, BarChart3, Settings, Search, Download, RefreshCw, Plus, Edit, Eye, UserCheck, Shield } from "lucide-react";
const RecAdminHub = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("waitlists");
    const [waitlistData, setWaitlistData] = useState([]);
    const [siblingData, setSiblingData] = useState([]);
    const [overrideData, setOverrideData] = useState([]);
    const [approvalData, setApprovalData] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    // Mock data for development
    useEffect(() => {
        const loadMockData = async () => {
            setLoading(true);
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Mock waitlist data
            setWaitlistData([
                {
                    id: "1",
                    childName: "Emma Johnson",
                    parentName: "Sarah Johnson",
                    parentEmail: "sarah.johnson@email.com",
                    parentPhone: "(919) 555-0123",
                    league: "Youth Soccer",
                    ageGroup: "U10",
                    registrationDate: new Date("2024-01-15"),
                    waitlistPosition: 1,
                    priority: "high",
                    status: "waiting",
                    notes: "Previous participant, excellent attendance"
                },
                {
                    id: "2",
                    childName: "Michael Chen",
                    parentName: "David Chen",
                    parentEmail: "david.chen@email.com",
                    parentPhone: "(919) 555-0456",
                    league: "Youth Basketball",
                    ageGroup: "U12",
                    registrationDate: new Date("2024-01-20"),
                    waitlistPosition: 3,
                    priority: "medium",
                    status: "waiting"
                }
            ]);
            // Mock sibling pairing data
            setSiblingData([
                {
                    id: "1",
                    familyId: "fam_001",
                    parentName: "Jennifer Smith",
                    parentEmail: "jennifer.smith@email.com",
                    children: [
                        { name: "Alex Smith", age: 10, league: "Youth Soccer" },
                        { name: "Jordan Smith", age: 8, league: "Youth Soccer" }
                    ],
                    status: "paired",
                    requestedLeague: "Youth Soccer",
                    notes: "Both children assigned to same team"
                }
            ]);
            // Mock age override data
            setOverrideData([
                {
                    id: "1",
                    childName: "Riley Thompson",
                    parentName: "Mark Thompson",
                    parentEmail: "mark.thompson@email.com",
                    currentAge: 9,
                    requestedLeague: "Youth Soccer U10",
                    ageRequirement: 10,
                    reason: "Child is advanced for age, previous experience in older leagues",
                    requestedBy: "mark.thompson@email.com",
                    status: "pending",
                    createdAt: new Date("2024-01-25"),
                    updatedAt: new Date("2024-01-25")
                }
            ]);
            // Mock approval data
            setApprovalData([
                {
                    id: "1",
                    type: "age_override",
                    title: "Age Override Request - Riley Thompson",
                    description: "Request to allow 9-year-old in U10 soccer league",
                    requester: "Mark Thompson",
                    requesterEmail: "mark.thompson@email.com",
                    status: "pending",
                    createdAt: new Date("2024-01-25"),
                    priority: "medium"
                }
            ]);
            // Mock analytics data
            setAnalytics({
                totalRegistrations: 245,
                waitlistCount: 18,
                pendingApprovals: 3,
                siblingPairings: 12,
                ageOverrides: 5,
                leagueCapacity: {
                    "Youth Soccer U8": 85,
                    "Youth Soccer U10": 92,
                    "Youth Soccer U12": 78,
                    "Youth Basketball U10": 88,
                    "Youth Basketball U12": 76
                },
                recentActivity: [
                    {
                        id: "1",
                        type: "waitlist_promotion",
                        description: "Emma Johnson promoted from waitlist to Youth Soccer U10",
                        timestamp: new Date("2024-01-26T10:30:00"),
                        user: "sarah.johnson@email.com"
                    },
                    {
                        id: "2",
                        type: "age_override_approved",
                        description: "Age override approved for Riley Thompson",
                        timestamp: new Date("2024-01-26T09:15:00"),
                        user: "rec.director@cary.gov"
                    }
                ]
            });
            setLoading(false);
        };
        loadMockData();
    }, []);
    const tabs = [
        { id: "waitlists", label: "Waitlists", icon: Clock, count: waitlistData.length },
        { id: "siblings", label: "Sibling Pairing", icon: Users, count: siblingData.length },
        { id: "overrides", label: "Age Overrides", icon: AlertTriangle, count: overrideData.length },
        { id: "approvals", label: "Director Approvals", icon: Shield, count: approvalData.filter(a => a.status === "pending").length },
        { id: "analytics", label: "Analytics", icon: BarChart3, count: null }
    ];
    const handlePromoteFromWaitlist = (entryId) => {
        // TODO: Implement waitlist promotion logic
        // Log waitlist promotion for audit trail
    };
    const handleApproveOverride = (overrideId) => {
        // TODO: Implement age override approval logic
        // Log age override approval for audit trail
    };
    const handleExportData = (type) => {
        // TODO: Implement CSV export logic
        // Log data export for audit trail
    };
    const filteredWaitlistData = waitlistData.filter(entry => entry.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.league.toLowerCase().includes(searchTerm.toLowerCase()));
    // Check if user has Town Staff role
    if (!user || user.role !== "TownStaff") {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx(Shield, { className: "w-16 h-16 text-red-500 mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Access Denied" }), _jsx("p", { className: "text-gray-600", children: "You need Town Staff permissions to access this page." })] }) }));
    }
    if (loading) {
        return (_jsxs("div", { className: "flex items-center justify-center h-64", children: [_jsx(RefreshCw, { className: "w-8 h-8 text-blue-600 animate-spin" }), _jsx("span", { className: "ml-2 text-gray-600", children: "Loading Town Rec Admin Hub..." })] }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Town Rec Admin Hub" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Manage Cary Parks & Recreation sports programs" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: [_jsx(Plus, { className: "w-4 h-4" }), "New Registration"] }), _jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200", children: [_jsx(Settings, { className: "w-4 h-4" }), "Settings"] })] })] }) }), _jsx("div", { className: "border-b border-gray-200 mb-6", children: _jsx("nav", { className: "flex space-x-8", children: tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`, children: [_jsx(Icon, { className: "w-4 h-4" }), tab.label, tab.count !== null && (_jsx("span", { className: "bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs", children: tab.count }))] }, tab.id));
                    }) }) }), _jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" }), _jsx("input", { type: "text", placeholder: "Search by name, email, or league...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "waiting", children: "Waiting" }), _jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "approved", children: "Approved" }), _jsx("option", { value: "denied", children: "Denied" })] })] }), _jsxs("button", { onClick: () => handleExportData(activeTab), className: "flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700", children: [_jsx(Download, { className: "w-4 h-4" }), "Export ", activeTab.charAt(0).toUpperCase() + activeTab.slice(1)] })] }), _jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.2 }, children: [activeTab === "waitlists" && (_jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Waitlist Management" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Manage registration waitlists and promote participants" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Participant" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "League" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Position" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredWaitlistData.map((entry) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: entry.childName }), _jsx("div", { className: "text-sm text-gray-500", children: entry.parentName }), _jsx("div", { className: "text-sm text-gray-400", children: entry.parentEmail })] }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("div", { className: "text-sm text-gray-900", children: entry.league }), _jsx("div", { className: "text-sm text-gray-500", children: entry.ageGroup })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: ["#", entry.waitlistPosition] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.status === "waiting" ? "bg-yellow-100 text-yellow-800" :
                                                                    entry.status === "promoted" ? "bg-green-100 text-green-800" :
                                                                        "bg-red-100 text-red-800"}`, children: entry.status.charAt(0).toUpperCase() + entry.status.slice(1) }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => handlePromoteFromWaitlist(entry.id), className: "text-blue-600 hover:text-blue-900", children: _jsx(UserCheck, { className: "w-4 h-4" }) }), _jsx("button", { className: "text-gray-600 hover:text-gray-900", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { className: "text-gray-600 hover:text-gray-900", children: _jsx(Edit, { className: "w-4 h-4" }) })] }) })] }, entry.id))) })] }) })] })), activeTab === "siblings" && (_jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Sibling Pairing Management" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Manage sibling pairing requests and team assignments" })] }), _jsx("div", { className: "p-6", children: siblingData.map((pairing) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4 mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: pairing.parentName }), _jsx("p", { className: "text-sm text-gray-500", children: pairing.parentEmail })] }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pairing.status === "paired" ? "bg-green-100 text-green-800" :
                                                            pairing.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                                                "bg-red-100 text-red-800"}`, children: pairing.status.replace("_", " ").charAt(0).toUpperCase() + pairing.status.slice(1) })] }), _jsx("div", { className: "space-y-2", children: pairing.children.map((child, index) => (_jsxs("div", { className: "flex items-center justify-between bg-gray-50 p-2 rounded", children: [_jsxs("span", { className: "text-sm font-medium", children: [child.name, " (Age ", child.age, ")"] }), _jsx("span", { className: "text-sm text-gray-600", children: child.league })] }, index))) }), pairing.notes && (_jsx("p", { className: "text-sm text-gray-600 mt-3", children: pairing.notes }))] }, pairing.id))) })] })), activeTab === "overrides" && (_jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Age Override Management" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Review and approve age bracket exceptions" })] }), _jsx("div", { className: "p-6", children: overrideData.map((override) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4 mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: override.childName }), _jsxs("p", { className: "text-sm text-gray-500", children: [override.parentName, " \u2022 ", override.parentEmail] })] }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${override.status === "approved" ? "bg-green-100 text-green-800" :
                                                            override.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                                                "bg-red-100 text-red-800"}`, children: override.status.charAt(0).toUpperCase() + override.status.slice(1) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-3", children: [_jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Current Age:" }), _jsx("span", { className: "ml-2 text-sm text-gray-900", children: override.currentAge })] }), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Requested League:" }), _jsx("span", { className: "ml-2 text-sm text-gray-900", children: override.requestedLeague })] })] }), _jsxs("div", { className: "mb-3", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Reason:" }), _jsx("p", { className: "text-sm text-gray-900 mt-1", children: override.reason })] }), override.status === "pending" && (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => handleApproveOverride(override.id), className: "px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700", children: "Approve" }), _jsx("button", { className: "px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700", children: "Deny" })] }))] }, override.id))) })] })), activeTab === "approvals" && (_jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Director Approvals" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Review pending approval requests" })] }), _jsx("div", { className: "p-6", children: approvalData.map((approval) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4 mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: approval.title }), _jsxs("p", { className: "text-sm text-gray-500", children: [approval.requester, " \u2022 ", approval.requesterEmail] })] }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${approval.status === "approved" ? "bg-green-100 text-green-800" :
                                                            approval.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                                                "bg-red-100 text-red-800"}`, children: approval.status.charAt(0).toUpperCase() + approval.status.slice(1) })] }), _jsx("p", { className: "text-sm text-gray-700 mb-3", children: approval.description }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-xs text-gray-500", children: ["Requested: ", approval.createdAt.toLocaleDateString()] }), approval.status === "pending" && (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700", children: "Approve" }), _jsx("button", { className: "px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700", children: "Deny" })] }))] })] }, approval.id))) })] })), activeTab === "analytics" && analytics && (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Registration Overview" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: analytics.totalRegistrations }), _jsx("div", { className: "text-sm text-gray-600", children: "Total Registrations" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-yellow-600", children: analytics.waitlistCount }), _jsx("div", { className: "text-sm text-gray-600", children: "Waitlist" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: analytics.pendingApprovals }), _jsx("div", { className: "text-sm text-gray-600", children: "Pending Approvals" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: analytics.siblingPairings }), _jsx("div", { className: "text-sm text-gray-600", children: "Sibling Pairings" })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "League Capacity" }), _jsx("div", { className: "space-y-3", children: Object.entries(analytics.leagueCapacity).map(([league, capacity]) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-700", children: league }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-24 bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: `${Math.min(100, (capacity / 100) * 100)}%` } }) }), _jsxs("span", { className: "text-sm font-medium text-gray-900", children: [capacity, "%"] })] })] }, league))) })] }), _jsxs("div", { className: "lg:col-span-2 bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Recent Activity" }), _jsx("div", { className: "space-y-3", children: analytics.recentActivity.map((activity) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: activity.description }), _jsx("p", { className: "text-xs text-gray-500", children: activity.user })] }), _jsx("span", { className: "text-xs text-gray-500", children: activity.timestamp.toLocaleString() })] }, activity.id))) })] })] }))] }, activeTab) })] }));
};
export default RecAdminHub;
