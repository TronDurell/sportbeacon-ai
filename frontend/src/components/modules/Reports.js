import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FileText, BarChart3, Calendar } from "lucide-react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const Reports = () => {
    const { sendRequest } = useAgentOrchestration();
    const reports = [
        {
            id: "1",
            title: "Monthly Performance Report",
            type: "performance",
            generatedDate: new Date("2024-01-20"),
            status: "ready",
            size: "2.3 MB",
            format: "pdf"
        },
        {
            id: "2",
            title: "Attendance Summary",
            type: "attendance",
            generatedDate: new Date("2024-01-19"),
            status: "ready",
            size: "1.1 MB",
            format: "csv"
        },
        {
            id: "3",
            title: "Financial Overview",
            type: "financial",
            generatedDate: new Date("2024-01-18"),
            status: "ready",
            size: "3.7 MB",
            format: "excel"
        },
        {
            id: "4",
            title: "Team Analytics",
            type: "analytics",
            generatedDate: new Date("2024-01-17"),
            status: "generating",
            size: "--",
            format: "pdf"
        }
    ];
    const getTypeColor = (type) => {
        switch (type) {
            case "performance": return "bg-blue-100 text-blue-800";
            case "attendance": return "bg-green-100 text-green-800";
            case "financial": return "bg-purple-100 text-purple-800";
            case "analytics": return "bg-orange-100 text-orange-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "ready": return "text-green-600";
            case "generating": return "text-yellow-600";
            case "failed": return "text-red-600";
            default: return "text-gray-600";
        }
    };
    const getFormatIcon = (format) => {
        switch (format) {
            case "pdf": return "📄";
            case "csv": return "📊";
            case "excel": return "📈";
            default: return "📄";
        }
    };
    const generateReport = async (type) => {
        await sendRequest({
            type: "generate_report",
            reportType: type,
            timestamp: new Date()
        });
    };
    const downloadReport = async (reportId) => {
        await sendRequest({
            type: "download_report",
            reportId
        });
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Reports & Analytics" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsxs("button", { onClick: () => generateReport("performance"), className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2", children: [_jsx(FileText, { className: "w-4 h-4" }), _jsx("span", { children: "Generate Report" })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Reports" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: reports.length })] }), _jsx(FileText, { className: "w-8 h-8 text-blue-500" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Ready" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: reports.filter(r => r.status === "ready").length })] }), _jsx(BarChart3, { className: "w-8 h-8 text-green-500" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Generating" }), _jsx("p", { className: "text-2xl font-bold text-yellow-600", children: reports.filter(r => r.status === "generating").length })] }), _jsx(Calendar, { className: "w-8 h-8 text-yellow-500" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Failed" }), _jsx("p", { className: "text-2xl font-bold text-red-600", children: reports.filter(r => r.status === "failed").length })] }), _jsx(FileText, { className: "w-8 h-8 text-red-500" })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "p-6 border-b", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Recent Reports" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Report" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Generated" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Size" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: reports.map((report) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-lg", children: getFormatIcon(report.format) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: report.title }), _jsx("div", { className: "text-sm text-gray-500", children: report.format.toUpperCase() })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.type)}`, children: report.type }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: report.generatedDate.toLocaleDateString() }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `text-sm font-medium ${getStatusColor(report.status)}`, children: report.status }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: report.size }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: report.status === "ready" ? (_jsx("button", { onClick: () => downloadReport(report.id), className: "text-blue-600 hover:text-blue-900", children: "Download" })) : (_jsx("span", { className: "text-gray-400", children: "Not available" })) })] }, report.id))) })] }) })] })] }));
};
export default Reports;
