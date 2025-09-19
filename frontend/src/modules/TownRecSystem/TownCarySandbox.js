import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Settings, Users, Calendar, Star, Clock, Eye, XCircle } from "lucide-react";
const TownCarySandbox = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [currentScenario, setCurrentScenario] = useState(null);
    const [sandboxUsers, setSandboxUsers] = useState([]);
    const [sandboxLeagues, setSandboxLeagues] = useState([]);
    const [scenarios, setScenarios] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedLeague, setSelectedLeague] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);
    // Mock data for development
    useEffect(() => {
        const loadSandboxData = async () => {
            setLoading(true);
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Mock sandbox users
            const mockUsers = [
                {
                    id: "user_001",
                    name: "Sarah Johnson",
                    email: "sarah.johnson@cary.gov",
                    role: "RecDirector",
                    department: "ParksAndRec",
                    isActive: true,
                    lastLogin: new Date("2024-01-26T10:30:00"),
                    permissions: ["waitlist_manage", "overrides_approve", "analytics_view", "users_manage"],
                    testData: { registrations: 45, waitlistEntries: 12, overrides: 8, approvals: 15 }
                },
                {
                    id: "user_002",
                    name: "Michael Chen",
                    email: "michael.chen@cary.gov",
                    role: "RecCoordinator",
                    department: "ParksAndRec",
                    isActive: true,
                    lastLogin: new Date("2024-01-26T09:15:00"),
                    permissions: ["waitlist_manage", "registration_view", "analytics_view"],
                    testData: { registrations: 32, waitlistEntries: 8, overrides: 3, approvals: 0 }
                },
                {
                    id: "user_003",
                    name: "Jennifer Smith",
                    email: "jennifer.smith@test.com",
                    role: "TestParent",
                    isActive: true,
                    lastLogin: new Date("2024-01-26T08:45:00"),
                    permissions: ["registration_view"],
                    testData: { registrations: 2, waitlistEntries: 1, overrides: 1, approvals: 0 }
                },
                {
                    id: "user_004",
                    name: "David Wilson",
                    email: "david.wilson@test.com",
                    role: "TestParent",
                    isActive: true,
                    lastLogin: new Date("2024-01-25T16:20:00"),
                    permissions: ["registration_view"],
                    testData: { registrations: 3, waitlistEntries: 0, overrides: 0, approvals: 0 }
                }
            ];
            // Mock sandbox leagues
            const mockLeagues = [
                {
                    id: "league_001",
                    name: "Youth Soccer U8",
                    ageGroup: "U8",
                    sport: "Soccer",
                    maxCapacity: 24,
                    currentRegistrations: 22,
                    waitlistCount: 8,
                    startDate: new Date("2024-03-01"),
                    endDate: new Date("2024-05-31"),
                    location: "Cary Community Center",
                    coach: "Coach Martinez",
                    status: "active",
                    testData: { participants: 22, siblings: 6, ageOverrides: 2 }
                },
                {
                    id: "league_002",
                    name: "Youth Soccer U10",
                    ageGroup: "U10",
                    sport: "Soccer",
                    maxCapacity: 32,
                    currentRegistrations: 32,
                    waitlistCount: 15,
                    startDate: new Date("2024-03-01"),
                    endDate: new Date("2024-05-31"),
                    location: "Cary Community Center",
                    coach: "Coach Rodriguez",
                    status: "full",
                    testData: { participants: 32, siblings: 8, ageOverrides: 5 }
                },
                {
                    id: "league_003",
                    name: "Youth Basketball U10",
                    ageGroup: "U10",
                    sport: "Basketball",
                    maxCapacity: 20,
                    currentRegistrations: 18,
                    waitlistCount: 3,
                    startDate: new Date("2024-02-15"),
                    endDate: new Date("2024-04-30"),
                    location: "Cary Gymnasium",
                    coach: "Coach Thompson",
                    status: "active",
                    testData: { participants: 18, siblings: 4, ageOverrides: 1 }
                },
                {
                    id: "league_004",
                    name: "Youth Basketball U12",
                    ageGroup: "U12",
                    sport: "Basketball",
                    maxCapacity: 24,
                    currentRegistrations: 20,
                    waitlistCount: 6,
                    startDate: new Date("2024-02-15"),
                    endDate: new Date("2024-04-30"),
                    location: "Cary Gymnasium",
                    coach: "Coach Williams",
                    status: "active",
                    testData: { participants: 20, siblings: 5, ageOverrides: 3 }
                }
            ];
            // Mock scenarios
            const mockScenarios = [
                {
                    id: "scenario_001",
                    name: "Waitlist Promotion",
                    description: "Promote a child from waitlist to active registration when a spot opens",
                    category: "waitlist",
                    complexity: "basic",
                    steps: [
                        "Navigate to Waitlists tab",
                        "Find a child in waitlist position #1",
                        "Click \"Promote\" button",
                        "Confirm promotion",
                        "Verify child appears in registrations"
                    ],
                    expectedOutcome: "Child successfully promoted from waitlist to active registration",
                    isActive: true,
                    completionRate: 95,
                    averageTime: 2
                },
                {
                    id: "scenario_002",
                    name: "Age Override Approval",
                    description: "Review and approve an age override request for a child",
                    category: "overrides",
                    complexity: "intermediate",
                    steps: [
                        "Navigate to Age Overrides tab",
                        "Find a pending override request",
                        "Review child details and reason",
                        "Click \"Approve\" or \"Deny\"",
                        "Add director notes if needed",
                        "Submit decision"
                    ],
                    expectedOutcome: "Override request processed and parent notified",
                    isActive: true,
                    completionRate: 88,
                    averageTime: 4
                },
                {
                    id: "scenario_003",
                    name: "Sibling Pairing Conflict",
                    description: "Resolve a sibling pairing conflict manually",
                    category: "siblings",
                    complexity: "advanced",
                    steps: [
                        "Navigate to Sibling Pairing tab",
                        "Find a pairing with conflicts",
                        "Review conflict details",
                        "Choose resolution action",
                        "Assign team if needed",
                        "Confirm resolution"
                    ],
                    expectedOutcome: "Sibling pairing conflict resolved and children assigned",
                    isActive: true,
                    completionRate: 75,
                    averageTime: 6
                },
                {
                    id: "scenario_004",
                    name: "Registration Analytics",
                    description: "Generate and export registration analytics report",
                    category: "registration",
                    complexity: "basic",
                    steps: [
                        "Navigate to Analytics tab",
                        "Review registration overview",
                        "Check league capacity charts",
                        "Export data to CSV",
                        "Review exported file"
                    ],
                    expectedOutcome: "Analytics report generated and exported successfully",
                    isActive: true,
                    completionRate: 92,
                    averageTime: 3
                }
            ];
            // Mock metrics
            const mockMetrics = {
                totalUsers: mockUsers.length,
                activeUsers: mockUsers.filter(u => u.isActive).length,
                totalRegistrations: mockLeagues.reduce((sum, l) => sum + l.currentRegistrations, 0),
                waitlistEntries: mockLeagues.reduce((sum, l) => sum + l.waitlistCount, 0),
                pendingOverrides: 5,
                pendingApprovals: 3,
                scenarioCompletions: 156,
                averageSessionTime: 12.5,
                errorRate: 2.3,
                userSatisfaction: 4.7
            };
            setSandboxUsers(mockUsers);
            setSandboxLeagues(mockLeagues);
            setScenarios(mockScenarios);
            setMetrics(mockMetrics);
            setLoading(false);
        };
        loadSandboxData();
    }, []);
    const startSandbox = () => {
        setIsRunning(true);
        setCurrentScenario(null);
        // Initialize Town Cary Sandbox environment
    };
    const stopSandbox = () => {
        setIsRunning(false);
        setCurrentScenario(null);
        // Stop Town Cary Sandbox environment
    };
    const resetSandbox = () => {
        setIsRunning(false);
        setCurrentScenario(null);
        // Reset Town Cary Sandbox environment
    };
    const startScenario = (scenario) => {
        setCurrentScenario(scenario);
        // Execute scenario: ${scenario.name}
    };
    const completeScenario = () => {
        if (currentScenario) {
            // Scenario completed: ${currentScenario.name}
        }
        setCurrentScenario(null);
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading Town Cary Sandbox..." })] }) }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Town Cary Sandbox" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Isolated test environment for Cary Parks & Rec pilot" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${isRunning ? "bg-green-500" : "bg-gray-400"}` }), _jsx("span", { className: "text-sm text-gray-600", children: isRunning ? "Running" : "Stopped" })] }), _jsxs("button", { onClick: () => setShowSettings(!showSettings), className: "flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200", children: [_jsx(Settings, { className: "w-4 h-4" }), "Settings"] }), _jsxs("button", { onClick: resetSandbox, className: "flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700", children: [_jsx(RotateCcw, { className: "w-4 h-4" }), "Reset"] }), isRunning ? (_jsxs("button", { onClick: stopSandbox, className: "flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700", children: [_jsx(Pause, { className: "w-4 h-4" }), "Stop"] })) : (_jsxs("button", { onClick: startSandbox, className: "flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700", children: [_jsx(Play, { className: "w-4 h-4" }), "Start"] }))] })] }) }), currentScenario && (_jsx(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-semibold text-blue-900", children: ["Active Scenario: ", currentScenario.name] }), _jsx("p", { className: "text-blue-700 mt-1", children: currentScenario.description })] }), _jsx("button", { onClick: completeScenario, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Complete Scenario" })] }) })), metrics && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-8 h-8 text-blue-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Users" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: metrics.activeUsers })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-8 h-8 text-green-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Registrations" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: metrics.totalRegistrations })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "w-8 h-8 text-orange-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Waitlist" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: metrics.waitlistEntries })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Star, { className: "w-8 h-8 text-purple-600" }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Satisfaction" }), _jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [metrics.userSatisfaction, "/5"] })] })] }) })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Test Scenarios" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Practice common administrative tasks" })] }), _jsx("div", { className: "p-6", children: _jsx("div", { className: "space-y-4", children: scenarios.map((scenario) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: scenario.name }), _jsx("p", { className: "text-sm text-gray-600", children: scenario.description })] }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scenario.complexity === "basic" ? "bg-green-100 text-green-800" :
                                                            scenario.complexity === "intermediate" ? "bg-yellow-100 text-yellow-800" :
                                                                "bg-red-100 text-red-800"}`, children: scenario.complexity })] }), _jsxs("div", { className: "flex items-center justify-between text-sm text-gray-500 mb-3", children: [_jsxs("span", { children: ["Completion: ", scenario.completionRate, "%"] }), _jsxs("span", { children: ["Avg Time: ", scenario.averageTime, " min"] })] }), _jsx("button", { onClick: () => startScenario(scenario), disabled: !isRunning, className: "w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: "Start Scenario" })] }, scenario.id))) }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Test Users" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Sandbox user accounts and their test data" })] }), _jsx("div", { className: "p-6", children: _jsx("div", { className: "space-y-4", children: sandboxUsers.map((user) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: user.name }), _jsx("p", { className: "text-sm text-gray-600", children: user.email })] }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "RecDirector" ? "bg-purple-100 text-purple-800" :
                                                            user.role === "RecCoordinator" ? "bg-blue-100 text-blue-800" :
                                                                "bg-green-100 text-green-800"}`, children: user.role })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3", children: [_jsxs("div", { children: ["Registrations: ", user.testData.registrations] }), _jsxs("div", { children: ["Waitlist: ", user.testData.waitlistEntries] }), _jsxs("div", { children: ["Overrides: ", user.testData.overrides] }), _jsxs("div", { children: ["Approvals: ", user.testData.approvals] })] }), _jsx("button", { onClick: () => setSelectedUser(user), className: "w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200", children: "View Details" })] }, user.id))) }) })] })] }), _jsxs("div", { className: "mt-8 bg-white rounded-lg shadow", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Test Leagues" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Sandbox sports leagues with test data" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "League" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Capacity" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Waitlist" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Test Data" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: sandboxLeagues.map((league) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: league.name }), _jsx("div", { className: "text-sm text-gray-500", children: league.location })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${league.status === "active" ? "bg-green-100 text-green-800" :
                                                        league.status === "full" ? "bg-yellow-100 text-yellow-800" :
                                                            "bg-gray-100 text-gray-800"}`, children: league.status }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsxs("div", { className: "text-sm text-gray-900", children: [league.currentRegistrations, "/", league.maxCapacity] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2 mt-1", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: `${(league.currentRegistrations / league.maxCapacity) * 100}%` } }) })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-900", children: league.waitlistCount }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-sm text-gray-900", children: [_jsxs("div", { children: ["Participants: ", league.testData.participants] }), _jsxs("div", { children: ["Siblings: ", league.testData.siblings] }), _jsxs("div", { children: ["Overrides: ", league.testData.ageOverrides] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsx("button", { onClick: () => setSelectedLeague(league), className: "text-blue-600 hover:text-blue-900", children: _jsx(Eye, { className: "w-4 h-4" }) }) })] }, league.id))) })] }) })] }), selectedUser && (_jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50", children: _jsx("div", { className: "relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white", children: _jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "User Details" }), _jsx("button", { onClick: () => setSelectedUser(null), className: "text-gray-400 hover:text-gray-600", children: _jsx(XCircle, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Name" }), _jsx("p", { className: "mt-1 text-sm text-gray-900", children: selectedUser.name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Email" }), _jsx("p", { className: "mt-1 text-sm text-gray-900", children: selectedUser.email })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Role" }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedUser.role === "RecDirector" ? "bg-purple-100 text-purple-800" :
                                                            selectedUser.role === "RecCoordinator" ? "bg-blue-100 text-blue-800" :
                                                                "bg-green-100 text-green-800"}`, children: selectedUser.role })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Status" }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedUser.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: selectedUser.isActive ? "Active" : "Inactive" })] })] }), selectedUser.department && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Department" }), _jsx("p", { className: "mt-1 text-sm text-gray-900", children: selectedUser.department })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Permissions" }), _jsx("div", { className: "mt-1 flex flex-wrap gap-2", children: selectedUser.permissions.map((permission, index) => (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: permission }, index))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Test Data Summary" }), _jsxs("div", { className: "mt-1 grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: ["Registrations: ", selectedUser.testData.registrations] }), _jsxs("div", { children: ["Waitlist Entries: ", selectedUser.testData.waitlistEntries] }), _jsxs("div", { children: ["Age Overrides: ", selectedUser.testData.overrides] }), _jsxs("div", { children: ["Approvals: ", selectedUser.testData.approvals] })] })] })] })] }) }) })), selectedLeague && (_jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50", children: _jsx("div", { className: "relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white", children: _jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "League Details" }), _jsx("button", { onClick: () => setSelectedLeague(null), className: "text-gray-400 hover:text-gray-600", children: _jsx(XCircle, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "League Name" }), _jsx("p", { className: "mt-1 text-sm text-gray-900", children: selectedLeague.name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Sport" }), _jsx("p", { className: "mt-1 text-sm text-gray-900", children: selectedLeague.sport })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Age Group" }), _jsx("p", { className: "mt-1 text-sm text-gray-900", children: selectedLeague.ageGroup })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Status" }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedLeague.status === "active" ? "bg-green-100 text-green-800" :
                                                            selectedLeague.status === "full" ? "bg-yellow-100 text-yellow-800" :
                                                                "bg-gray-100 text-gray-800"}`, children: selectedLeague.status })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Location" }), _jsx("p", { className: "mt-1 text-sm text-gray-900", children: selectedLeague.location })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Capacity" }), _jsxs("p", { className: "mt-1 text-sm text-gray-900", children: [selectedLeague.currentRegistrations, "/", selectedLeague.maxCapacity] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Waitlist" }), _jsx("p", { className: "mt-1 text-sm text-gray-900", children: selectedLeague.waitlistCount })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Start Date" }), _jsx("p", { className: "mt-1 text-sm text-gray-900", children: selectedLeague.startDate.toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "End Date" }), _jsx("p", { className: "mt-1 text-sm text-gray-900", children: selectedLeague.endDate.toLocaleDateString() })] })] }), selectedLeague.coach && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Coach" }), _jsx("p", { className: "mt-1 text-sm text-gray-900", children: selectedLeague.coach })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Test Data" }), _jsxs("div", { className: "mt-1 grid grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: ["Participants: ", selectedLeague.testData.participants] }), _jsxs("div", { children: ["Siblings: ", selectedLeague.testData.siblings] }), _jsxs("div", { children: ["Overrides: ", selectedLeague.testData.ageOverrides] })] })] })] })] }) }) }))] }));
};
export default TownCarySandbox;
