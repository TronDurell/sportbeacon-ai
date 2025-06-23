# SportsBeaconAI Contract Deployments

This directory contains deployment information for all SportsBeaconAI smart contracts across different networks.

## 📋 Deployment Files

### Phase 3 Deployments
- `phase3-hardhat.json` - Local development network
- `phase3-polygon.json` - Polygon mainnet deployment
- `phase3-mumbai.json` - Polygon Mumbai testnet deployment

## 🚀 Deployment Process

### Prerequisites
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your private keys and API keys
   ```

3. Compile contracts:
   ```bash
   npx hardhat compile
   ```

### Local Development Deployment
```bash
# Start local hardhat node
npx hardhat node

# Deploy contracts to local network
npx hardhat run scripts/deploy-phase3-contracts.js --network localhost
```

### Testnet Deployment (Mumbai)
```bash
# Deploy to Mumbai testnet
npx hardhat run scripts/deploy-phase3-contracts.js --network mumbai
```

### Mainnet Deployment (Polygon)
```bash
# Deploy to Polygon mainnet
npx hardhat run scripts/deploy-phase3-contracts.js --network polygon
```

## 📄 Contract Addresses

### Phase 3 Contracts
- **BEACON Token**: Governance and reward token
- **BeaconDAO**: Decentralized governance contract
- **BeaconNFT**: NFT collection contract
- **BeaconNFTMarketplace**: NFT marketplace contract

### Network-Specific Addresses
Each deployment file contains:
- Contract addresses for the specific network
- Constructor arguments used during deployment
- Deployment timestamp and deployer address
- Network configuration details

## 🔧 Configuration

### Environment Variables
After deployment, update your `.env` file with the new contract addresses:

```env
# Contract Addresses
BEACON_TOKEN_ADDRESS=0x...
BEACON_DAO_ADDRESS=0x...
BEACON_NFT_ADDRESS=0x...
BEACON_NFT_MARKETPLACE_ADDRESS=0x...

# Network Configuration
NETWORK_NAME=polygon
DEPLOYER_ADDRESS=0x...

# DAO Configuration
PROPOSAL_THRESHOLD=1000
QUORUM=10000
VOTING_PERIOD=172800
VOTING_DELAY=86400

# Marketplace Configuration
PLATFORM_FEE=250
FEE_RECIPIENT=0x...
```

### Frontend Configuration
The deployment script automatically updates `frontend/lib/contractConfig.ts` with the new contract addresses.

## 🔍 Verification

### Etherscan Verification
Contracts are automatically verified on Etherscan during deployment (for testnet/mainnet).

### Manual Verification
If automatic verification fails, manually verify contracts:

```bash
npx hardhat verify --network polygon 0xCONTRACT_ADDRESS "constructor_arg1" "constructor_arg2"
```

## 📊 Deployment Status

### Phase 3 Status: ✅ COMPLETED
- **Local Development**: Ready for testing
- **Mumbai Testnet**: Ready for testing
- **Polygon Mainnet**: Ready for production

### Contract Permissions
- BeaconNFT grants MINTER_ROLE to BeaconNFTMarketplace
- BeaconToken grants DAO_ROLE to BeaconDAO
- All contracts use deployer as initial admin

## 🛠️ Troubleshooting

### Common Issues
1. **Insufficient Balance**: Ensure deployer has enough tokens for gas fees
2. **Network Issues**: Check network configuration in hardhat.config.js
3. **Verification Failures**: Manual verification may be required
4. **Permission Errors**: Ensure proper role assignments

### Support
For deployment issues, check:
- Hardhat documentation
- Network-specific documentation (Polygon, Mumbai)
- Contract verification guides

## 📈 Next Steps

After successful deployment:
1. Test all contract functions on testnet
2. Update frontend configuration
3. Deploy to mainnet when ready
4. Update API endpoints
5. Monitor contract performance

## 🔗 Related Documentation
- [Phase 3 Summary](../PHASE3_GOVERNANCE_MARKETPLACE_ANALYTICS_SUMMARY.md)
- [Contract Documentation](../contracts/)
- [Frontend Integration](../frontend/)
- [API Documentation](../backend/) 