import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const Users = () => {
    const { sendRequest } = useAgentOrchestration();
    const [users, setUsers] = useState([
        {
            id: "1",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            role: "player",
            status: "active",
            createdAt: new Date("2024-01-15")
        },
        {
            id: "2",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com",
            role: "coach",
            status: "active",
            createdAt: new Date("2024-01-10")
        },
        {
            id: "3",
            firstName: "Mike",
            lastName: "Johnson",
            email: "mike.johnson@example.com",
            role: "parent",
            status: "pending",
            createdAt: new Date("2024-01-20")
        }
    ]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState("all");
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === "all" || user.role === selectedRole;
        return matchesSearch && matchesRole;
    });
    const getStatusColor = (status) => {
        switch (status) {
            case "active": return "bg-green-100 text-green-800";
            case "inactive": return "bg-red-100 text-red-800";
            case "pending": return "bg-yellow-100 text-yellow-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };
    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setUsers(prev => prev.filter(user => user.id !== userId));
            await sendRequest({
                type: "delete_user",
                userId
            });
        }
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Users" }), _jsxs("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Add User" })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "p-4 border-b", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "Search users...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("select", { value: selectedRole, onChange: (e) => setSelectedRole(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Roles" }), _jsx("option", { value: "player", children: "Player" }), _jsx("option", { value: "coach", children: "Coach" }), _jsx("option", { value: "parent", children: "Parent" }), _jsx("option", { value: "admin", children: "Admin" })] })] }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Role" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Joined" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredUsers.map((user) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0 h-10 w-10", children: _jsx("div", { className: "h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center", children: _jsxs("span", { className: "text-sm font-medium text-gray-700", children: [user.firstName[0], user.lastName[0]] }) }) }), _jsx("div", { className: "ml-4", children: _jsxs("div", { className: "text-sm font-medium text-gray-900", children: [user.firstName, " ", user.lastName] }) })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: user.email }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize", children: user.role }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`, children: user.status }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: user.createdAt.toLocaleDateString() }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { className: "text-blue-600 hover:text-blue-900", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { className: "text-green-600 hover:text-green-900", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDeleteUser(user.id), className: "text-red-600 hover:text-red-900", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, user.id))) })] }) })] })] }));
};
export default Users;
