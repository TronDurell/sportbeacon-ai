import { ethers } from 'ethers';
import {
  CONTRACT_CONFIG,
  BEACON_TOKEN_ABI,
  BEACON_NFT_ABI,
  BEACON_MARKETPLACE_ABI,
  BEACON_DAO_ABI,
  BEACON_REVENUE_SHARE_ABI,
  createContractInstance,
  estimateGas,
  sendTransaction,
  isValidAddress,
  validateNetwork
} from '@/lib/contractConfig';

export interface ContractInstances {
  beaconToken: ethers.Contract | null;
  beaconNFT: ethers.Contract | null;
  beaconMarketplace: ethers.Contract | null;
  beaconDAO: ethers.Contract | null;
  beaconRevenueShare: ethers.Contract | null;
}

export interface NFTOwnership {
  tokenId: number;
  balance: string;
  hasActiveAccess: boolean;
  expiry?: number;
}

export interface RewardInfo {
  balance: string;
  totalClaimed: string;
  lastClaim: number;
  rewardsBalance: string;
}

export interface MarketplaceListing {
  listingId: number;
  creator: string;
  tokenId: number;
  price: string;
  quantity: number;
  sold: number;
  active: boolean;
  metadata: string;
  createdAt: number;
  updatedAt: number;
}

