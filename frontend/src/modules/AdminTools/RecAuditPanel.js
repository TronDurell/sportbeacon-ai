import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, CheckCircle, XCircle, AlertTriangle, FileText, Download, Search, RefreshCw, Settings, Eye, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { useI18n } from "../../lib/i18n";
// Mock user and group check
const useCurrentUser = () => ({
    id: "admin1",
    email: "admin@cary.gov",
    groups: ["testGroups.caryAdminTest"],
    role: "TownStaff",
    permissions: ["read", "write", "approve", "override"]
});
// Mock data
const mockRequests = [
    {
        id: "1",
        type: "AGE_OVERRIDE",
        childId: "child1",
        leagueId: "league1",
        status: "PENDING",
        adminNote: "Child is 4 months under age limit but shows advanced skills",
        timestamp: new Date("2024-01-15"),
        parentName: "Sarah Johnson",
        childName: "Alex Johnson",
        childAge: 5,
        leagueName: "U8 Soccer"
    },
    {
        id: "2",
        type: "SIBLING_PAIRING",
        childId: "child2",
        leagueId: "league2",
        status: "APPROVED",
        adminNote: "Siblings matched successfully",
        timestamp: new Date("2024-01-14"),
        parentName: "Mike Davis",
        childName: "Emma Davis",
        childAge: 7,
        leagueName: "U10 Basketball"
    },
    {
        id: "3",
        type: "WAITLIST",
        childId: "child3",
        leagueId: "league3",
        status: "PENDING",
        adminNote: "League full, waiting for spot",
        timestamp: new Date("2024-01-13"),
        parentName: "Lisa Chen",
        childName: "Ryan Chen",
        childAge: 9,
        leagueName: "U12 Baseball"
    }
];
const RecAuditPanel = () => {
    const { t } = useI18n();
    const user = useCurrentUser();
    const [activeTab, setActiveTab] = useState("waitlist");
    const [requests, setRequests] = useState(mockRequests);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    // Check if user has access to Town Rec features
    if (!user.groups.includes("testGroups.caryAdminTest")) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx(Shield, { className: "w-16 h-16 text-red-500 mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Access Restricted" }), _jsx("p", { className: "text-gray-600", children: "You need Town Rec admin permissions to access this panel." })] }) }));
    }
    // Filter requests based on status and search
    const filteredRequests = requests.filter(request => {
        const matchesStatus = filterStatus === "ALL" || request.status === filterStatus;
        const matchesSearch = searchTerm === "" ||
            request.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.leagueName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });
    // Handle admin actions
    const handleAction = async (action, requestId, decision, note) => {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Update local state
            setRequests(prev => prev.map(req => req.id === requestId
                ? { ...req, status: (decision || req.status), adminNote: note || req.adminNote }
                : req));
            // Log to audit trail
            logAuditTrail(action, { requestId, decision, note, adminId: user.id });
            // Show success toast
            toast.success(t(`success.${action}`));
        }
        catch (error) {
            toast.error(t(`errors.${action}`));
        }
    };
    // Mock audit trail logging
    const logAuditTrail = (action, data) => {
        // Log audit trail for compliance and security monitoring
        const auditEntry = {
            action,
            data,
            timestamp: new Date(),
            userId: user?.id,
            sessionId: sessionStorage.getItem("sessionId")
        };
        // TODO: Send to audit log service
        // auditLogService.log(auditEntry);
    };
    const tabs = [
        { id: "waitlist", label: t("admin.waitlistExceptions"), icon: Users },
        { id: "siblings", label: t("admin.siblingPairing"), icon: Users },
        { id: "ageOverrides", label: t("admin.ageOverrideRequests"), icon: AlertTriangle },
        { id: "approvals", label: t("admin.approvalQueue"), icon: CheckCircle },
        { id: "sandbox", label: t("admin.sandboxTestSubmit"), icon: Settings }
    ];
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6", "data-testid": "audit-panel", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: t("admin.townRecAuditPanel") }), _jsx("p", { className: "text-gray-600 mt-1", children: "Town of Cary Parks & Recreation Administration" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full", children: [_jsx(Shield, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm font-medium", children: user.role })] }), _jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200", children: [_jsx(Settings, { className: "w-4 h-4" }), t("common.settings")] })] })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6 mb-6", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: t("common.search"), value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }) }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "ALL", children: t("common.all") }), _jsx("option", { value: "PENDING", children: t("admin.pending") }), _jsx("option", { value: "APPROVED", children: t("admin.approved") }), _jsx("option", { value: "DENIED", children: t("admin.denied") })] }), _jsxs("button", { onClick: () => window.location.reload(), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), t("common.refresh")] })] }) }), _jsxs("div", { className: "bg-white rounded-lg shadow mb-6", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "flex space-x-8 px-6", children: tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`, children: [_jsx(Icon, { className: "w-4 h-4" }), tab.label] }, tab.id));
                            }) }) }), _jsx("div", { className: "p-6", children: _jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.2 }, children: [activeTab === "waitlist" && (_jsx(WaitlistExceptions, { requests: filteredRequests.filter(r => r.type === "WAITLIST"), onAction: handleAction })), activeTab === "siblings" && (_jsx(SiblingPairing, { requests: filteredRequests.filter(r => r.type === "SIBLING_PAIRING"), onAction: handleAction })), activeTab === "ageOverrides" && (_jsx(AgeOverrideRequests, { requests: filteredRequests.filter(r => r.type === "AGE_OVERRIDE"), onAction: handleAction })), activeTab === "approvals" && (_jsx(ApprovalQueue, { requests: filteredRequests.filter(r => r.status === "PENDING"), onAction: handleAction })), activeTab === "sandbox" && (_jsx(SandboxTestSubmit, { onAction: handleAction }))] }, activeTab) }) })] })] }));
};
// Sub-tab Components
const WaitlistExceptions = ({ requests, onAction }) => (_jsxs("div", { "data-testid": "waitlistExceptions", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Waitlist Exceptions" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm text-gray-500", children: [requests.length, " requests"] }), _jsxs("button", { className: "flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200", children: [_jsx(Download, { className: "w-4 h-4" }), "Export"] })] })] }), _jsx(RequestList, { requests: requests, onAction: onAction })] }));
const SiblingPairing = ({ requests, onAction }) => (_jsxs("div", { "data-testid": "siblingPairing", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Sibling Pairing" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm text-gray-500", children: [requests.length, " requests"] }), _jsxs("button", { className: "flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200", children: [_jsx(Plus, { className: "w-4 h-4" }), "Auto-Pair"] })] })] }), _jsx(RequestList, { requests: requests, onAction: onAction })] }));
const AgeOverrideRequests = ({ requests, onAction }) => (_jsxs("div", { "data-testid": "ageOverrideRequests", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Age Override Requests" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm text-gray-500", children: [requests.length, " requests"] }), _jsxs("button", { className: "flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200", children: [_jsx(AlertTriangle, { className: "w-4 h-4" }), "Review All"] })] })] }), _jsx(RequestList, { requests: requests, onAction: onAction })] }));
const ApprovalQueue = ({ requests, onAction }) => (_jsxs("div", { "data-testid": "approvalQueue", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Approval Queue" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm text-gray-500", children: [requests.length, " pending"] }), _jsxs("button", { className: "flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), "Bulk Approve"] })] })] }), _jsx(RequestList, { requests: requests, onAction: onAction })] }));
const SandboxTestSubmit = ({ onAction }) => (_jsx("div", { "data-testid": "sandboxTestSubmit", children: _jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-medium text-yellow-900 mb-4", children: "Sandbox Test Environment" }), _jsx("p", { className: "text-yellow-800 mb-4", children: "This is a test environment for Town Rec automation. All actions are logged but not applied to production data." }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("button", { onClick: () => onAction("testWaitlist", "test-1", "APPROVED"), className: "p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50", children: [_jsx(Users, { className: "w-8 h-8 text-blue-500 mx-auto mb-2" }), _jsx("p", { className: "text-sm font-medium", children: "Test Waitlist" })] }), _jsxs("button", { onClick: () => onAction("testSibling", "test-2", "APPROVED"), className: "p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50", children: [_jsx(Users, { className: "w-8 h-8 text-green-500 mx-auto mb-2" }), _jsx("p", { className: "text-sm font-medium", children: "Test Sibling Pairing" })] }), _jsxs("button", { onClick: () => onAction("testAgeOverride", "test-3", "APPROVED"), className: "p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50", children: [_jsx(AlertTriangle, { className: "w-8 h-8 text-orange-500 mx-auto mb-2" }), _jsx("p", { className: "text-sm font-medium", children: "Test Age Override" })] })] })] }) }));
// Request List Component
const RequestList = ({ requests, onAction }) => (_jsx("div", { className: "space-y-4", children: requests.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(FileText, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-500", children: "No requests found" })] })) : (requests.map((request) => (_jsx(RequestCard, { request: request, onAction: onAction }, request.id)))) }));
// Request Card Component
const RequestCard = ({ request, onAction }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [note, setNote] = useState("");
    const getStatusColor = (status) => {
        switch (status) {
            case "APPROVED": return "text-green-600 bg-green-100";
            case "DENIED": return "text-red-600 bg-red-100";
            case "PENDING": return "text-yellow-600 bg-yellow-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case "WAITLIST": return _jsx(Users, { className: "w-4 h-4" });
            case "SIBLING_PAIRING": return _jsx(Users, { className: "w-4 h-4" });
            case "AGE_OVERRIDE": return _jsx(AlertTriangle, { className: "w-4 h-4" });
            default: return _jsx(FileText, { className: "w-4 h-4" });
        }
    };
    return (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [getTypeIcon(request.type), _jsx("h4", { className: "font-medium text-gray-900", children: request.parentName }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`, children: request.status })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Child:" }), _jsxs("p", { className: "font-medium", children: [request.childName, " (", request.childAge, ")"] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "League:" }), _jsx("p", { className: "font-medium", children: request.leagueName })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Type:" }), _jsx("p", { className: "font-medium", children: request.type.replace("_", " ") })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Date:" }), _jsx("p", { className: "font-medium", children: request.timestamp.toLocaleDateString() })] })] }), request.adminNote && (_jsx("div", { className: "mt-3 p-3 bg-gray-50 rounded-lg", children: _jsx("p", { className: "text-sm text-gray-700", children: request.adminNote }) }))] }), _jsxs("div", { className: "flex items-center gap-2 ml-4", children: [_jsx("button", { onClick: () => setShowDetails(!showDetails), className: "p-2 text-gray-400 hover:text-gray-600", children: _jsx(Eye, { className: "w-4 h-4" }) }), request.status === "PENDING" && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => onAction("approve", request.id, "APPROVED", note), className: "p-2 text-green-600 hover:text-green-700", children: _jsx(CheckCircle, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => onAction("deny", request.id, "DENIED", note), className: "p-2 text-red-600 hover:text-red-700", children: _jsx(XCircle, { className: "w-4 h-4" }) })] }))] })] }), showDetails && (_jsx("div", { className: "mt-4 pt-4 border-t border-gray-200", children: _jsx("div", { className: "space-y-3", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Admin Note" }), _jsx("textarea", { value: note, onChange: (e) => setNote(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", rows: 3, placeholder: "Add a note about this decision..." })] }) }) }))] }));
};
export default RecAuditPanel;
