import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Clock, 
  Crown,
  Star,
  Users,
  Zap,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';

interface NFTAccess {
  address: string;
  token_id: number;
  has_access: boolean;
}

interface NFTMetadata {
  token_id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
  expiry?: number;
}

interface NFTAccessGateProps {
  requiredTokenId?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const NFT_METADATA: Record<number, NFTMetadata> = {
  1: {
    token_id: 1,
    name: 'Premium Coach Pass',
    description: 'Access to advanced coaching tools and analytics',
    icon: <Crown className="w-5 h-5" />,
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    benefits: [
      'Advanced player analytics',
      'Custom drill creation',
      'Priority support',
      'Exclusive content access'
    ]
  },
  2: {
    token_id: 2,
    name: 'Top Creator Badge',
    description: 'Recognition for outstanding content creation',
    icon: <Star className="w-5 h-5" />,
    color: 'bg-gradient-to-r from-purple-400 to-pink-500',
    benefits: [
      'Creator dashboard access',
      'Revenue sharing',
      'Community features',
      'Early feature access'
    ]
  },
  3: {
    token_id: 3,
    name: 'Community Moderator',
    description: 'Help moderate and grow the community',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-gradient-to-r from-blue-400 to-cyan-500',
    benefits: [
      'Moderation tools',
      'Community insights',
      'Special events access',
      'Recognition rewards'
    ]
  },
  4: {
    token_id: 4,
    name: 'Early Adopter',
    description: 'Special recognition for early platform supporters',
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-gradient-to-r from-green-400 to-emerald-500',
    benefits: [
      'Lifetime benefits',
      'Exclusive NFTs',
      'Founder status',
      'Special events'
    ]
  },
  5: {
    token_id: 5,
    name: 'Monthly Subscription',
    description: 'Premium features with monthly access',
    icon: <Clock className="w-5 h-5" />,
    color: 'bg-gradient-to-r from-indigo-400 to-purple-500',
    benefits: [
      'All premium features',
      'Monthly content updates',
      'Priority support',
      'Exclusive events'
    ]
  },
  6: {
    token_id: 6,
    name: 'Yearly Subscription',
    description: 'Premium features with yearly access',
    icon: <Clock className="w-5 h-5" />,
    color: 'bg-gradient-to-r from-red-400 to-pink-500',
    benefits: [
      'All premium features',
      'Yearly content updates',
      'Priority support',
      'Exclusive events',
      '20% discount'
    ]
  }
};

export const NFTAccessGate: React.FC<NFTAccessGateProps> = ({ 
  requiredTokenId, 
  children, 
  fallback,
  className 
}) => {
  const { address, isConnected } = useWallet();
  const [accessStatus, setAccessStatus] = useState<NFTAccess | null>(null);
  const [userNFTs, setUserNFTs] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const checkAccess = async (tokenId: number) => {
    if (!address) return false;
    
    try {
      const response = await api.get(`/api/nft/access/${address}?token_id=${tokenId}`);
      return response.data.has_access;
    } catch (error) {
      console.error('Failed to check NFT access:', error);
      return false;
    }
  };

  const fetchUserNFTs = async () => {
    if (!address) return;
    
    try {
      // Check access for all NFT types
      const accessChecks = await Promise.all(
        Object.keys(NFT_METADATA).map(async (tokenId) => {
          const hasAccess = await checkAccess(parseInt(tokenId));
          return hasAccess ? parseInt(tokenId) : null;
        })
      );
      
      const activeNFTs = accessChecks.filter(id => id !== null) as number[];
      setUserNFTs(activeNFTs);
    } catch (error) {
      console.error('Failed to fetch user NFTs:', error);
    }
  };

  const refreshAccess = async () => {
    if (!address || !requiredTokenId) return;
    
    setRefreshing(true);
    try {
      const hasAccess = await checkAccess(requiredTokenId);
      setAccessStatus({
        address,
        token_id: requiredTokenId,
        has_access: hasAccess
      });
      await fetchUserNFTs();
    } catch (error) {
      console.error('Failed to refresh access:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isConnected && address && requiredTokenId) {
      setLoading(true);
      checkAccess(requiredTokenId).then(hasAccess => {
        setAccessStatus({
          address,
          token_id: requiredTokenId,
          has_access: hasAccess
        });
        setLoading(false);
      });
      fetchUserNFTs();
    }
  }, [isConnected, address, requiredTokenId]);

  const hasRequiredAccess = accessStatus?.has_access || false;
  const requiredNFT = requiredTokenId ? NFT_METADATA[requiredTokenId] : null;

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Access Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Connect your wallet to access this content</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="ml-2">Checking access...</span>
        </CardContent>
      </Card>
    );
  }

  if (hasRequiredAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Access Required
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAccess}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Required NFT Display */}
        {requiredNFT && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${requiredNFT.color} text-white`}>
              <div className="flex items-center gap-3">
                {requiredNFT.icon}
                <div>
                  <h3 className="font-semibold">{requiredNFT.name}</h3>
                  <p className="text-sm opacity-90">{requiredNFT.description}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Benefits:</h4>
              <ul className="space-y-1">
                {requiredNFT.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* User's Current NFTs */}
        {userNFTs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Your Active NFTs:</h3>
            <div className="grid grid-cols-2 gap-2">
              {userNFTs.map((tokenId) => {
                const nft = NFT_METADATA[tokenId];
                return (
                  <div
                    key={tokenId}
                    className={`p-3 rounded-lg ${nft.color} text-white text-center`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {nft.icon}
                      <span className="text-xs font-medium">{nft.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Access Actions */}
        <div className="space-y-3 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              {requiredNFT 
                ? `You need ${requiredNFT.name} to access this content`
                : 'You need the required NFT to access this content'
              }
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => window.open('/nft-marketplace', '_blank')}>
              <Shield className="w-4 h-4 mr-2" />
              Get NFT Access
            </Button>
            <Button variant="outline" className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Marketplace
            </Button>
          </div>
        </div>

        {/* Subscription Options */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-sm font-medium">Subscription Options:</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Monthly Subscription</span>
                <Badge variant="outline">$9.99/month</Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Access all premium features with monthly billing
              </p>
              <Button size="sm" className="w-full">
                Subscribe Monthly
              </Button>
            </div>
            
            <div className="p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Yearly Subscription</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Best Value
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Access all premium features with 20% discount
              </p>
              <Button size="sm" className="w-full">
                Subscribe Yearly
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Standalone NFT Access Display Component
export const NFTAccessDisplay: React.FC<{ className?: string }> = ({ className }) => {
  const { address, isConnected } = useWallet();
  const [userNFTs, setUserNFTs] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      // Fetch user's NFTs (same logic as above)
      setLoading(false);
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Your NFT Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : userNFTs.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Lock className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No active NFTs</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {userNFTs.map((tokenId) => {
              const nft = NFT_METADATA[tokenId];
              return (
                <div
                  key={tokenId}
                  className={`p-3 rounded-lg ${nft.color} text-white text-center`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {nft.icon}
                    <span className="text-xs font-medium">{nft.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 