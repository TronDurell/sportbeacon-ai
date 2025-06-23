// Contract Configuration for SportBeaconAI
// This file contains all contract ABIs, addresses, and configuration

export const CONTRACT_CONFIG = {
  // Network Configuration
  NETWORK: {
    CHAIN_ID: 80001, // Polygon Mumbai
    RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://polygon-mumbai.g.alchemy.com/v2/your_key',
    EXPLORER_URL: 'https://mumbai.polygonscan.com',
    NAME: 'Polygon Mumbai Testnet'
  },

  // Contract Addresses (Update these after deployment)
  ADDRESSES: {
    BEACON_TOKEN: process.env.NEXT_PUBLIC_BEACON_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
    BEACON_NFT: process.env.NEXT_PUBLIC_BEACON_NFT_ADDRESS || '0x0000000000000000000000000000000000000000',
    BEACON_MARKETPLACE: process.env.NEXT_PUBLIC_BEACON_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000',
    BEACON_DAO: process.env.NEXT_PUBLIC_BEACON_DAO_ADDRESS || '0x0000000000000000000000000000000000000000'
  },

  // Gas Configuration
  GAS: {
    LIMIT: 300000,
    PRICE: '20000000000', // 20 gwei
    MAX_FEE_PER_GAS: '30000000000', // 30 gwei
    MAX_PRIORITY_FEE_PER_GAS: '2000000000' // 2 gwei
  }
};

// BeaconToken ABI (ERC-20 with rewards functionality)
export const BEACON_TOKEN_ABI = [
  // ERC-20 Standard Functions
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // BeaconToken Specific Functions
  {
    "inputs": [{"name": "recipient", "type": "address"}, {"name": "amount", "type": "uint256"}, {"name": "reason", "type": "string"}],
    "name": "issueRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "getTotalRewardsClaimed",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "getLastRewardClaim",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRewardsBalance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "recipient", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "reason", "type": "string"}
    ],
    "name": "RewardsIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "recipient", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "RewardsClaimed",
    "type": "event"
  }
];

// BeaconNFT ABI (ERC-1155 with access control)
export const BEACON_NFT_ABI = [
  // ERC-1155 Standard Functions
  {
    "inputs": [{"name": "account", "type": "address"}, {"name": "id", "type": "uint256"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "accounts", "type": "address[]"}, {"name": "ids", "type": "uint256[]"}],
    "name": "balanceOfBatch",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "from", "type": "address"}, {"name": "to", "type": "address"}, {"name": "ids", "type": "uint256[]"}, {"name": "amounts", "type": "uint256[]"}, {"name": "data", "type": "bytes"}],
    "name": "safeBatchTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "from", "type": "address"}, {"name": "to", "type": "address"}, {"name": "id", "type": "uint256"}, {"name": "amount", "type": "uint256"}, {"name": "data", "type": "bytes"}],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "operator", "type": "address"}, {"name": "approved", "type": "bool"}],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}, {"name": "operator", "type": "address"}],
    "name": "isApprovedForAll",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "uri",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  // BeaconNFT Specific Functions
  {
    "inputs": [{"name": "recipient", "type": "address"}, {"name": "tokenId", "type": "uint256"}, {"name": "amount", "type": "uint256"}, {"name": "reason", "type": "string"}],
    "name": "mintNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}, {"name": "tokenId", "type": "uint256"}],
    "name": "hasActiveAccess",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getActiveTokens",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}, {"name": "tokenId", "type": "uint256"}],
    "name": "getTokenExpiry",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "recipient", "type": "address"},
      {"indexed": false, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "reason", "type": "string"}
    ],
    "name": "NFTMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "expiry", "type": "uint256"}
    ],
    "name": "AccessGranted",
    "type": "event"
  }
];

