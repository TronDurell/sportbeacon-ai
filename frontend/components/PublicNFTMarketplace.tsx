import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Grid, 
  List,
  Heart,
  ShoppingCart,
  Eye,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Star,
  ExternalLink,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';
import web3Service from '@/services/web3Service';

interface PublicNFTListing {
  id: number;
  tokenId: number;
  title: string;
  description: string;
  price: string;
  price_formatted: string;
  creator: {
    address: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  metadata: {
    image_uri?: string;
    category: string;
    tags: string[];
    rarity?: string;
  };
  stats: {
    views: number;
    likes: number;
    sales: number;
    floor_price?: string;
  };
  status: 'active' | 'sold' | 'expired';
  created_at: string;
  updated_at: string;
}

interface CreatorProfile {
  address: string;
  name: string;
  avatar?: string;
  verified: boolean;
  bio?: string;
  stats: {
    total_nfts: number;
    total_sales: number;
    total_volume: string;
    followers: number;
    following: number;
  };
  social?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

export const PublicNFTMarketplace: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [listings, setListings] = useState<PublicNFTListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<PublicNFTListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);

  // Fetch public listings
  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/nft/listings');
      setListings(response.data.listings || []);
      setFilteredListings(response.data.listings || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchListings();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchListings();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...listings];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(listing => listing.metadata.category === categoryFilter);
    }

    // Price range filter
    if (priceRange !== 'all') {
      const price = parseFloat(listing.price_formatted);
      switch (priceRange) {
        case 'under-100':
          filtered = filtered.filter(listing => price < 100);
          break;
        case '100-500':
          filtered = filtered.filter(listing => price >= 100 && price <= 500);
          break;
        case '500-1000':
          filtered = filtered.filter(listing => price >= 500 && price <= 1000);
          break;
        case 'over-1000':
          filtered = filtered.filter(listing => price > 1000);
          break;
      }
    }

    // Verified creator filter
    if (showOnlyVerified) {
      filtered = filtered.filter(listing => listing.creator.verified);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price-low':
        filtered.sort((a, b) => parseFloat(a.price_formatted) - parseFloat(b.price_formatted));
        break;
      case 'price-high':
        filtered.sort((a, b) => parseFloat(b.price_formatted) - parseFloat(a.price_formatted));
        break;
      case 'popular':
        filtered.sort((a, b) => b.stats.views - a.stats.views);
        break;
      case 'trending':
        filtered.sort((a, b) => b.stats.likes - a.stats.likes);
        break;
    }

    setFilteredListings(filtered);
  }, [listings, searchQuery, categoryFilter, priceRange, sortBy, showOnlyVerified]);

  const fetchCreatorProfile = async (creatorAddress: string) => {
    try {
      const response = await api.get(`/api/creators/${creatorAddress}`);
      setSelectedCreator(response.data);
    } catch (error) {
      console.error('Failed to fetch creator profile:', error);
    }
  };

  const handleCreatorClick = (creator: PublicNFTListing['creator']) => {
    fetchCreatorProfile(creator.address);
  };

  const handlePurchase = async (listing: PublicNFTListing) => {
    if (!isConnected) {
      alert('Please connect your wallet to purchase NFTs');
      return;
    }

    try {
      // This would integrate with the purchase flow
      alert(`Purchase flow for ${listing.title} would be initiated here`);
    } catch (error) {
      console.error('Failed to initiate purchase:', error);
    }
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sports':
        return 'bg-blue-100 text-blue-800';
      case 'art':
        return 'bg-purple-100 text-purple-800';
      case 'collectibles':
        return 'bg-green-100 text-green-800';
      case 'gaming':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800';
      case 'epic':
        return 'bg-purple-100 text-purple-800';
      case 'rare':
        return 'bg-blue-100 text-blue-800';
      case 'common':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">NFT Marketplace</h1>
          <p className="text-gray-600">Discover and collect unique NFTs from talented creators</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search NFTs, creators, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="art">Art</SelectItem>
                <SelectItem value="collectibles">Collectibles</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Range */}
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-100">Under $100</SelectItem>
                <SelectItem value="100-500">$100 - $500</SelectItem>
                <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                <SelectItem value="over-1000">Over $1,000</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
              </SelectContent>
            </Select>

            {/* Verified Only */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="verified-only"
                checked={showOnlyVerified}
                onChange={(e) => setShowOnlyVerified(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="verified-only" className="text-sm">Verified Only</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredListings.length} NFT{filteredListings.length !== 1 ? 's' : ''} found
        </p>
        {!isConnected && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Wallet className="w-4 h-4" />
            <span>Connect wallet to purchase</span>
          </div>
        )}
      </div>

      {/* Listings Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Loading marketplace...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No NFTs Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* NFT Image */}
              <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 relative">
                {listing.metadata.image_uri ? (
                  <img
                    src={listing.metadata.image_uri}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Eye className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-3 left-3 space-y-2">
                  <Badge className={getCategoryColor(listing.metadata.category)}>
                    {listing.metadata.category}
                  </Badge>
                  {listing.metadata.rarity && (
                    <Badge className={getRarityColor(listing.metadata.rarity)}>
                      {listing.metadata.rarity}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="absolute top-3 right-3 space-y-2">
                  <div className="flex items-center gap-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    <Eye className="w-3 h-3" />
                    {listing.stats.views}
                  </div>
                  <div className="flex items-center gap-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    <Heart className="w-3 h-3" />
                    {listing.stats.likes}
                  </div>
                </div>

                {/* Price */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-black bg-opacity-75 text-white p-3 rounded-lg">
                    <div className="text-lg font-bold">{formatPrice(listing.price_formatted)}</div>
                    <div className="text-xs opacity-75">Current Price</div>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Title and Creator */}
                <div className="mb-3">
                  <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{listing.description}</p>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {listing.creator.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCreatorClick(listing.creator)}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {listing.creator.name}
                    </button>
                    {listing.creator.verified && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {listing.metadata.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {listing.metadata.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{listing.metadata.tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCreatorClick(listing.creator)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Creator
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePurchase(listing)}
                    disabled={!isConnected}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isConnected ? 'Buy Now' : 'Connect'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Creator Profile Modal */}
      {selectedCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedCreator.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{selectedCreator.name}</span>
                      {selectedCreator.verified && (
                        <Badge variant="secondary">
                          <Star className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {web3Service.formatAddress(selectedCreator.address)}
                    </p>
                  </div>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCreator(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bio */}
              {selectedCreator.bio && (
                <div>
                  <h3 className="font-medium mb-2">Bio</h3>
                  <p className="text-gray-600">{selectedCreator.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedCreator.stats.total_nfts}</div>
                  <div className="text-sm text-gray-600">NFTs Created</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedCreator.stats.total_sales}</div>
                  <div className="text-sm text-gray-600">Total Sales</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formatPrice(selectedCreator.stats.total_volume)}</div>
                  <div className="text-sm text-gray-600">Total Volume</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{selectedCreator.stats.followers}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
              </div>

              {/* Social Links */}
              {selectedCreator.social && (
                <div>
                  <h3 className="font-medium mb-2">Social Links</h3>
                  <div className="flex gap-2">
                    {selectedCreator.social.twitter && (
                      <Button variant="outline" size="sm" onClick={() => window.open(selectedCreator.social!.twitter, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Twitter
                      </Button>
                    )}
                    {selectedCreator.social.instagram && (
                      <Button variant="outline" size="sm" onClick={() => window.open(selectedCreator.social!.instagram, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Instagram
                      </Button>
                    )}
                    {selectedCreator.social.website && (
                      <Button variant="outline" size="sm" onClick={() => window.open(selectedCreator.social!.website, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Website
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Creator's NFTs */}
              <div>
                <h3 className="font-medium mb-4">Creator's NFTs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {listings
                    .filter(listing => listing.creator.address === selectedCreator.address)
                    .slice(0, 6)
                    .map((listing) => (
                      <Card key={listing.id} className="overflow-hidden">
                        <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600">
                          {listing.metadata.image_uri && (
                            <img
                              src={listing.metadata.image_uri}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <CardContent className="p-3">
                          <h4 className="font-medium text-sm mb-1">{listing.title}</h4>
                          <p className="text-lg font-bold text-blue-600">{formatPrice(listing.price_formatted)}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 