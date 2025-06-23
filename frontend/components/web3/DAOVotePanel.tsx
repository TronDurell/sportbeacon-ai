import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Vote, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Wallet,
  BarChart3,
  Calendar,
  Award,
  Zap
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';
import web3Service from '@/services/web3Service';

interface DAOProposal {
  id: number;
  title: string;
  description: string;
  creator: string;
  startTime: number;
  endTime: number;
  status: 'active' | 'pending' | 'executed' | 'defeated' | 'expired';
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  totalVotes: string;
  quorum: string;
  executed: boolean;
  metadata?: {
    ipfsHash?: string;
    category?: string;
    tags?: string[];
  };
}

interface UserVote {
  proposalId: number;
  support: 'for' | 'against' | 'abstain';
  weight: string;
  reason?: string;
  timestamp: number;
  txHash?: string;
}

interface VotingPower {
  balance: string;
  delegated: string;
  totalPower: string;
  lastUpdated: number;
}

export const DAOVotePanel: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [votingPower, setVotingPower] = useState<VotingPower | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedProposal, setSelectedProposal] = useState<DAOProposal | null>(null);
  const [voting, setVoting] = useState(false);

  // Fetch proposals and voting data
  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/dao/proposals');
      setProposals(response.data.proposals || []);
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    if (!address) return;
    
    try {
      const response = await api.get(`/api/dao/votes/${address}`);
      setUserVotes(response.data.votes || []);
    } catch (error) {
      console.error('Failed to fetch user votes:', error);
    }
  };

  const fetchVotingPower = async () => {
    if (!address) return;
    
    try {
      // Initialize Web3 service
      const initialized = await web3Service.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Web3 connection');
      }

      // Get voting power from blockchain
      const power = await web3Service.getVotingPower(address);
      const balance = await web3Service.getTokenBalance(address);
      
      setVotingPower({
        balance: web3Service.formatEther(balance),
        delegated: '0', // Would come from delegation contract
        totalPower: web3Service.formatEther(power),
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Failed to fetch voting power:', error);
      // Fallback to API
      try {
        const response = await api.get(`/api/dao/voting-power/${address}`);
        setVotingPower(response.data);
      } catch (apiError) {
        console.error('API fallback also failed:', apiError);
      }
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchProposals(), fetchUserVotes(), fetchVotingPower()]);
    setRefreshing(false);
  };

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      fetchProposals();
      fetchUserVotes();
      fetchVotingPower();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isConnected, address]);

  // Initial fetch
  useEffect(() => {
    if (isConnected && address) {
      fetchProposals();
      fetchUserVotes();
      fetchVotingPower();
    }
  }, [isConnected, address]);

  const castVote = async (proposalId: number, support: 'for' | 'against' | 'abstain', reason?: string) => {
    if (!address || !votingPower) return;

    try {
      setVoting(true);

      // First try blockchain vote
      try {
        const initialized = await web3Service.initialize();
        if (initialized) {
          const tx = await web3Service.castVote(proposalId, support, reason);
          
          // Add vote to local state
          const newVote: UserVote = {
            proposalId,
            support,
            weight: votingPower.totalPower,
            reason,
            timestamp: Date.now(),
            txHash: tx.transactionHash
          };
          
          setUserVotes(prev => [...prev.filter(v => v.proposalId !== proposalId), newVote]);
          
          // Refresh data after successful vote
          setTimeout(() => {
            fetchProposals();
            fetchUserVotes();
          }, 2000);
          
          return;
        }
      } catch (blockchainError) {
        console.log('Blockchain vote failed, trying API fallback:', blockchainError);
      }

      // Fallback to API vote
      const response = await api.post('/api/dao/vote', {
        proposalId,
        support,
        reason,
        address,
        weight: votingPower.totalPower
      });

      // Add vote to local state
      const newVote: UserVote = {
        proposalId,
        support,
        weight: votingPower.totalPower,
        reason,
        timestamp: Date.now(),
        txHash: response.data.tx_hash
      };
      
      setUserVotes(prev => [...prev.filter(v => v.proposalId !== proposalId), newVote]);

      // Refresh data after successful vote
      setTimeout(() => {
        fetchProposals();
        fetchUserVotes();
      }, 2000);

    } catch (error) {
      console.error('Failed to cast vote:', error);
      alert('Failed to cast vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const getProposalStatus = (proposal: DAOProposal) => {
    const now = Date.now() / 1000;
    
    if (proposal.executed) return 'executed';
    if (now < proposal.startTime) return 'pending';
    if (now > proposal.endTime) {
      const forVotes = parseFloat(web3Service.formatEther(proposal.forVotes));
      const againstVotes = parseFloat(web3Service.formatEther(proposal.againstVotes));
      const quorum = parseFloat(web3Service.formatEther(proposal.quorum));
      const totalVotes = parseFloat(web3Service.formatEther(proposal.totalVotes));
      
      if (totalVotes < quorum) return 'expired';
      return forVotes > againstVotes ? 'executed' : 'defeated';
    }
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'executed':
        return 'bg-blue-100 text-blue-800';
      case 'defeated':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Vote className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'executed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'defeated':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUserVote = (proposalId: number) => {
    return userVotes.find(vote => vote.proposalId === proposalId);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBlockExplorerUrl = (txHash: string) => {
    return web3Service.getExplorerUrl(txHash);
  };

  const filteredProposals = proposals.filter(proposal => {
    const status = getProposalStatus(proposal);
    if (activeTab === 'active') return status === 'active';
    if (activeTab === 'pending') return status === 'pending';
    if (activeTab === 'executed') return status === 'executed';
    if (activeTab === 'defeated') return status === 'defeated';
    return true;
  });

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="w-5 h-5" />
            DAO Governance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Connect your wallet to participate in DAO governance</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">DAO Governance</h2>
          <p className="text-gray-600">Participate in community governance and voting</p>
        </div>
        <Button onClick={refreshData} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Voting Power Card */}
      {votingPower && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Your Voting Power
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600">BEACON Balance</div>
                <div className="text-2xl font-bold text-blue-900">
                  {parseFloat(votingPower.balance).toFixed(2)} BEACON
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600">Voting Power</div>
                <div className="text-2xl font-bold text-green-900">
                  {parseFloat(votingPower.totalPower).toFixed(2)} Votes
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600">Delegated</div>
                <div className="text-2xl font-bold text-purple-900">
                  {parseFloat(votingPower.delegated).toFixed(2)} Votes
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Last updated: {new Date(votingPower.lastUpdated).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposals Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="executed">Executed</TabsTrigger>
          <TabsTrigger value="defeated">Defeated</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
              <p className="mt-2 text-gray-600">Loading proposals...</p>
            </div>
          ) : filteredProposals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Vote className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Proposals</h3>
                <p className="text-gray-600">No proposals match the current filter</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredProposals.map((proposal) => {
                const status = getProposalStatus(proposal);
                const userVote = getUserVote(proposal.id);
                const forVotes = parseFloat(web3Service.formatEther(proposal.forVotes));
                const againstVotes = parseFloat(web3Service.formatEther(proposal.againstVotes));
                const totalVotes = parseFloat(web3Service.formatEther(proposal.totalVotes));
                const quorum = parseFloat(web3Service.formatEther(proposal.quorum));
                const participation = totalVotes > 0 ? (totalVotes / quorum) * 100 : 0;
                const forPercentage = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
                const againstPercentage = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;

                return (
                  <Card key={proposal.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{proposal.title}</CardTitle>
                            <Badge className={getStatusColor(status)}>
                              {getStatusIcon(status)}
                              <span className="ml-1">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{proposal.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Created by: {web3Service.formatAddress(proposal.creator)}</span>
                            <span>Start: {formatDate(proposal.startTime)}</span>
                            <span>End: {formatDate(proposal.endTime)}</span>
                          </div>
                        </div>
                        {userVote && (
                          <div className="text-right">
                            <Badge variant={userVote.support === 'for' ? 'default' : 'secondary'}>
                              Voted {userVote.support}
                            </Badge>
                            {userVote.txHash && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(getBlockExplorerUrl(userVote.txHash!), '_blank')}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Voting Results */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Participation</span>
                          <span>{participation.toFixed(1)}% ({totalVotes.toFixed(2)} / {quorum.toFixed(2)} votes)</span>
                        </div>
                        <Progress value={participation} className="h-2" />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-600">For</span>
                              <span>{forVotes.toFixed(2)} ({forPercentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={forPercentage} className="h-2 bg-green-100" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-red-600">Against</span>
                              <span>{againstVotes.toFixed(2)} ({againstPercentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={againstPercentage} className="h-2 bg-red-100" />
                          </div>
                        </div>
                      </div>

                      {/* Voting Actions */}
                      {status === 'active' && !userVote && votingPower && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => castVote(proposal.id, 'for')}
                            disabled={voting}
                            className="flex-1"
                            variant="default"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Vote For
                          </Button>
                          <Button
                            onClick={() => castVote(proposal.id, 'against')}
                            disabled={voting}
                            className="flex-1"
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Vote Against
                          </Button>
                          <Button
                            onClick={() => castVote(proposal.id, 'abstain')}
                            disabled={voting}
                            className="flex-1"
                            variant="outline"
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Abstain
                          </Button>
                        </div>
                      )}

                      {userVote && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">
                            You voted <strong>{userVote.support}</strong> with {userVote.weight} voting power
                            {userVote.reason && (
                              <span className="block mt-1">Reason: {userVote.reason}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 