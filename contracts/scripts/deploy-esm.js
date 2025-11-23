// Hardhat 3 ESM deployment script
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting Contract Deployment...\n");

  // Get signers
  const [deployer, relayer, user1, user2] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  try {
    // Deploy OraiToken
    console.log("1. Deploying OraiToken...");
    const OraiToken = await hre.ethers.getContractFactory("OraiToken");
    const oraiToken = await OraiToken.deploy();
    await oraiToken.waitForDeployment();
    const oraiTokenAddress = await oraiToken.getAddress();
    console.log("✅ OraiToken deployed to:", oraiTokenAddress);

    // Deploy VotingContract
    console.log("\n2. Deploying VotingContract...");
    const VotingContract = await hre.ethers.getContractFactory("VotingContract");
    const votingContract = await VotingContract.deploy(oraiTokenAddress);
    await votingContract.waitForDeployment();
    const votingAddress = await votingContract.getAddress();
    console.log("✅ VotingContract deployed to:", votingAddress);

    // Deploy OracleContract
    console.log("\n3. Deploying OracleContract...");
    const OracleContract = await hre.ethers.getContractFactory("OracleContract");
    const oracleContract = await OracleContract.deploy(deployer.address); // treasury
    await oracleContract.waitForDeployment();
    const oracleAddress = await oracleContract.getAddress();
    console.log("✅ OracleContract deployed to:", oracleAddress);

    // Configure contracts
    console.log("\n4. Configuring contracts...");

    // Configure OracleContract
    await oracleContract.setContracts(votingAddress, oraiTokenAddress);
    console.log("   ✅ OracleContract configured");

    // Configure VotingContract
    await votingContract.setOracleContract(oracleAddress);
    await votingContract.setTokenContract(oraiTokenAddress);
    console.log("   ✅ VotingContract configured");

    // Grant roles
    const ORACLE_ROLE = await votingContract.ORACLE_ROLE();
    await votingContract.grantRole(ORACLE_ROLE, oracleAddress);
    console.log("   ✅ Granted ORACLE_ROLE to OracleContract");

    const SLASHER_ROLE = await oraiToken.SLASHER_ROLE();
    await oraiToken.grantRole(SLASHER_ROLE, votingAddress);
    console.log("   ✅ Granted SLASHER_ROLE to VotingContract");

    const RELAYER_ROLE = await oracleContract.RELAYER_ROLE();
    await oracleContract.grantRole(RELAYER_ROLE, relayer.address);
    console.log("   ✅ Granted RELAYER_ROLE to:", relayer.address);

    // Setup test users
    console.log("\n5. Setting up test users...");
    await oraiToken.transfer(user1.address, hre.ethers.parseEther("1000"));
    await oraiToken.transfer(user2.address, hre.ethers.parseEther("1000"));
    console.log("   ✅ Transferred tokens to test users");

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(60));
    console.log("\n📋 Deployed Contracts:");
    console.log("  OraiToken:      ", oraiTokenAddress);
    console.log("  VotingContract: ", votingAddress);
    console.log("  OracleContract: ", oracleAddress);

    console.log("\n👥 Test Accounts:");
    console.log("  Deployer/Treasury:", deployer.address);
    console.log("  Relayer:         ", relayer.address);
    console.log("  Test User 1:     ", user1.address);
    console.log("  Test User 2:     ", user2.address);

    // Save deployment info
    const deploymentInfo = {
      network: (await hre.ethers.provider.getNetwork()).name,
      chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
      deployedAt: new Date().toISOString(),
      contracts: {
        OraiToken: oraiTokenAddress,
        VotingContract: votingAddress,
        OracleContract: oracleAddress
      },
      accounts: {
        deployer: deployer.address,
        relayer: relayer.address,
        user1: user1.address,
        user2: user2.address
      },
      configuration: {
        minOracleFee: hre.ethers.formatEther(await oracleContract.minOracleFee()),
        rewardPercentage: (await oracleContract.REWARD_PERCENTAGE()).toString(),
        treasuryPercentage: (await oracleContract.TREASURY_PERCENTAGE()).toString(),
        relayerPercentage: (await oracleContract.RELAYER_PERCENTAGE()).toString()
      }
    };

    const deploymentPath = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }

    fs.writeFileSync(
      path.join(deploymentPath, "deployment.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n📝 Deployment info saved to deployments/deployment.json");
    console.log("\n🚀 Next Steps:");
    console.log("1. Submit a question: oracleContract.queryOracle('Your question', [])");
    console.log("2. Submit answer as relayer: oracleContract.submitAnswer(...)");
    console.log("3. Vote on answer: votingContract.castVote(questionId, true/false)");

    return deploymentInfo;

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

// Run deployment
main()
  .then((result) => {
    console.log("\n✨ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });