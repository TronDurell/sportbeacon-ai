import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { realApiService } from "../../services/realApiService";
const SocialCommerceFeed = () => {
    const [posts, setPosts] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState("social");
    const [loading, setLoading] = useState(false);
    const conditions = [
        { value: "new", label: "New", color: "bg-green-100 text-green-800" },
        { value: "like_new", label: "Like New", color: "bg-blue-100 text-blue-800" },
        { value: "good", label: "Good", color: "bg-yellow-100 text-yellow-800" },
        { value: "fair", label: "Fair", color: "bg-orange-100 text-orange-800" },
        { value: "poor", label: "Poor", color: "bg-red-100 text-red-800" }
    ];
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        setLoading(true);
        try {
            const [postsResponse, productsResponse] = await Promise.all([
                realApiService.query("socialPosts", { sortBy: "createdAt", sortOrder: "desc" }),
                realApiService.query("usedGear", { sortBy: "createdAt", sortOrder: "desc" })
            ]);
            setPosts(postsResponse.data || []);
            setProducts(productsResponse.data || []);
        }
        catch (error) {
        }
        finally {
            setLoading(false);
        }
    };
    const handleLike = async (collection, itemId) => {
        try {
            const currentPost = posts.find(p => p.id === itemId);
            const currentProduct = products.find(p => p.id === itemId);
            await realApiService.update(collection, itemId, {
                likes: collection === "socialPosts"
                    ? (currentPost?.likes || 0) + 1
                    : (currentProduct?.likes || 0) + 1,
            });
            // Update local state
            if (collection === "socialPosts") {
                setPosts(prev => prev.map(post => post.id === itemId ? { ...post, likes: post.likes + 1 } : post));
            }
            else {
                setProducts(prev => prev.map(product => product.id === itemId ? { ...product, likes: product.likes + 1 } : product));
            }
        }
        catch (error) {
        }
    };
    const handleMessage = async (userId) => {
        try {
            await realApiService.create("messages", {
                recipientId: userId,
                content: "Hi! I saw your post and would like to connect.",
                type: "text"
            });
            alert("Message sent!");
        }
        catch (error) {
            alert("Failed to send message. Please try again.");
        }
    };
    const formatDate = (date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (minutes < 60) {
            return `${minutes}m ago`;
        }
        else if (hours < 24) {
            return `${hours}h ago`;
        }
        else {
            return `${days}d ago`;
        }
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Social Commerce Feed" }), _jsx("p", { className: "text-gray-600", children: "Connect with the sports community and buy/sell used equipment" })] }), _jsx("div", { className: "flex justify-center mb-6", children: _jsxs("div", { className: "bg-gray-100 rounded-lg p-1", children: [_jsx("button", { onClick: () => setActiveTab("social"), className: `px-4 py-2 rounded-md transition-colors ${activeTab === "social"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"}`, children: "Social Feed" }), _jsx("button", { onClick: () => setActiveTab("marketplace"), className: `px-4 py-2 rounded-md transition-colors ${activeTab === "marketplace"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"}`, children: "Marketplace" })] }) }), loading && (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Loading..." })] })), activeTab === "social" && (_jsx("div", { className: "space-y-6", children: posts.map((post) => (_jsx("div", { className: "bg-white rounded-lg shadow-sm border p-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-gray-600 font-medium", children: post.user?.name?.charAt(0) || "U" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: post.user?.name || "Anonymous User" }), _jsx("span", { className: "text-sm text-gray-500", children: formatDate(post.createdAt) })] }), _jsx("p", { className: "text-gray-700 mb-4", children: post.content }), post.imageUrl && (_jsx("div", { className: "mb-4", children: _jsx("img", { src: post.imageUrl, alt: "Post content", className: "w-full h-64 object-cover rounded-lg" }) })), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("button", { onClick: () => handleLike("socialPosts", post.id), className: "flex items-center gap-2 text-gray-600 hover:text-red-500", children: [_jsx("span", { children: "\u2764\uFE0F" }), _jsx("span", { children: post.likes })] }), _jsxs("span", { className: "text-gray-600", children: ["\uD83D\uDCAC ", post.comments] }), _jsx("button", { onClick: () => handleMessage(post.userId), className: "text-blue-600 hover:text-blue-700 text-sm font-medium", children: "Message" })] })] })] }) }, post.id))) })), activeTab === "marketplace" && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: products.map((product) => (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow", children: [product.imageUrl && (_jsx("div", { className: "h-48 bg-gray-200 flex items-center justify-center", children: _jsx("span", { className: "text-gray-500", children: "Product Image" }) })), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: product.name }), _jsx("span", { className: `text-xs px-2 py-1 rounded-full ${conditions.find(c => c.value === product.condition)?.color || "bg-gray-100 text-gray-800"}`, children: conditions.find(c => c.value === product.condition)?.label })] }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: product.description }), _jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("span", { className: "text-lg font-bold text-green-600", children: ["$", product.price] }), _jsxs("span", { className: "text-sm text-gray-500", children: ["by ", product.seller.name] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("button", { onClick: () => handleLike("usedGear", product.id), className: "flex items-center gap-1 text-gray-600 hover:text-red-500", children: [_jsx("span", { children: "\u2764\uFE0F" }), _jsx("span", { className: "text-sm", children: product.likes })] }), _jsx("button", { onClick: () => handleMessage(product.seller.id), className: "px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm", children: "Contact Seller" })] })] })] }, product.id))) })), _jsxs("div", { className: "mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Community Stats" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 text-center", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-blue-600", children: posts.length }), _jsx("p", { className: "text-sm text-gray-600", children: "Social Posts" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-green-600", children: products.length }), _jsx("p", { className: "text-sm text-gray-600", children: "Items for Sale" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-purple-600", children: posts.reduce((sum, post) => sum + post.likes, 0) + products.reduce((sum, product) => sum + product.likes, 0) }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Likes" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-orange-600", children: posts.reduce((sum, post) => sum + post.comments, 0) }), _jsx("p", { className: "text-sm text-gray-600", children: "Comments" })] })] })] })] }));
};
export default SocialCommerceFeed;
