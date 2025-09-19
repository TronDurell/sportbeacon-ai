import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const BeaconBuyBot = () => {
    const { sendRequest } = useAgentOrchestration();
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const [budget, setBudget] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const categories = [
        "Equipment",
        "Apparel",
        "Footwear",
        "Accessories",
        "Training",
        "Nutrition"
    ];
    const handleSearch = useCallback(async () => {
        if (!query.trim())
            return;
        setLoading(true);
        try {
            const request = {
                id: Date.now().toString(),
                query: query.trim(),
                category,
                budget: budget ? parseFloat(budget) : undefined,
                timestamp: new Date()
            };
            // Add to search history
            setSearchHistory(prev => [request, ...prev.slice(0, 9)]);
            // Simulate AI-powered search
            await sendRequest({
                type: "shopping_search",
                data: request
            });
            // Mock results
            const mockResults = [
                {
                    id: "1",
                    name: "Professional Soccer Ball",
                    price: 29.99,
                    category: "Equipment",
                    description: "High-quality soccer ball for professional training",
                    imageUrl: "/images/soccer-ball.jpg"
                },
                {
                    id: "2",
                    name: "Moisture-Wicking Jersey",
                    price: 24.99,
                    category: "Apparel",
                    description: "Comfortable sports jersey with moisture-wicking technology",
                    imageUrl: "/images/jersey.jpg"
                }
            ];
            setResults(mockResults);
        }
        catch (error) {
        }
        finally {
            setLoading(false);
        }
    }, [query, category, budget, sendRequest]);
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Beacon Buy Bot" }), _jsx("p", { className: "text-gray-600", children: "AI-powered sports equipment shopping assistant" })] }), _jsx("div", { className: "bg-white rounded-lg shadow-sm border p-6 mb-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "What are you looking for?" }), _jsx("input", { type: "text", value: query, onChange: (e) => setQuery(e.target.value), onKeyPress: handleKeyPress, placeholder: "e.g., soccer cleats, basketball, training equipment...", className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Category" }), _jsxs("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "All Categories" }), categories.map((cat) => (_jsx("option", { value: cat, children: cat }, cat)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Budget (optional)" }), _jsx("input", { type: "number", value: budget, onChange: (e) => setBudget(e.target.value), placeholder: "Enter your budget", className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] })] }), _jsx("button", { onClick: handleSearch, disabled: loading || !query.trim(), className: "w-full md:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? "Searching..." : "Search Products" })] }) }), searchHistory.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border p-6 mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Recent Searches" }), _jsx("div", { className: "space-y-2", children: searchHistory.slice(0, 5).map((search) => (_jsxs("div", { className: "flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer", onClick: () => {
                                setQuery(search.query);
                                setCategory(search.category);
                                setBudget(search.budget?.toString() || "");
                            }, children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: search.query }), _jsxs("p", { className: "text-sm text-gray-600", children: [search.category, " ", search.budget && `• $${search.budget}`] })] }), _jsx("span", { className: "text-xs text-gray-500", children: search.timestamp.toLocaleDateString() })] }, search.id))) })] })), results.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border p-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: ["Recommended Products (", results.length, ")"] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: results.map((product) => (_jsxs("div", { className: "border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow", children: [product.imageUrl && (_jsx("div", { className: "h-48 bg-gray-200 flex items-center justify-center", children: _jsx("span", { className: "text-gray-500", children: "Product Image" }) })), _jsxs("div", { className: "p-4", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-2", children: product.name }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: product.description }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-lg font-bold text-blue-600", children: ["$", product.price] }), _jsx("button", { className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm", children: "View Details" })] })] })] }, product.id))) })] })), _jsxs("div", { className: "mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "AI-Powered Features" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3", children: _jsx("span", { className: "text-white font-bold", children: "AI" }) }), _jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Smart Recommendations" }), _jsx("p", { className: "text-sm text-gray-600", children: "Get personalized product suggestions based on your needs" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3", children: _jsx("span", { className: "text-white font-bold", children: "$" }) }), _jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Price Optimization" }), _jsx("p", { className: "text-sm text-gray-600", children: "Find the best deals and compare prices across vendors" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3", children: _jsx("span", { className: "text-white font-bold", children: "\u26A1" }) }), _jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Quick Search" }), _jsx("p", { className: "text-sm text-gray-600", children: "Natural language search for any sports equipment" })] })] })] })] }));
};
export default BeaconBuyBot;
