import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { realApiService } from "../../services/realApiService";
const BulkProcurementPortal = () => {
    const [items, setItems] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        setLoading(true);
        try {
            const [itemsResponse, vendorsResponse, ordersResponse] = await Promise.all([
                realApiService.query("procurementItems", { sortBy: "name" }),
                realApiService.query("vendors", { sortBy: "name" }),
                realApiService.query("purchaseOrders", { sortBy: "createdAt", sortOrder: "desc" })
            ]);
            setItems(itemsResponse.data || []);
            setVendors(vendorsResponse.data || []);
            setPurchaseOrders(ordersResponse.data || []);
        }
        catch (error) {
        }
        finally {
            setLoading(false);
        }
    };
    const handleItemToggle = (itemId) => {
        setSelectedItems(prev => prev.includes(itemId)
            ? prev.filter(id => id !== itemId)
            : [...prev, itemId]);
    };
    const handleBulkOrder = async () => {
        if (selectedItems.length === 0) {
            alert("Please select items to order");
            return;
        }
        setLoading(true);
        try {
            const selectedItemDetails = items.filter(item => selectedItems.includes(item.id));
            const totalAmount = selectedItemDetails.reduce((sum, item) => sum + item.unitPrice, 0);
            const orderData = {
                items: selectedItemDetails,
                totalAmount,
                status: "pending"
            };
            const response = await realApiService.create("purchaseOrders", orderData);
            setPurchaseOrders(prev => [response.data, ...prev]);
            setSelectedItems([]);
            alert("Bulk order created successfully!");
        }
        catch (error) {
            alert("Failed to create bulk order. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "approved": return "bg-blue-100 text-blue-800";
            case "shipped": return "bg-purple-100 text-purple-800";
            case "delivered": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Bulk Procurement Portal" }), _jsx("p", { className: "text-gray-600", children: "Manage bulk purchases and vendor relationships" })] }), loading && (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Loading..." })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-white rounded-lg shadow-sm border p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Available Items" }), _jsxs("button", { onClick: handleBulkOrder, disabled: loading || selectedItems.length === 0, className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed", children: ["Create Bulk Order (", selectedItems.length, ")"] })] }), _jsx("div", { className: "space-y-3", children: items.map((item) => (_jsx("div", { className: `p-4 border rounded-lg cursor-pointer transition-colors ${selectedItems.includes(item.id)
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"}`, onClick: () => handleItemToggle(item.id), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: item.name }), _jsxs("p", { className: "text-sm text-gray-600", children: [item.category, " \u2022 ", item.supplier] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-bold text-blue-600", children: ["$", item.unitPrice] }), _jsx("span", { className: `text-xs px-2 py-1 rounded-full ${item.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: item.inStock ? "In Stock" : "Out of Stock" })] })] }) }, item.id))) })] }) }), _jsx("div", { children: _jsxs("div", { className: "bg-white rounded-lg shadow-sm border p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Top Vendors" }), _jsx("div", { className: "space-y-3", children: vendors.slice(0, 5).map((vendor) => (_jsxs("div", { className: "p-3 border border-gray-200 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: vendor.name }), _jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("div", { className: "flex", children: [...Array(5)].map((_, i) => (_jsx("span", { className: `text-sm ${i < vendor.rating ? "text-yellow-400" : "text-gray-300"}`, children: "\u2605" }, i))) }), _jsxs("span", { className: "text-sm text-gray-600", children: ["(", vendor.rating, ")"] })] }), _jsx("div", { className: "flex flex-wrap gap-1", children: vendor.specialties.slice(0, 3).map((specialty, index) => (_jsx("span", { className: "text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full", children: specialty }, index))) })] }, vendor.id))) })] }) })] }), _jsx("div", { className: "mt-8", children: _jsxs("div", { className: "bg-white rounded-lg shadow-sm border p-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Recent Purchase Orders" }), _jsx("div", { className: "space-y-4", children: purchaseOrders.slice(0, 5).map((order) => (_jsxs("div", { className: "p-4 border border-gray-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-semibold text-gray-900", children: ["Order #", order.id] }), _jsxs("p", { className: "text-sm text-gray-600", children: [order.items.length, " items \u2022 ", order.createdAt.toLocaleDateString()] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-bold text-gray-900", children: ["$", order.totalAmount] }), _jsx("span", { className: `text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`, children: order.status })] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2", children: [order.items.slice(0, 4).map((item) => (_jsx("div", { className: "text-sm text-gray-600", children: item.name }, item.id))), order.items.length > 4 && (_jsxs("div", { className: "text-sm text-gray-500", children: ["+", order.items.length - 4, " more"] }))] })] }, order.id))) })] }) })] }));
};
export default BulkProcurementPortal;
