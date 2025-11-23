import pkg from 'hardhat';
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting Local Deployment...\n");

  // Get the deployer account
  const [deployer, relayer, user1, user2] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  const deployedContracts = {};

  try {
    // ============================
    // 1. Deploy OraiToken
    // ============================
    console.log("1. Deploying OraiToken...");
    const OraiToken = await ethers.getContractFactory("OraiToken");
    const oraiToken = await OraiToken.deploy();
    await oraiToken.waitForDeployment();
    deployedContracts.OraiToken = await oraiToken.getAddress();
    console.log("✅ OraiToken deployed to:", deployedContracts.OraiToken);

    // ============================
    // 2. Deploy VotingContract
    // ============================
    console.log("\n2. Deploying VotingContract...");
    const VotingContract = await ethers.getContractFactory("VotingContract");
    const votingContract = await VotingContract.deploy(
      deployedContracts.OraiToken
    );
    await votingContract.waitForDeployment();
    deployedContracts.VotingContract = await votingContract.getAddress();
    console.log("✅ VotingContract deployed to:", deployedContracts.VotingContract);

    // ============================
    // 3. Deploy OracleContract
    // ============================
    console.log("\n3. Deploying OracleContract...");
    const OracleContract = await ethers.getContractFactory("OracleContract");
    const oracleContract = await OracleContract.deploy(
      deployer.address // Using deployer as treasury for testing
    );
    await oracleContract.waitForDeployment();
    deployedContracts.OracleContract = await oracleContract.getAddress();
    console.log("✅ OracleContract deployed to:", deployedContracts.OracleContract);

    // ============================
    // 4. Configure Contracts
    // ============================
    console.log("\n4. Configuring contracts...");

    // Setup OracleContract
    console.log("   Setting up OracleContract...");
    await oracleContract.setContracts(
      deployedContracts.VotingContract,
      deployedContracts.OraiToken
    );

    // Setup VotingContract
    console.log("   Setting up VotingContract...");
    await votingContract.setOracleContract(deployedContracts.OracleContract);
    await votingContract.setTokenContract(deployedContracts.OraiToken);

    // Grant oracle role to OracleContract in VotingContract
    const ORACLE_ROLE = await votingContract.ORACLE_ROLE();
    await votingContract.grantRole(ORACLE_ROLE, deployedContracts.OracleContract);

    // Grant slasher role to VotingContract in OraiToken
    const SLASHER_ROLE = await oraiToken.SLASHER_ROLE();
    await oraiToken.grantRole(SLASHER_ROLE, deployedContracts.VotingContract);

    // Grant relayer role to second account
    const RELAYER_ROLE = await oracleContract.RELAYER_ROLE();
    await oracleContract.grantRole(RELAYER_ROLE, relayer.address);
    console.log("   Granted RELAYER_ROLE to:", relayer.address);

    console.log("✅ All contracts configured successfully!");

    // ============================
    // 5. Setup Test Data
    // ============================
    console.log("\n5. Setting up test data...");

    // Transfer tokens to users
    await oraiToken.transfer(user1.address, ethers.parseEther("1000"));
    await oraiToken.transfer(user2.address, ethers.parseEther("1000"));
    console.log("   Transferred tokens to test users");

    // Have users stake tokens
    await oraiToken.connect(user1).stake(ethers.parseEther("100"));
    await oraiToken.connect(user2).stake(ethers.parseEther("100"));
    console.log("   Users staked tokens");

    // ============================
    // 6. Save Deployment Info
    // ============================
    const deploymentInfo = {
      network: "hardhat-local",
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      relayer: relayer.address,
      contracts: deployedContracts,
      testAccounts: {
        user1: user1.address,
        user2: user2.address
      }
    };

    const deploymentPath = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }

    fs.writeFileSync(
      path.join(deploymentPath, "local-deployment.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n📝 Deployment info saved to deployments/local-deployment.json");

    // ============================
    // 7. Display Summary
    // ============================
    console.log("\n" + "=".repeat(60));
    console.log("🎉 LOCAL DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(60));
    console.log("\nDeployed Contracts:");
    console.log("-".repeat(40));
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name.padEnd(20)} : ${address}`);
    });

    console.log("\nTest Accounts:");
    console.log("-".repeat(40));
    console.log(`Deployer:  ${deployer.address}`);
    console.log(`Relayer:   ${relayer.address}`);
    console.log(`User1:     ${user1.address}`);
    console.log(`User2:     ${user2.address}`);

    console.log("\n📋 You can now:");
    console.log("1. Submit a question using OracleContract.queryOracle()");
    console.log("2. Submit an answer as relayer using OracleContract.submitAnswer()");
    console.log("3. Vote on answers using VotingContract.castVote()");
    console.log("4. Test the complete oracle flow!");

    return deployedContracts;

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });