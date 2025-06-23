const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Phase 3 Contract Deployment...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy BEACON Token (if not already deployed)
  console.log("\n📦 Deploying BEACON Token...");
  const BeaconToken = await ethers.getContractFactory("BeaconToken");
  const beaconToken = await BeaconToken.deploy();
  await beaconToken.deployed();
  console.log("BEACON Token deployed to:", beaconToken.address);

  // Deploy BeaconDAO Governance Contract
  console.log("\n🗳️ Deploying BeaconDAO Governance Contract...");
  const BeaconDAO = await ethers.getContractFactory("BeaconDAO");
  const beaconDAO = await BeaconDAO.deploy(
    beaconToken.address, // BEACON token address
    1000, // Proposal threshold (minimum tokens required to create proposal)
    10000, // Quorum (minimum votes required for proposal to pass)
    172800, // Voting period (2 days in seconds)
    86400, // Voting delay (1 day in seconds)
    deployer.address // Timelock address (using deployer for now)
  );
  await beaconDAO.deployed();
  console.log("BeaconDAO deployed to:", beaconDAO.address);

  // Deploy BeaconNFT Contract
  console.log("\n🖼️ Deploying BeaconNFT Contract...");
  const BeaconNFT = await ethers.getContractFactory("BeaconNFT");
  const beaconNFT = await BeaconNFT.deploy(
    "SportsBeaconAI NFT",
    "SBAI",
    "https://api.sportsbeacon.ai/metadata/",
    deployer.address // Default admin
  );
  await beaconNFT.deployed();
  console.log("BeaconNFT deployed to:", beaconNFT.address);

  // Deploy BeaconNFTMarketplace Contract
  console.log("\n🏪 Deploying BeaconNFTMarketplace Contract...");
  const BeaconNFTMarketplace = await ethers.getContractFactory("BeaconNFTMarketplace");
  const beaconNFTMarketplace = await BeaconNFTMarketplace.deploy(
    beaconNFT.address, // NFT contract address
    250, // Platform fee (2.5% = 250 basis points)
    deployer.address // Fee recipient
  );
  await beaconNFTMarketplace.deployed();
  console.log("BeaconNFTMarketplace deployed to:", beaconNFTMarketplace.address);

  // Grant marketplace role to marketplace contract
  console.log("\n🔐 Setting up permissions...");
  await beaconNFT.grantRole(await beaconNFT.MINTER_ROLE(), beaconNFTMarketplace.address);
  console.log("Granted MINTER_ROLE to marketplace contract");

  // Grant DAO role to DAO contract
  await beaconToken.grantRole(await beaconToken.DAO_ROLE(), beaconDAO.address);
  console.log("Granted DAO_ROLE to BeaconDAO contract");

  // Verify contracts on Etherscan (if on mainnet/testnet)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: beaconToken.address,
        constructorArguments: [],
      });
      console.log("✅ BEACON Token verified on Etherscan");
    } catch (error) {
      console.log("⚠️ BEACON Token verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: beaconDAO.address,
        constructorArguments: [
          beaconToken.address,
          1000,
          10000,
          172800,
          86400,
          deployer.address
        ],
      });
      console.log("✅ BeaconDAO verified on Etherscan");
    } catch (error) {
      console.log("⚠️ BeaconDAO verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: beaconNFT.address,
        constructorArguments: [
          "SportsBeaconAI NFT",
          "SBAI",
          "https://api.sportsbeacon.ai/metadata/",
          deployer.address
        ],
      });
      console.log("✅ BeaconNFT verified on Etherscan");
    } catch (error) {
      console.log("⚠️ BeaconNFT verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: beaconNFTMarketplace.address,
        constructorArguments: [
          beaconNFT.address,
          250,
          deployer.address
        ],
      });
      console.log("✅ BeaconNFTMarketplace verified on Etherscan");
    } catch (error) {
      console.log("⚠️ BeaconNFTMarketplace verification failed:", error.message);
    }
  }

  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    contracts: {
      beaconToken: beaconToken.address,
      beaconDAO: beaconDAO.address,
      beaconNFT: beaconNFT.address,
      beaconNFTMarketplace: beaconNFTMarketplace.address
    },
    deploymentTime: new Date().toISOString(),
    constructorArgs: {
      beaconDAO: {
        beaconToken: beaconToken.address,
        proposalThreshold: 1000,
        quorum: 10000,
        votingPeriod: 172800,
        votingDelay: 86400,
        timelock: deployer.address
      },
      beaconNFT: {
        name: "SportsBeaconAI NFT",
        symbol: "SBAI",
        baseURI: "https://api.sportsbeacon.ai/metadata/",
        admin: deployer.address
      },
      beaconNFTMarketplace: {
        nftContract: beaconNFT.address,
        platformFee: 250,
        feeRecipient: deployer.address
      }
    }
  };

  // Save to deployment file
  const deploymentPath = path.join(__dirname, `../deployments/phase3-${network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);

  // Generate environment variables
  const envContent = `# Phase 3 Contract Addresses - ${network.name.toUpperCase()}
BEACON_TOKEN_ADDRESS=${beaconToken.address}
BEACON_DAO_ADDRESS=${beaconDAO.address}
BEACON_NFT_ADDRESS=${beaconNFT.address}
BEACON_NFT_MARKETPLACE_ADDRESS=${beaconNFTMarketplace.address}

# Network Configuration
NETWORK_NAME=${network.name}
DEPLOYER_ADDRESS=${deployer.address}

# DAO Configuration
PROPOSAL_THRESHOLD=1000
QUORUM=10000
VOTING_PERIOD=172800
VOTING_DELAY=86400

# Marketplace Configuration
PLATFORM_FEE=250
FEE_RECIPIENT=${deployer.address}
`;

  const envPath = path.join(__dirname, `../.env.${network.name}`);
  fs.writeFileSync(envPath, envContent);
  console.log(`📝 Environment variables saved to: ${envPath}`);

  // Update contract config for frontend
  const contractConfigPath = path.join(__dirname, "../frontend/lib/contractConfig.ts");
  const contractConfigContent = `// Auto-generated contract configuration for ${network.name}
export const contractConfig = {
  beaconToken: "${beaconToken.address}",
  beaconDAO: "${beaconDAO.address}",
  beaconNFT: "${beaconNFT.address}",
  beaconNFTMarketplace: "${beaconNFTMarketplace.address}",
  network: "${network.name}",
  deployer: "${deployer.address}",
  // DAO Configuration
  proposalThreshold: 1000,
  quorum: 10000,
  votingPeriod: 172800,
  votingDelay: 86400,
  // Marketplace Configuration
  platformFee: 250,
  feeRecipient: "${deployer.address}",
} as const;

export default contractConfig;
`;

  fs.writeFileSync(contractConfigPath, contractConfigContent);
  console.log(`🔧 Contract config updated: ${contractConfigPath}`);

  // Display deployment summary
  console.log("\n🎉 Phase 3 Contract Deployment Complete!");
  console.log("=" .repeat(50));
  console.log("📋 Deployment Summary:");
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`BEACON Token: ${beaconToken.address}`);
  console.log(`BeaconDAO: ${beaconDAO.address}`);
  console.log(`BeaconNFT: ${beaconNFT.address}`);
  console.log(`BeaconNFTMarketplace: ${beaconNFTMarketplace.address}`);
  console.log("=" .repeat(50));

  // Display next steps
  console.log("\n📋 Next Steps:");
  console.log("1. Update your .env file with the new contract addresses");
  console.log("2. Test the contracts on the deployed network");
  console.log("3. Update frontend configuration if needed");
  console.log("4. Deploy to production network when ready");
  console.log("5. Update API endpoints to use new contract addresses");

  return {
    beaconToken: beaconToken.address,
    beaconDAO: beaconDAO.address,
    beaconNFT: beaconNFT.address,
    beaconNFTMarketplace: beaconNFTMarketplace.address
  };
}

// Execute deployment
main()
  .then((addresses) => {
    console.log("\n✅ Deployment script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }); 