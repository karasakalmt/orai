// ESM deployment script for Hardhat 3
async function main() {
  // Import dynamically to work with ESM
  const hre = await import("hardhat");
  const ethers = hre.default.ethers;
  const fs = await import("fs");

  console.log("🚀 Starting Contract Deployment...\n");

  // Get signers
  const [deployer, relayer, user1, user2] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy OraiToken
  console.log("1. Deploying OraiToken...");
  const OraiToken = await ethers.getContractFactory("OraiToken");
  const oraiToken = await OraiToken.deploy();
  await oraiToken.waitForDeployment();
  const oraiTokenAddress = await oraiToken.getAddress();
  console.log("✅ OraiToken deployed to:", oraiTokenAddress);

  // Deploy VotingContract
  console.log("\n2. Deploying VotingContract...");
  const VotingContract = await ethers.getContractFactory("VotingContract");
  const votingContract = await VotingContract.deploy(oraiTokenAddress);
  await votingContract.waitForDeployment();
  const votingAddress = await votingContract.getAddress();
  console.log("✅ VotingContract deployed to:", votingAddress);

  // Deploy OracleContract
  console.log("\n3. Deploying OracleContract...");
  const OracleContract = await ethers.getContractFactory("OracleContract");
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
  await oraiToken.transfer(user1.address, ethers.parseEther("1000"));
  await oraiToken.transfer(user2.address, ethers.parseEther("1000"));
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
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
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
      minOracleFee: ethers.formatEther(await oracleContract.minOracleFee()),
      rewardPercentage: (await oracleContract.REWARD_PERCENTAGE()).toString(),
      treasuryPercentage: (await oracleContract.TREASURY_PERCENTAGE()).toString(),
      relayerPercentage: (await oracleContract.RELAYER_PERCENTAGE()).toString()
    }
  };

  if (!fs.existsSync("deployments")) {
    fs.mkdirSync("deployments");
  }

  fs.writeFileSync(
    "deployments/deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📝 Deployment info saved to deployments/deployment.json");
  console.log("\n🚀 Next Steps:");
  console.log("1. Submit a question: oracleContract.queryOracle('Your question', [])");
  console.log("2. Submit answer as relayer: oracleContract.submitAnswer(...)");
  console.log("3. Vote on answer: votingContract.castVote(questionId, true/false)");

  return deploymentInfo;
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