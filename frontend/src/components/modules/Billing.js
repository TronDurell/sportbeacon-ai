import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CreditCard, Receipt } from "lucide-react";
const Billing = () => {
    const billingData = {
        currentPlan: "Pro Plan",
        nextBilling: "2024-02-15",
        amount: "$99.00",
        usage: {
            users: 45,
            limit: 100,
            storage: "2.3GB",
            storageLimit: "10GB"
        }
    };
    const payments = [
        {
            id: "1",
            description: "Pro Plan",
            amount: 99.00,
            date: new Date("2024-01-15"),
            status: "completed"
        },
        {
            id: "2",
            description: "Pro Plan",
            amount: 99.00,
            date: new Date("2024-01-10"),
            status: "completed"
        }
    ];
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Billing & Subscription" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsxs("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2", children: [_jsx(CreditCard, { className: "w-4 h-4" }), _jsx("span", { children: "Make Payment" })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Current Plan" }), _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: billingData.currentPlan }), _jsxs("p", { className: "text-gray-600", children: ["Next billing: ", billingData.nextBilling] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-2xl font-bold text-blue-600", children: billingData.amount }), _jsx("p", { className: "text-gray-600", children: "per month" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: "Users" }), _jsxs("span", { children: [billingData.usage.users, "/", billingData.usage.limit] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: `${(billingData.usage.users / billingData.usage.limit) * 100}%` } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: "Storage" }), _jsxs("span", { children: [billingData.usage.storage, "/", billingData.usage.storageLimit] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-600 h-2 rounded-full", style: { width: "23%" } }) })] })] })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("button", { className: "w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2", children: [_jsx(CreditCard, { className: "w-4 h-4" }), _jsx("span", { children: "Update Payment" })] }), _jsxs("button", { className: "w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center justify-center space-x-2", children: [_jsx(Receipt, { className: "w-4 h-4" }), _jsx("span", { children: "Download Invoice" })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Recent Transactions" }), _jsx("div", { className: "space-y-3", children: payments.map((payment) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: payment.description }), _jsx("p", { className: "text-sm text-gray-600", children: payment.date.toLocaleDateString() })] }), _jsxs("span", { className: "text-green-600 font-medium", children: ["$", payment.amount.toFixed(2)] })] }, payment.id))) })] })] })] })] }));
};
export default Billing;
