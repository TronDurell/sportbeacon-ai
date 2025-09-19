import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DollarSign, CheckCircle, XCircle } from "lucide-react";
const Payments = () => {
    const payments = [
        {
            id: "1",
            description: "Season Registration Fee",
            amount: 150.00,
            status: "completed",
            date: new Date("2024-01-15"),
            type: "registration"
        },
        {
            id: "2",
            description: "Team Jersey",
            amount: 45.00,
            status: "pending",
            date: new Date("2024-01-20"),
            type: "equipment"
        },
        {
            id: "3",
            description: "Tournament Entry",
            amount: 75.00,
            status: "completed",
            date: new Date("2024-01-10"),
            type: "tournament"
        },
        {
            id: "4",
            description: "Premium Subscription",
            amount: 29.99,
            status: "failed",
            date: new Date("2024-01-18"),
            type: "subscription"
        }
    ];
    const getStatusColor = (status) => {
        switch (status) {
            case "completed": return "text-green-600";
            case "pending": return "text-yellow-600";
            case "failed": return "text-red-600";
            case "refunded": return "text-gray-600";
            default: return "text-gray-600";
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case "completed": return _jsx(CheckCircle, { className: "w-5 h-5 text-green-500" });
            case "failed": return _jsx(XCircle, { className: "w-5 h-5 text-red-500" });
            default: return _jsx(DollarSign, { className: "w-5 h-5 text-yellow-500" });
        }
    };
    const getTypeColor = (type) => {
        switch (type) {
            case "registration": return "bg-blue-100 text-blue-800";
            case "equipment": return "bg-green-100 text-green-800";
            case "tournament": return "bg-purple-100 text-purple-800";
            case "subscription": return "bg-orange-100 text-orange-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };
    const totalPaid = payments
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payments
        .filter(p => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0);
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Payments & Billing" }), _jsxs("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2", children: [_jsx(DollarSign, { className: "w-4 h-4" }), _jsx("span", { children: "Make Payment" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Paid" }), _jsxs("p", { className: "text-2xl font-bold text-green-600", children: ["$", totalPaid.toFixed(2)] })] }), _jsx(CheckCircle, { className: "w-8 h-8 text-green-500" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Pending" }), _jsxs("p", { className: "text-2xl font-bold text-yellow-600", children: ["$", pendingAmount.toFixed(2)] })] }), _jsx(DollarSign, { className: "w-8 h-8 text-yellow-500" })] }) }), _jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Transactions" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: payments.length })] }), _jsx(DollarSign, { className: "w-8 h-8 text-blue-500" })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "p-6 border-b", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Payment History" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Description" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Amount" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: payments.map((payment) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm font-medium text-gray-900", children: payment.description }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(payment.type)}`, children: payment.type }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-sm font-medium text-gray-900", children: ["$", payment.amount.toFixed(2)] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center space-x-2", children: [getStatusIcon(payment.status), _jsx("span", { className: `text-sm font-medium ${getStatusColor(payment.status)}`, children: payment.status })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: payment.date.toLocaleDateString() }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsx("button", { className: "text-blue-600 hover:text-blue-900", children: "View Details" }) })] }, payment.id))) })] }) })] })] }));
};
export default Payments;
