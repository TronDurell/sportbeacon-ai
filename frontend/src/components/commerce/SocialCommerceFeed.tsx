import React, { useState, useEffect } from "react";
import { realApiService } from "../../services/realApiService";

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface SocialPost {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  createdAt: Date;
  user?: User;
}

interface UsedGearProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  condition: "new" | "like_new" | "good" | "fair" | "poor";
  imageUrl?: string;
  seller: User;
  likes: number;
  createdAt: Date;
}

const SocialCommerceFeed: React.FC = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [products, setProducts] = useState<UsedGearProduct[]>([]);
  const [activeTab, setActiveTab] = useState<"social" | "marketplace">("social");
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

      setPosts((postsResponse.data as SocialPost[]) || []);
      setProducts((productsResponse.data as UsedGearProduct[]) || []);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const handleLike = async (collection: "socialPosts" | "usedGear", itemId: string) => {
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
        setPosts(prev => prev.map(post =>
          post.id === itemId ? { ...post, likes: post.likes + 1 } : post
        ));
      } else {
        setProducts(prev => prev.map(product =>
          product.id === itemId ? { ...product, likes: product.likes + 1 } : product
        ));
      }
    } catch (error) {
      }
  };

  const handleMessage = async (userId: string) => {
    try {
      await realApiService.create("messages", {
        recipientId: userId,
        content: "Hi! I saw your post and would like to connect.",
        type: "text"
      });
      alert("Message sent!");
    } catch (error) {
      alert("Failed to send message. Please try again.");
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Social Commerce Feed
        </h1>
        <p className="text-gray-600">
          Connect with the sports community and buy/sell used equipment
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("social")}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === "social"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Social Feed
          </button>
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === "marketplace"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Marketplace
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {activeTab === "social" && (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {post.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {post.user?.name || "Anonymous User"}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4">{post.content}</p>
                  {post.imageUrl && (
                    <div className="mb-4">
                      <img
                        src={post.imageUrl}
                        alt="Post content"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike("socialPosts", post.id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-red-500"
                    >
                      <span>❤️</span>
                      <span>{post.likes}</span>
                    </button>
                    <span className="text-gray-600">💬 {post.comments}</span>
                    <button
                      onClick={() => handleMessage(post.userId)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "marketplace" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              {product.imageUrl && (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Product Image</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    conditions.find(c => c.value === product.condition)?.color || "bg-gray-100 text-gray-800"
                  }`}>
                    {conditions.find(c => c.value === product.condition)?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-green-600">${product.price}</span>
                  <span className="text-sm text-gray-500">
                    by {product.seller.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleLike("usedGear", product.id)}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-500"
                  >
                    <span>❤️</span>
                    <span className="text-sm">{product.likes}</span>
                  </button>
                  <button
                    onClick={() => handleMessage(product.seller.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Contact Seller
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Community Stats */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{posts.length}</p>
            <p className="text-sm text-gray-600">Social Posts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{products.length}</p>
            <p className="text-sm text-gray-600">Items for Sale</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {posts.reduce((sum, post) => sum + post.likes, 0) + products.reduce((sum, product) => sum + product.likes, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Likes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {posts.reduce((sum, post) => sum + post.comments, 0)}
            </p>
            <p className="text-sm text-gray-600">Comments</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialCommerceFeed; 