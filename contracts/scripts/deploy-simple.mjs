#!/usr/bin/env node

async function main() {
  // Dynamic import of hardhat and ethers
  const hre = await import("hardhat");
  const { ethers, network } = hre;
  const fs = await import("fs");

  console.log("🚀 Starting Deployment...\n");

  // Get signers
  const [deployer, relayer, user1, user2] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy OraiToken
  console.log("Deploying OraiToken...");
  const OraiToken = await ethers.getContractFactory("OraiToken");
  const oraiToken = await OraiToken.deploy();
  await oraiToken.waitForDeployment();
  const oraiTokenAddress = await oraiToken.getAddress();
  console.log("✅ OraiToken deployed to:", oraiTokenAddress);

  // Deploy VotingContract
  console.log("\nDeploying VotingContract...");
  const VotingContract = await ethers.getContractFactory("VotingContract");
  const votingContract = await VotingContract.deploy(oraiTokenAddress);
  await votingContract.waitForDeployment();
  const votingAddress = await votingContract.getAddress();
  console.log("✅ VotingContract deployed to:", votingAddress);

  // Deploy OracleContract
  console.log("\nDeploying OracleContract...");
  const OracleContract = await ethers.getContractFactory("OracleContract");
  const oracleContract = await OracleContract.deploy(deployer.address);
  await oracleContract.waitForDeployment();
  const oracleAddress = await oracleContract.getAddress();
  console.log("✅ OracleContract deployed to:", oracleAddress);

  // Configure contracts
  console.log("\nConfiguring contracts...");

  await oracleContract.setContracts(votingAddress, oraiTokenAddress);
  console.log("✅ OracleContract configured");

  await votingContract.setOracleContract(oracleAddress);
  await votingContract.setTokenContract(oraiTokenAddress);
  console.log("✅ VotingContract configured");

  const ORACLE_ROLE = await votingContract.ORACLE_ROLE();
  await votingContract.grantRole(ORACLE_ROLE, oracleAddress);
  console.log("✅ Granted ORACLE_ROLE to OracleContract");

  const SLASHER_ROLE = await oraiToken.SLASHER_ROLE();
  await oraiToken.grantRole(SLASHER_ROLE, votingAddress);
  console.log("✅ Granted SLASHER_ROLE to VotingContract");

  const RELAYER_ROLE = await oracleContract.RELAYER_ROLE();
  await oracleContract.grantRole(RELAYER_ROLE, relayer.address);
  console.log("✅ Granted RELAYER_ROLE to:", relayer.address);

  // Setup test users
  console.log("\nSetting up test users...");
  await oraiToken.transfer(user1.address, ethers.parseEther("1000"));
  await oraiToken.transfer(user2.address, ethers.parseEther("1000"));
  console.log("✅ Transferred tokens to test users");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\nDeployed Addresses:");
  console.log("  OraiToken:", oraiTokenAddress);
  console.log("  VotingContract:", votingAddress);
  console.log("  OracleContract:", oracleAddress);
  console.log("\nTest Accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  Relayer:", relayer.address);
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });