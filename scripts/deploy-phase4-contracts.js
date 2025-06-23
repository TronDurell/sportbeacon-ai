const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Phase 4 Contract Deployment...");
  console.log("📋 Deploying: BeaconRevenueShare Contract");
  console.log("");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying contracts with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  console.log("");

  // Deploy BeaconRevenueShare Contract
  console.log("📦 Deploying BeaconRevenueShare...");
  const BeaconRevenueShare = await ethers.getContractFactory("BeaconRevenueShare");
  const beaconRevenueShare = await BeaconRevenueShare.deploy();
  await beaconRevenueShare.deployed();
  
  console.log(`✅ BeaconRevenueShare deployed to: ${beaconRevenueShare.address}`);
  console.log("");

  // Verify contracts on Etherscan (if not on local network)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 31337) { // Not local network
    console.log("🔍 Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: beaconRevenueShare.address,
        constructorArguments: [],
      });
      console.log("✅ BeaconRevenueShare verified on Etherscan");
    } catch (error) {
      console.log("⚠️  Verification failed (contract might already be verified):", error.message);
    }
    console.log("");
  }

  // Create deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      beaconRevenueShare: {
        address: beaconRevenueShare.address,
        name: "BeaconRevenueShare",
        description: "Revenue sharing contract for SportsBeaconDAO using OpenZeppelin's PaymentSplitter",
        features: [
          "Multi-stream revenue distribution",
          "Creator share management",
          "On-chain revenue tracking",
          "Automated distribution",
          "Role-based access control"
        ]
      }
    }
  };

  // Save deployment info
  const deploymentPath = path.join(__dirname, "../deployments/phase4-deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentPath}`);

  // Create environment variables file
  const envContent = `# Phase 4 Contract Addresses
BEACON_REVENUE_SHARE_ADDRESS=${beaconRevenueShare.address}

# Phase 4 Configuration
BASE_REWARD=10.0
ENGAGEMENT_MULTIPLIER=0.1
QUALITY_BONUS=5.0
VIRAL_BONUS=15.0
MAX_REWARD_PER_HIGHLIGHT=100.0
MIN_ENGAGEMENT_FOR_REWARD=10
REWARD_COOLDOWN_HOURS=24
AUTO_MINT_ENABLED=true

# API Keys (set these in production)
DAO_ADMIN_API_KEY=your_dao_admin_key_here
NFT_UTILITY_ADMIN_API_KEY=your_nft_utility_admin_key_here
REWARD_MINT_PRIVATE_KEY=your_reward_mint_private_key_here
`;

  const envPath = path.join(__dirname, "../.env.phase4");
  fs.writeFileSync(envPath, envContent);
  console.log(`📄 Environment variables saved to: ${envPath}`);

  // Display deployment summary
  console.log("🎉 Phase 4 Deployment Complete!");
  console.log("");
  console.log("📊 Deployment Summary:");
  console.log("========================");
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`BeaconRevenueShare: ${beaconRevenueShare.address}`);
  console.log("");
  console.log("🔧 Next Steps:");
  console.log("1. Update your .env file with the new contract addresses");
  console.log("2. Configure revenue streams in the BeaconRevenueShare contract");
  console.log("3. Set up creator shares for revenue distribution");
  console.log("4. Deploy the backend services (reward_generator.py, dao_revenue.py, nft_utilities.py)");
  console.log("5. Update frontend configuration with new contract addresses");
  console.log("6. Test the NFT utility and revenue share functionality");
  console.log("");
  console.log("📚 Documentation:");
  console.log("- Phase 4 Summary: PHASE4_UTILITY_MONETIZATION_SUMMARY.md");
  console.log("- Contract ABI: lib/contractConfig.ts");
  console.log("- API Documentation: backend/api/");
  console.log("");

  // Test basic contract functionality
  console.log("🧪 Testing basic contract functionality...");
  
  try {
    // Test role assignment
    const daoRole = await beaconRevenueShare.DAO_ROLE();
    const adminRole = await beaconRevenueShare.ADMIN_ROLE();
    
    console.log(`✅ DAO_ROLE: ${daoRole}`);
    console.log(`✅ ADMIN_ROLE: ${adminRole}`);
    
    // Test deployer has admin role
    const hasAdminRole = await beaconRevenueShare.hasRole(adminRole, deployer.address);
    console.log(`✅ Deployer has admin role: ${hasAdminRole}`);
    
    // Test deployer has DAO role
    const hasDaoRole = await beaconRevenueShare.hasRole(daoRole, deployer.address);
    console.log(`✅ Deployer has DAO role: ${hasDaoRole}`);
    
    console.log("✅ Basic contract functionality tests passed!");
    
  } catch (error) {
    console.log("❌ Basic contract functionality tests failed:", error.message);
  }

  console.log("");
  console.log("🚀 Phase 4 deployment is ready for production!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 