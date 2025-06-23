import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lock, 
  Unlock, 
  Crown, 
  Star, 
  Gift, 
  Video, 
  FileText, 
  Users,
  Clock,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Trophy,
  Shield,
  Eye,
  Play,
  Download
} from 'lucide-react';
import { useNFTUtility, NFTUtility } from '@/hooks/useNFTUtility';
import { useWallet } from '@/hooks/useWallet';

interface NFTUtilityPanelProps {
  className?: string;
}

export const NFTUtilityPanel: React.FC<NFTUtilityPanelProps> = ({ className }) => {
  const { address, isConnected } = useWallet();
  const {
    utilities,
    userAccess,
    nftOwnership,
    loading,
    error,
    unlockUtility,
    useUtility,
    getAvailableUtilities,
    getUnlockedUtilities,
    hasAccessToUtility,
    getUtilityUsageStats,
    clearError
  } = useNFTUtility();

  const [activeTab, setActiveTab] = useState('available');
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [using, setUsing] = useState<string | null>(null);

  const availableUtilities = getAvailableUtilities();
  const unlockedUtilities = getUnlockedUtilities();

  const handleUnlockUtility = async (utilityId: string) => {
    setUnlocking(utilityId);
    try {
      const success = await unlockUtility(utilityId);
      if (success) {
        // Success feedback handled by the hook
      }
    } finally {
      setUnlocking(null);
    }
  };

  const handleUseUtility = async (utilityId: string) => {
    setUsing(utilityId);
    try {
      const success = await useUtility(utilityId);
      if (success) {
        // Success feedback handled by the hook
      }
    } finally {
      setUsing(null);
    }
  };

  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'content':
        return <Video className="w-5 h-5" />;
      case 'perk':
        return <Gift className="w-5 h-5" />;
      case 'access':
        return <Shield className="w-5 h-5" />;
      case 'reward':
        return <Trophy className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite':
        return 'bg-yellow-100 text-yellow-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'elite':
        return <Crown className="w-4 h-4" />;
      case 'premium':
        return <Star className="w-4 h-4" />;
      case 'basic':
        return <Shield className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const renderUtilityCard = (utility: NFTUtility, isUnlocked: boolean = false) => {
    const usageStats = getUtilityUsageStats(utility.id);
    const isUnlocking = unlocking === utility.id;
    const isUsing = using === utility.id;
    const hasAccess = isUnlocked || hasAccessToUtility(utility.id);

    return (
      <Card key={utility.id} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                {getUtilityIcon(utility.type)}
              </div>
              <div>
                <CardTitle className="text-lg">{utility.name}</CardTitle>
                <p className="text-sm text-gray-600">{utility.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {utility.requiredTier && (
                <Badge className={getTierColor(utility.requiredTier)}>
                  {getTierIcon(utility.requiredTier)}
                  <span className="ml-1">{utility.requiredTier}</span>
                </Badge>
              )}
              {hasAccess ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Unlocked
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Lock className="w-4 h-4 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Requirements */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Requirements:</h4>
            <div className="flex flex-wrap gap-2">
              {utility.requiredNFTs.map((contract, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  NFT Contract: {contract.slice(0, 6)}...{contract.slice(-4)}
                </Badge>
              ))}
              {utility.requiredBalance && (
                <Badge variant="outline" className="text-xs">
                  Min Balance: {utility.requiredBalance}
                </Badge>
              )}
              {utility.requiredTokenIds && utility.requiredTokenIds.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Token IDs: {utility.requiredTokenIds.join(', ')}
                </Badge>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          {usageStats && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Usage:</h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Used: {usageStats.usageCount} times</span>
                {usageStats.maxUsage && (
                  <span>Max: {usageStats.maxUsage} times</span>
                )}
                {usageStats.lastUsedAt && (
                  <span>Last: {new Date(usageStats.lastUsedAt).toLocaleDateString()}</span>
                )}
                {usageStats.expiresAt && (
                  <span className={usageStats.isExpired ? 'text-red-600' : ''}>
                    Expires: {new Date(usageStats.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            {!hasAccess ? (
              <Button
                onClick={() => handleUnlockUtility(utility.id)}
                disabled={isUnlocking || !isConnected}
                className="flex-1"
                variant="default"
              >
                {isUnlocking ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4 mr-2" />
                )}
                {isUnlocking ? 'Unlocking...' : 'Unlock Utility'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => handleUseUtility(utility.id)}
                  disabled={isUsing || usageStats?.isExpired}
                  className="flex-1"
                  variant="default"
                >
                  {isUsing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isUsing ? 'Using...' : 'Use Utility'}
                </Button>
                {utility.metadata?.contentUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(utility.metadata!.contentUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            NFT Utilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600">Connect your wallet to access NFT-gated utilities and perks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">NFT Utilities</h2>
          <p className="text-gray-600">Unlock exclusive content and perks with your NFTs</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Shield className="w-4 h-4 mr-1" />
            {nftOwnership.length} NFT Collections
          </Badge>
        </div>
      </div>

      {/* NFT Ownership Summary */}
      {nftOwnership.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Your NFT Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nftOwnership.map((ownership, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Collection {index + 1}</span>
                    <Badge className={getTierColor(ownership.tier)}>
                      {getTierIcon(ownership.tier)}
                      <span className="ml-1">{ownership.tier}</span>
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Balance: {ownership.balance} NFTs</div>
                    <div>Token IDs: {ownership.tokenIds.slice(0, 3).join(', ')}{ownership.tokenIds.length > 3 ? '...' : ''}</div>
                    <div className="text-xs text-gray-500">
                      Updated: {new Date(ownership.lastUpdated).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Utilities Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Available ({availableUtilities.length})</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked ({unlockedUtilities.length})</TabsTrigger>
          <TabsTrigger value="all">All Utilities ({utilities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
              <p className="mt-2 text-gray-600">Loading available utilities...</p>
            </div>
          ) : availableUtilities.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Lock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Utilities</h3>
                <p className="text-gray-600">You don't meet the requirements for any utilities yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {availableUtilities.map(utility => renderUtilityCard(utility))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unlocked" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
              <p className="mt-2 text-gray-600">Loading unlocked utilities...</p>
            </div>
          ) : unlockedUtilities.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Unlock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Unlocked Utilities</h3>
                <p className="text-gray-600">Unlock utilities to see them here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {unlockedUtilities.map(access => {
                const utility = utilities.find(u => u.id === access.utilityId);
                return utility ? renderUtilityCard(utility, true) : null;
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
              <p className="mt-2 text-gray-600">Loading all utilities...</p>
            </div>
          ) : utilities.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Utilities Available</h3>
                <p className="text-gray-600">No utilities have been created yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {utilities.map(utility => renderUtilityCard(utility, hasAccessToUtility(utility.id)))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 