// BeaconNFTMarketplace ABI
export const BEACON_MARKETPLACE_ABI = [
  // Marketplace Functions
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}, {"name": "price", "type": "uint256"}, {"name": "quantity", "type": "uint256"}, {"name": "metadata", "type": "string"}],
    "name": "createListing",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "listingId", "type": "uint256"}, {"name": "quantity", "type": "uint256"}],
    "name": "buyNFT",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "listingId", "type": "uint256"}],
    "name": "getListing",
    "outputs": [
      {"name": "listingId", "type": "uint256"},
      {"name": "creator", "type": "address"},
      {"name": "tokenId", "type": "uint256"},
      {"name": "price", "type": "uint256"},
      {"name": "quantity", "type": "uint256"},
      {"name": "sold", "type": "uint256"},
      {"name": "active", "type": "bool"},
      {"name": "metadata", "type": "string"},
      {"name": "createdAt", "type": "uint256"},
      {"name": "updatedAt", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "creator", "type": "address"}],
    "name": "getCreatorListings",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "listingId", "type": "uint256"}, {"name": "newPrice", "type": "uint256"}, {"name": "newQuantity", "type": "uint256"}],
    "name": "updateListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "listingId", "type": "uint256"}],
    "name": "cancelListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "listingId", "type": "uint256"},
      {"indexed": true, "name": "creator", "type": "address"},
      {"indexed": true, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "price", "type": "uint256"},
      {"indexed": false, "name": "quantity", "type": "uint256"},
      {"indexed": false, "name": "metadata", "type": "string"}
    ],
    "name": "ListingCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "saleId", "type": "uint256"},
      {"indexed": true, "name": "listingId", "type": "uint256"},
      {"indexed": true, "name": "buyer", "type": "address"},
      {"indexed": false, "name": "seller", "type": "address"},
      {"indexed": false, "name": "tokenId", "type": "uint256"},
      {"indexed": false, "name": "quantity", "type": "uint256"},
      {"indexed": false, "name": "price", "type": "uint256"}
    ],
    "name": "NFTBought",
    "type": "event"
  }
];

// BeaconDAO ABI (Governance)
export const BEACON_DAO_ABI = [
  // Governor Functions
  {
    "inputs": [{"name": "targets", "type": "address[]"}, {"name": "values", "type": "uint256[]"}, {"name": "calldatas", "type": "bytes[]"}, {"name": "description", "type": "string"}],
    "name": "propose",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "proposalId", "type": "uint256"}],
    "name": "state",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "proposalId", "type": "uint256"}],
    "name": "proposalVotes",
    "outputs": [
      {"name": "againstVotes", "type": "uint256"},
      {"name": "forVotes", "type": "uint256"},
      {"name": "abstainVotes", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "proposalId", "type": "uint256"}, {"name": "support", "type": "uint8"}],
    "name": "castVote",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "targets", "type": "address[]"}, {"name": "values", "type": "uint256[]"}, {"name": "calldatas", "type": "bytes[]"}, {"name": "descriptionHash", "type": "bytes32"}],
    "name": "execute",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  // BeaconDAO Specific Functions
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "getVotingPower",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "canPropose",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "proposalId", "type": "uint256"}],
    "name": "getProposalMetadata",
    "outputs": [
      {"name": "description", "type": "string"},
      {"name": "category", "type": "string"},
      {"name": "funding", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract Factory Functions
export const createContractInstance = (contractAddress: string, abi: any, signer?: any) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const { ethers } = require('ethers');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contractSigner = signer || provider.getSigner();
    return new ethers.Contract(contractAddress, abi, contractSigner);
  }
  return null;
};

// Gas Estimation Functions
export const estimateGas = async (contract: any, method: string, params: any[] = []) => {
  try {
    const gasEstimate = await contract.estimateGas[method](...params);
    return gasEstimate.toString();
  } catch (error) {
    console.error('Gas estimation failed:', error);
    return CONTRACT_CONFIG.GAS.LIMIT.toString();
  }
};

// Transaction Helper Functions
export const sendTransaction = async (contract: any, method: string, params: any[] = [], overrides: any = {}) => {
  try {
    const gasEstimate = await estimateGas(contract, method, params);
    
    const tx = await contract[method](...params, {
      gasLimit: gasEstimate,
      maxFeePerGas: CONTRACT_CONFIG.GAS.MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: CONTRACT_CONFIG.GAS.MAX_PRIORITY_FEE_PER_GAS,
      ...overrides
    });
    
    return await tx.wait();
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};

// Contract Address Validation
export const isValidAddress = (address: string): boolean => {
  if (typeof window !== 'undefined') {
    const { ethers } = require('ethers');
    return ethers.utils.isAddress(address);
  }
  return false;
};

// Network Validation
export const validateNetwork = async (): Promise<boolean> => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const { ethers } = require('ethers');
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    return network.chainId === CONTRACT_CONFIG.NETWORK.CHAIN_ID;
  }
  return false;
};

// Export all configurations
export default {
  CONTRACT_CONFIG,
  BEACON_TOKEN_ABI,
  BEACON_NFT_ABI,
  BEACON_MARKETPLACE_ABI,
  BEACON_DAO_ABI,
  createContractInstance,
  estimateGas,
  sendTransaction,
  isValidAddress,
  validateNetwork
}; 