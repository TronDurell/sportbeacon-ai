import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Wallet,
  ExternalLink,
  RefreshCw,
  Eye,
  Heart,
  Share2,
  CheckCircle,
  XCircle,
  Clock,
  GasPump,
  Hash,
  Copy
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';
import { ethers } from 'ethers';

interface NFTListing {
  listing_id: number;
  token_id: number;
  creator_wallet: string;
  name: string;
  description: string;
  supply: number;
  price: number;
  category: string;
  metadata_uri?: string;
  status: string;
  created_at: string;
  metadata?: {
    name: string;
    description: string;
    image_uri?: string;
    category: string;
    creator: string;
  };
  on_chain_data?: {
    creator: string;
    token_id: number;
    price: number;
    quantity: number;
    sold: number;
    active: boolean;
    available: number;
  };
}

interface PurchaseResult {
  success: boolean;
  transaction_hash?: string;
  gas_used?: string;
  gas_price?: string;
  total_cost?: string;
  error?: string;
  listing_id: number;
  quantity: number;
  total_price: string;
}

interface BuyModalProps {
  listing: NFTListing;
  onBuy: (quantity: number) => Promise<PurchaseResult>;
  isOpen: boolean;
  onClose: () => void;
}

const BuyModal: React.FC<BuyModalProps> = ({ listing, onBuy, isOpen, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [gasEstimate, setGasEstimate] = useState<string>('');
  const { address, isConnected } = useWallet();

  const maxQuantity = listing.on_chain_data?.available || listing.supply;
  const totalPrice = listing.price * quantity;

  // Estimate gas cost
  useEffect(() => {
    const estimateGas = async () => {
      try {
        // This would typically call a gas estimation endpoint
        const estimatedGas = '150000'; // Example gas limit
        const gasPrice = '20000000000'; // 20 gwei
        const gasCost = ethers.BigNumber.from(estimatedGas).mul(gasPrice);
        setGasEstimate(ethers.utils.formatEther(gasCost));
      } catch (error) {
        console.error('Failed to estimate gas:', error);
        setGasEstimate('0.003'); // Fallback estimate
      }
    };

    if (isOpen && isConnected) {
      estimateGas();
    }
  }, [isOpen, isConnected, quantity]);

  const handleBuy = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setPurchaseResult(null);
    
    try {
      const result = await onBuy(quantity);
      setPurchaseResult(result);
      
      if (result.success) {
        // Auto-close after 5 seconds on success
        setTimeout(() => {
          onClose();
          setPurchaseResult(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      setPurchaseResult({
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed. Please try again.',
        listing_id: listing.listing_id,
        quantity,
        total_price: totalPrice.toString()
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getBlockExplorerUrl = (txHash: string) => {
    return `https://mumbai.polygonscan.com/tx/${txHash}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase NFT</DialogTitle>
        </DialogHeader>
        
        {purchaseResult ? (
          // Purchase Result Display
          <div className="space-y-4">
            {purchaseResult.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Purchase successful! Your NFT has been minted.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {purchaseResult.error || 'Purchase failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {purchaseResult.success && purchaseResult.transaction_hash && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Transaction Hash:</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(purchaseResult.transaction_hash!)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs font-mono text-gray-600 break-all">
                  {purchaseResult.transaction_hash}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(getBlockExplorerUrl(purchaseResult.transaction_hash!), '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Block Explorer
                </Button>
              </div>
            )}

            {purchaseResult.success && purchaseResult.gas_used && (
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <GasPump className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Transaction Details:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Gas Used:</span>
                    <div className="font-mono">{purchaseResult.gas_used}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Gas Price:</span>
                    <div className="font-mono">{ethers.utils.formatUnits(purchaseResult.gas_price || '0', 'gwei')} gwei</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Cost:</span>
                    <div className="font-mono">{ethers.utils.formatEther(purchaseResult.total_cost || '0')} ETH</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={onClose}
                className="flex-1"
                variant={purchaseResult.success ? "outline" : "default"}
              >
                {purchaseResult.success ? 'Close' : 'Try Again'}
              </Button>
              {purchaseResult.success && (
                <Button
                  variant="outline"
                  onClick={() => window.open('/my-nfts', '_blank')}
                >
                  View My NFTs
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Purchase Form
          <div className="space-y-4">
            {/* NFT Preview */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                {listing.metadata?.image_uri ? (
                  <img 
                    src={listing.metadata.image_uri} 
                    alt={listing.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Eye className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">{listing.name}</h3>
                <p className="text-sm text-gray-600">{listing.description}</p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  min={1}
                  max={maxQuantity}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity}
                >
                  +
                </Button>
                <span className="text-sm text-gray-500">/ {maxQuantity}</span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span>Price per NFT:</span>
                <span>{ethers.utils.formatEther(listing.price.toString())} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span>{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{ethers.utils.formatEther(totalPrice.toString())} ETH</span>
              </div>
              {gasEstimate && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Estimated Gas:</span>
                  <span>~{gasEstimate} ETH</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total (estimated):</span>
                <span>
                  {gasEstimate 
                    ? `${(parseFloat(ethers.utils.formatEther(totalPrice.toString())) + parseFloat(gasEstimate)).toFixed(4)} ETH`
                    : `${ethers.utils.formatEther(totalPrice.toString())} ETH`
                  }
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={handleBuy}
                disabled={loading || !isConnected}
                className="flex-1"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Processing...' : 'Buy Now'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>Confirming transaction on blockchain...</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This may take a few moments. Please don't close this window.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const NFTMarketplace: React.FC = () => {
  const { address, isConnected, signMessage } = useWallet();
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<NFTListing | null>(null);
  const [buyModalOpen, setBuyModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [creatorFilter, setCreatorFilter] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/nft/listings', {
        params: {
          category: categoryFilter || undefined,
          min_price: priceRange.min ? ethers.utils.parseEther(priceRange.min).toString() : undefined,
          max_price: priceRange.max ? ethers.utils.parseEther(priceRange.max).toString() : undefined,
          limit: 50
        }
      });
      setListings(response.data.listings);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshListings = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchListings();
  }, [categoryFilter, priceRange.min, priceRange.max]);

  const handleBuy = async (quantity: number): Promise<PurchaseResult> => {
    if (!selectedListing || !address || !signMessage) {
      throw new Error('Missing required data for purchase');
    }

    // Calculate total price
    const totalPrice = selectedListing.price * quantity;
    
    // Create message for signature
    const message = `Buy NFT: Listing ${selectedListing.listing_id} - Quantity: ${quantity} - Total Price: ${totalPrice} wei`;
    
    // Sign message
    const signature = await signMessage(message);
    
    // Submit purchase
    const response = await api.post('/api/nft/buy', {
      listing_id: selectedListing.listing_id,
      quantity: quantity,
      buyer_wallet: address,
      signature: signature
    });

    // Refresh listings after purchase
    await refreshListings();
    
    // Return purchase result with transaction details
    return {
      success: true,
      transaction_hash: response.data.transaction_hash,
      gas_used: response.data.gas_used,
      gas_price: response.data.gas_price,
      total_cost: response.data.total_cost,
      listing_id: selectedListing.listing_id,
      quantity,
      total_price: totalPrice.toString()
    };
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCreator = !creatorFilter || 
                          listing.creator_wallet.toLowerCase().includes(creatorFilter.toLowerCase());
    
    return matchesSearch && matchesCreator;
  });

  const formatPrice = (price: number) => {
    return ethers.utils.formatEther(price.toString());
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">NFT Marketplace</h1>
          <p className="text-gray-600">Discover and collect unique NFTs from SportBeaconAI creators</p>
        </div>
        <Button onClick={refreshListings} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search NFTs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectContent>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="collectibles">Collectibles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Price (ETH)</label>
              <Input
                type="number"
                placeholder="0.01"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                step="0.01"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Price (ETH)</label>
              <Input
                type="number"
                placeholder="1.0"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Creator Filter */}
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Creator Wallet</label>
            <Input
              placeholder="Filter by creator wallet..."
              value={creatorFilter}
              onChange={(e) => setCreatorFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* NFT Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading NFTs...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {filteredListings.length} NFTs available
            </h2>
            {!isConnected && (
              <Badge variant="outline" className="text-orange-600">
                Connect wallet to purchase
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <Card key={listing.listing_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* NFT Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {listing.metadata?.image_uri ? (
                    <img
                      src={listing.metadata.image_uri}
                      alt={listing.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Eye className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                      {listing.status}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-2 left-2 space-x-1">
                    <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* NFT Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg truncate">{listing.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>
                    
                    {/* Creator */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Creator:</span>
                      <span className="text-xs font-mono">
                        {listing.creator_wallet.slice(0, 6)}...{listing.creator_wallet.slice(-4)}
                      </span>
                    </div>

                    {/* Price and Supply */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(listing.price)} ETH
                        </span>
                        <span className="text-xs text-gray-500 ml-1">per NFT</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {listing.on_chain_data?.available || listing.supply} available
                        </span>
                        <span className="text-xs text-gray-500 block">
                          of {listing.supply} total
                        </span>
                      </div>
                    </div>

                    {/* Category */}
                    <Badge variant="outline" className="text-xs">
                      {listing.category}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedListing(listing);
                        setBuyModalOpen(true);
                      }}
                      disabled={!isConnected || listing.status !== 'active'}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {isConnected ? 'Buy Now' : 'Connect Wallet'}
                    </Button>
                    
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredListings.length === 0 && (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No NFTs found</h3>
              <p className="text-gray-600">Try adjusting your filters or check back later for new listings.</p>
            </div>
          )}
        </div>
      )}

      {/* Buy Modal */}
      {selectedListing && (
        <BuyModal
          listing={selectedListing}
          onBuy={handleBuy}
          isOpen={buyModalOpen}
          onClose={() => {
            setBuyModalOpen(false);
            setSelectedListing(null);
          }}
        />
      )}
    </div>
  );
}; 