import { ethers } from "ethers";
import fs from "fs";

async function main() {
  console.log("🚀 Starting Contract Deployment (Final)...\n");

  // Connect to the network
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Use the test accounts from Hardhat node
  const deployer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  const relayer = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
  const user1 = new ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", provider);
  const user2 = new ethers.Wallet("0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", provider);

  console.log("Deploying with account:", deployer.address);

  const balance = await provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  // Get current nonce
  let nonce = await provider.getTransactionCount(deployer.address);
  console.log("Starting nonce:", nonce, "\n");

  // Get contract artifacts
  const OraiTokenArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/OraiToken.sol/OraiToken.json", "utf8"));
  const VotingContractArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/VotingContract.sol/VotingContract.json", "utf8"));
  const OracleContractArtifact = JSON.parse(fs.readFileSync("artifacts/contracts/OracleContract.sol/OracleContract.json", "utf8"));

  let oraiTokenAddress;
  let oraiToken;

  // Check if OraiToken is already deployed
  if (nonce === 0) {
    // Deploy OraiToken
    console.log("1. Deploying OraiToken...");
    const OraiTokenFactory = new ethers.ContractFactory(OraiTokenArtifact.abi, OraiTokenArtifact.bytecode, deployer);
    const deployTx = await OraiTokenFactory.deploy({ nonce: nonce++ });
    await deployTx.waitForDeployment();
    oraiTokenAddress = await deployTx.getAddress();
    oraiToken = deployTx;
    console.log("✅ OraiToken deployed to:", oraiTokenAddress);
  } else {
    // OraiToken already deployed at known address
    oraiTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    oraiToken = new ethers.Contract(oraiTokenAddress, OraiTokenArtifact.abi, deployer);
    console.log("✅ OraiToken already deployed at:", oraiTokenAddress);
  }

  // Deploy VotingContract
  console.log("\n2. Deploying VotingContract...");
  const VotingContractFactory = new ethers.ContractFactory(VotingContractArtifact.abi, VotingContractArtifact.bytecode, deployer);
  const votingContract = await VotingContractFactory.deploy(oraiTokenAddress, { nonce: nonce++ });
  await votingContract.waitForDeployment();
  const votingAddress = await votingContract.getAddress();
  console.log("✅ VotingContract deployed to:", votingAddress);

  // Deploy OracleContract
  console.log("\n3. Deploying OracleContract...");
  const OracleContractFactory = new ethers.ContractFactory(OracleContractArtifact.abi, OracleContractArtifact.bytecode, deployer);
  const oracleContract = await OracleContractFactory.deploy(deployer.address, { nonce: nonce++ }); // treasury
  await oracleContract.waitForDeployment();
  const oracleAddress = await oracleContract.getAddress();
  console.log("✅ OracleContract deployed to:", oracleAddress);

  // Configure contracts
  console.log("\n4. Configuring contracts...");

  // Configure OracleContract
  await oracleContract.setContracts(votingAddress, oraiTokenAddress, { nonce: nonce++ });
  console.log("   ✅ OracleContract configured");

  // Configure VotingContract
  await votingContract.setOracleContract(oracleAddress, { nonce: nonce++ });
  await votingContract.setTokenContract(oraiTokenAddress, { nonce: nonce++ });
  console.log("   ✅ VotingContract configured");

  // Grant roles
  const ORACLE_ROLE = await votingContract.ORACLE_ROLE();
  await votingContract.grantRole(ORACLE_ROLE, oracleAddress, { nonce: nonce++ });
  console.log("   ✅ Granted ORACLE_ROLE to OracleContract");

  const SLASHER_ROLE = await oraiToken.SLASHER_ROLE();
  await oraiToken.grantRole(SLASHER_ROLE, votingAddress, { nonce: nonce++ });
  console.log("   ✅ Granted SLASHER_ROLE to VotingContract");

  const RELAYER_ROLE = await oracleContract.RELAYER_ROLE();
  await oracleContract.grantRole(RELAYER_ROLE, relayer.address, { nonce: nonce++ });
  console.log("   ✅ Granted RELAYER_ROLE to:", relayer.address);

  // Setup test users
  console.log("\n5. Setting up test users...");
  await oraiToken.transfer(user1.address, ethers.parseEther("1000"), { nonce: nonce++ });
  await oraiToken.transfer(user2.address, ethers.parseEther("1000"), { nonce: nonce++ });
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
    network: "localhost",
    chainId: (await provider.getNetwork()).chainId.toString(),
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