class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contracts: ContractInstances = {
    beaconToken: null,
    beaconNFT: null,
    beaconMarketplace: null,
    beaconDAO: null,
    beaconRevenueShare: null
  };

  // Initialize Web3 connection
  async initialize(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not found');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();

      // Validate network
      const isCorrectNetwork = await validateNetwork();
      if (!isCorrectNetwork) {
        throw new Error(`Please switch to ${CONTRACT_CONFIG.NETWORK.NAME}`);
      }

      // Initialize contracts
      await this.initializeContracts();

      return true;
    } catch (error) {
      console.error('Web3 initialization failed:', error);
      return false;
    }
  }

  // Initialize contract instances
  private async initializeContracts(): Promise<void> {
    if (!this.signer) return;

    this.contracts.beaconToken = createContractInstance(
      CONTRACT_CONFIG.ADDRESSES.BEACON_TOKEN,
      BEACON_TOKEN_ABI,
      this.signer
    );

    this.contracts.beaconNFT = createContractInstance(
      CONTRACT_CONFIG.ADDRESSES.BEACON_NFT,
      BEACON_NFT_ABI,
      this.signer
    );

    this.contracts.beaconMarketplace = createContractInstance(
      CONTRACT_CONFIG.ADDRESSES.BEACON_MARKETPLACE,
      BEACON_MARKETPLACE_ABI,
      this.signer
    );

    this.contracts.beaconDAO = createContractInstance(
      CONTRACT_CONFIG.ADDRESSES.BEACON_DAO,
      BEACON_DAO_ABI,
      this.signer
    );

    this.contracts.beaconRevenueShare = createContractInstance(
      CONTRACT_CONFIG.ADDRESSES.BEACON_REVENUE_SHARE,
      BEACON_REVENUE_SHARE_ABI,
      this.signer
    );
  }

  // Get current account
  async getCurrentAccount(): Promise<string | null> {
    try {
      if (!this.signer) return null;
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to get current account:', error);
      return null;
    }
  }

  // NFT Ownership Verification
  async verifyNFTOwnership(address: string, tokenId: number): Promise<NFTOwnership> {
    try {
      if (!this.contracts.beaconNFT) {
        throw new Error('BeaconNFT contract not initialized');
      }

      const balance = await this.contracts.beaconNFT.balanceOf(address, tokenId);
      const hasActiveAccess = await this.contracts.beaconNFT.hasActiveAccess(address, tokenId);
      const expiry = await this.contracts.beaconNFT.getTokenExpiry(address, tokenId);

      return {
        tokenId,
        balance: balance.toString(),
        hasActiveAccess,
        expiry: expiry.toNumber()
      };
    } catch (error) {
      console.error('NFT ownership verification failed:', error);
      throw error;
    }
  }

  // Get all active NFTs for a user
  async getUserActiveNFTs(address: string): Promise<NFTOwnership[]> {
    try {
      if (!this.contracts.beaconNFT) {
        throw new Error('BeaconNFT contract not initialized');
      }

      const activeTokenIds = await this.contracts.beaconNFT.getActiveTokens(address);
      const nftOwnerships: NFTOwnership[] = [];

      for (const tokenId of activeTokenIds) {
        if (tokenId.toNumber() > 0) {
          const ownership = await this.verifyNFTOwnership(address, tokenId.toNumber());
          nftOwnerships.push(ownership);
        }
      }

      return nftOwnerships;
    } catch (error) {
      console.error('Failed to get user active NFTs:', error);
      throw error;
    }
  }

  // Get NFT ownership with transaction details
  async getNFTOwnership(address: string): Promise<Array<NFTOwnership & { txHash?: string; purchaseDate?: string }>> {
    try {
      if (!this.contracts.beaconNFT) {
        throw new Error('BeaconNFT contract not initialized');
      }

      const activeTokenIds = await this.contracts.beaconNFT.getActiveTokens(address);
      const nftOwnerships: Array<NFTOwnership & { txHash?: string; purchaseDate?: string }> = [];

      for (const tokenId of activeTokenIds) {
        if (tokenId.toNumber() > 0) {
          const ownership = await this.verifyNFTOwnership(address, tokenId.toNumber());
          
          // Try to get transaction details (this would require additional contract methods or event logs)
          // For now, we'll simulate this data
          const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
          const mockPurchaseDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
          
          nftOwnerships.push({
            ...ownership,
            txHash: mockTxHash,
            purchaseDate: mockPurchaseDate
          });
        }
      }

      return nftOwnerships;
    } catch (error) {
      console.error('Failed to get NFT ownership:', error);
      throw error;
    }
  }

  // NFT Utility Verification Methods
  async getNFTOwnership(address: string): Promise<Array<{
    contractAddress: string;
    tokenIds: number[];
    balance: number;
    tier: 'basic' | 'premium' | 'elite';
  }>> {
    try {
      if (!this.contracts.beaconNFT) {
        throw new Error('BeaconNFT contract not initialized');
      }

      const activeTokenIds = await this.contracts.beaconNFT.getActiveTokens(address);
      const nftOwnerships: Array<{
        contractAddress: string;
        tokenIds: number[];
        balance: number;
        tier: 'basic' | 'premium' | 'elite';
      }> = [];

      // Get BEACON NFT ownership
      if (activeTokenIds.length > 0) {
        const tokenIds = activeTokenIds.map(id => id.toNumber()).filter(id => id > 0);
        const balance = activeTokenIds.length;
        
        // Determine tier based on active access
        let tier: 'basic' | 'premium' | 'elite' = 'basic';
        for (const tokenId of tokenIds) {
          const hasActiveAccess = await this.contracts.beaconNFT.hasActiveAccess(address, tokenId);
          if (hasActiveAccess) {
            tier = 'premium';
            break;
          }
        }

        nftOwnerships.push({
          contractAddress: CONTRACT_CONFIG.ADDRESSES.BEACON_NFT,
          tokenIds,
          balance,
          tier
        });
      }

      return nftOwnerships;
    } catch (error) {
      console.error('Failed to get NFT ownership:', error);
      throw error;
    }
  }

  // BEACON Token Functions
  async getTokenBalance(address: string): Promise<string> {
    try {
      if (!this.contracts.beaconToken) {
        throw new Error('BeaconToken contract not initialized');
      }

      const balance = await this.contracts.beaconToken.balanceOf(address);
      return this.formatEther(balance.toString());
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }

  async getRewardInfo(address: string): Promise<RewardInfo> {
    try {
      if (!this.contracts.beaconToken) {
        throw new Error('BeaconToken contract not initialized');
      }

      const [totalClaimed, lastClaim, rewardsBalance] = await Promise.all([
        this.contracts.beaconToken.getTotalRewardsClaimed(address),
        this.contracts.beaconToken.getLastRewardClaim(address),
        this.contracts.beaconToken.getRewardsBalance()
      ]);

      return {
        totalClaimed: totalClaimed.toString(),
        lastClaim: lastClaim.toNumber(),
        rewardsBalance: rewardsBalance.toString(),
        balance: await this.getTokenBalance(address)
      };
    } catch (error) {
      console.error('Failed to get reward info:', error);
      throw error;
    }
  }

  // Claim BEACON rewards (backend will handle this)
  async claimRewards(amount: string, reason: string): Promise<ethers.ContractReceipt> {
    try {
      if (!this.contracts.beaconToken) {
        throw new Error('BeaconToken contract not initialized');
      }

      const currentAccount = await this.getCurrentAccount();
      if (!currentAccount) {
        throw new Error('No account connected');
      }

      // This would typically be called by the backend with admin privileges
      // For frontend, we'll simulate the claim process
      const tx = await sendTransaction(
        this.contracts.beaconToken,
        'issueRewards',
        [currentAccount, ethers.utils.parseEther(amount), reason]
      );

      return tx;
    } catch (error) {
      console.error('Failed to claim rewards:', error);
      throw error;
    }
  }

  // Marketplace Functions
  async getCreatorListings(creatorAddress: string): Promise<MarketplaceListing[]> {
    try {
      if (!this.contracts.beaconMarketplace) {
        throw new Error('BeaconMarketplace contract not initialized');
      }

      const listingIds = await this.contracts.beaconMarketplace.getCreatorListings(creatorAddress);
      const listings: MarketplaceListing[] = [];

      for (const listingId of listingIds) {
        const listing = await this.contracts.beaconMarketplace.getListing(listingId);
        listings.push({
          listingId: listing.listingId.toNumber(),
          creator: listing.creator,
          tokenId: listing.tokenId.toNumber(),
          price: listing.price.toString(),
          quantity: listing.quantity.toNumber(),
          sold: listing.sold.toNumber(),
          active: listing.active,
          metadata: listing.metadata,
          createdAt: listing.createdAt.toNumber(),
          updatedAt: listing.updatedAt.toNumber()
        });
      }

      return listings;
    } catch (error) {
      console.error('Failed to get creator listings:', error);
      throw error;
    }
  }

  async getListing(listingId: number): Promise<MarketplaceListing> {
    try {
      if (!this.contracts.beaconMarketplace) {
        throw new Error('BeaconMarketplace contract not initialized');
      }

      const listing = await this.contracts.beaconMarketplace.getListing(listingId);
      return {
        listingId: listing.listingId.toNumber(),
        creator: listing.creator,
        tokenId: listing.tokenId.toNumber(),
        price: listing.price.toString(),
        quantity: listing.quantity.toNumber(),
        sold: listing.sold.toNumber(),
        active: listing.active,
        metadata: listing.metadata,
        createdAt: listing.createdAt.toNumber(),
        updatedAt: listing.updatedAt.toNumber()
      };
    } catch (error) {
      console.error('Failed to get listing:', error);
      throw error;
    }
  }

  async buyNFT(listingId: number, quantity: number, price: string): Promise<ethers.ContractReceipt> {
    try {
      if (!this.contracts.beaconMarketplace) {
        throw new Error('BeaconMarketplace contract not initialized');
      }

      const tx = await sendTransaction(
        this.contracts.beaconMarketplace,
        'buyNFT',
        [listingId, quantity],
        { value: ethers.utils.parseEther(price) }
      );

      return tx;
    } catch (error) {
      console.error('Failed to buy NFT:', error);
      throw error;
    }
  }

  // DAO Functions
  async getVotingPower(address: string): Promise<string> {
    try {
      if (!this.contracts.beaconDAO) {
        throw new Error('BeaconDAO contract not initialized');
      }

      const votingPower = await this.contracts.beaconDAO.getVotingPower(address);
      return votingPower.toString();
    } catch (error) {
      console.error('Failed to get voting power:', error);
      throw error;
    }
  }

  // Cast a vote on a DAO proposal
  async castVote(proposalId: number, support: 'for' | 'against' | 'abstain', reason?: string): Promise<ethers.ContractReceipt> {
    try {
      if (!this.contracts.beaconDAO || !this.signer) {
        throw new Error('BeaconDAO contract or signer not initialized');
      }

      // Convert support string to number (0 = against, 1 = for, 2 = abstain)
      const supportValue = support === 'for' ? 1 : support === 'against' ? 0 : 2;

      // Estimate gas for the transaction
      const gasEstimate = await this.estimateGasForTransaction(
        this.contracts.beaconDAO,
        'castVote',
        [proposalId, supportValue, reason || '']
      );

      // Execute the vote transaction
      const tx = await this.contracts.beaconDAO.castVote(
        proposalId,
        supportValue,
        reason || '',
        { gasLimit: gasEstimate }
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to cast vote:', error);
      throw error;
    }
  }

  // Check if user can propose (has enough voting power)
  async canPropose(address: string): Promise<boolean> {
    try {
      if (!this.contracts.beaconDAO) {
        throw new Error('BeaconDAO contract not initialized');
      }

      const canPropose = await this.contracts.beaconDAO.canPropose(address);
      return canPropose;
    } catch (error) {
      console.error('Failed to check proposal eligibility:', error);
      throw error;
    }
  }

  // Gas Estimation
  async estimateGasForTransaction(
    contract: ethers.Contract,
    method: string,
    params: any[] = []
  ): Promise<string> {
    try {
      return await estimateGas(contract, method, params);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return CONTRACT_CONFIG.GAS.LIMIT.toString();
    }
  }

  // Network Management
  async switchToCorrectNetwork(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        return false;
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CONTRACT_CONFIG.NETWORK.CHAIN_ID.toString(16)}` }]
      });

      return true;
    } catch (error) {
      console.error('Failed to switch network:', error);
      return false;
    }
  }

  // Event Listeners
  setupEventListeners(): void {
    if (typeof window === 'undefined' || !window.ethereum) return;

    window.ethereum.on('accountsChanged', async (accounts: string[]) => {
      console.log('Account changed:', accounts[0]);
      // Re-initialize contracts with new account
      await this.initializeContracts();
    });

    window.ethereum.on('chainChanged', async (chainId: string) => {
      console.log('Chain changed:', chainId);
      // Validate network and re-initialize if needed
      const isCorrectNetwork = await validateNetwork();
      if (!isCorrectNetwork) {
        console.warn('Please switch to the correct network');
      }
    });
  }

  // Utility Functions
  formatEther(wei: string): string {
    return ethers.utils.formatEther(wei);
  }

  parseEther(ether: string): string {
    return ethers.utils.parseEther(ether).toString();
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  getExplorerUrl(txHash: string): string {
    return `${CONTRACT_CONFIG.NETWORK.EXPLORER_URL}/tx/${txHash}`;
  }

  // Cleanup
  cleanup(): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.removeAllListeners();
    }
  }

  // Revenue Share Methods
  async getCreatorTotalShares(address: string): Promise<string> {
    try {
      if (!this.contracts.beaconRevenueShare) {
        throw new Error('BeaconRevenueShare contract not initialized');
      }

      const totalShares = await this.contracts.beaconRevenueShare.getCreatorTotalShares(address);
      return totalShares.toString();
    } catch (error) {
      console.error('Failed to get creator total shares:', error);
      return '0';
    }
  }

  async getCreatorTotalReleased(address: string): Promise<string> {
    try {
      if (!this.contracts.beaconRevenueShare) {
        throw new Error('BeaconRevenueShare contract not initialized');
      }

      const totalReleased = await this.contracts.beaconRevenueShare.getCreatorTotalReleased(address);
      return totalReleased.toString();
    } catch (error) {
      console.error('Failed to get creator total released:', error);
      return '0';
    }
  }

  async getCreatorShares(address: string): Promise<number[]> {
    try {
      if (!this.contracts.beaconRevenueShare) {
        throw new Error('BeaconRevenueShare contract not initialized');
      }

      const shareIds = await this.contracts.beaconRevenueShare.getCreatorShares(address);
      return shareIds.map(id => id.toNumber());
    } catch (error) {
      console.error('Failed to get creator shares:', error);
      return [];
    }
  }

  async getRevenueShare(shareId: number): Promise<{
    shareId: number;
    creator: string;
    shares: string;
    totalReleased: string;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
  }> {
    try {
      if (!this.contracts.beaconRevenueShare) {
        throw new Error('BeaconRevenueShare contract not initialized');
      }

      const share = await this.contracts.beaconRevenueShare.revenueShares(shareId);
      
      return {
        shareId: share.shareId.toNumber(),
        creator: share.creator,
        shares: share.shares.toString(),
        totalReleased: share.totalReleased.toString(),
        isActive: share.isActive,
        createdAt: share.createdAt.toNumber(),
        updatedAt: share.updatedAt.toNumber()
      };
    } catch (error) {
      console.error('Failed to get revenue share:', error);
      throw error;
    }
  }

  async claimRevenue(streamId: number, amount: string): Promise<ethers.ContractReceipt> {
    try {
      if (!this.contracts.beaconRevenueShare || !this.signer) {
        throw new Error('BeaconRevenueShare contract or signer not initialized');
      }

      const amountWei = this.parseEther(amount);
      
      // Estimate gas
      const gasEstimate = await this.contracts.beaconRevenueShare.estimateGas.distributeRevenue(streamId);
      
      // Execute transaction
      const tx = await this.contracts.beaconRevenueShare.distributeRevenue(streamId, {
        gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
      });

      return await tx.wait();
    } catch (error) {
      console.error('Failed to claim revenue:', error);
      throw error;
    }
  }
}

// Create singleton instance
const web3Service = new Web3Service();

export default web3Service; 