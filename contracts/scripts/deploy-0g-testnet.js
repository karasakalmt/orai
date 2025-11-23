import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Starting 0G Testnet Deployment...\n");

  // Validate environment variables
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Please set PRIVATE_KEY in .env file");
  }

  // Connect to 0G testnet
  const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");

  // Create wallet from private key
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deploying to 0G Testnet (Chain ID: 16600)");
  console.log("Deployer address:", deployer.address);

  // Check balance
  const balance = await provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "A0GI\n");

  if (balance === 0n) {
    console.log("⚠️  Warning: Account has no balance. Please fund it with A0GI tokens.");
    console.log("   Faucet: https://faucet.0g.ai");
    return;
  }

  // Get contract artifacts
  const OraiTokenArtifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/OraiToken.sol/OraiToken.json", "utf8")
  );
  const VotingContractArtifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/VotingContract.sol/VotingContract.json", "utf8")
  );
  const OracleContractArtifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/OracleContract.sol/OracleContract.json", "utf8")
  );
  const GovernanceContractArtifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/GovernanceContract.sol/GovernanceContract.json", "utf8")
  );

  try {
    // Deploy OraiToken
    console.log("1. Deploying OraiToken...");
    const OraiTokenFactory = new ethers.ContractFactory(
      OraiTokenArtifact.abi,
      OraiTokenArtifact.bytecode,
      deployer
    );
    const oraiToken = await OraiTokenFactory.deploy();
    await oraiToken.waitForDeployment();
    const oraiTokenAddress = await oraiToken.getAddress();
    console.log("✅ OraiToken deployed to:", oraiTokenAddress);

    // Deploy VotingContract
    console.log("\n2. Deploying VotingContract...");
    const VotingContractFactory = new ethers.ContractFactory(
      VotingContractArtifact.abi,
      VotingContractArtifact.bytecode,
      deployer
    );
    const votingContract = await VotingContractFactory.deploy(oraiTokenAddress);
    await votingContract.waitForDeployment();
    const votingAddress = await votingContract.getAddress();
    console.log("✅ VotingContract deployed to:", votingAddress);

    // Deploy OracleContract
    console.log("\n3. Deploying OracleContract...");
    const OracleContractFactory = new ethers.ContractFactory(
      OracleContractArtifact.abi,
      OracleContractArtifact.bytecode,
      deployer
    );
    const oracleContract = await OracleContractFactory.deploy(deployer.address); // treasury
    await oracleContract.waitForDeployment();
    const oracleAddress = await oracleContract.getAddress();
    console.log("✅ OracleContract deployed to:", oracleAddress);

    // Deploy GovernanceContract
    console.log("\n4. Deploying GovernanceContract...");
    const GovernanceContractFactory = new ethers.ContractFactory(
      GovernanceContractArtifact.abi,
      GovernanceContractArtifact.bytecode,
      deployer
    );
    const governanceContract = await GovernanceContractFactory.deploy(oraiTokenAddress);
    await governanceContract.waitForDeployment();
    const governanceAddress = await governanceContract.getAddress();
    console.log("✅ GovernanceContract deployed to:", governanceAddress);

    // Configure contracts
    console.log("\n5. Configuring contracts...");

    // Configure OracleContract
    console.log("   Configuring OracleContract...");
    const tx1 = await oracleContract.setContracts(votingAddress, oraiTokenAddress);
    await tx1.wait();
    console.log("   ✅ OracleContract configured");

    // Configure VotingContract
    console.log("   Configuring VotingContract...");
    const tx2 = await votingContract.setOracleContract(oracleAddress);
    await tx2.wait();
    const tx3 = await votingContract.setTokenContract(oraiTokenAddress);
    await tx3.wait();
    console.log("   ✅ VotingContract configured");

    // Configure GovernanceContract
    console.log("   Configuring GovernanceContract...");
    const tx4 = await governanceContract.setContracts(oracleAddress, votingAddress);
    await tx4.wait();
    console.log("   ✅ GovernanceContract configured");

    // Grant roles
    console.log("\n6. Setting up roles...");

    const ORACLE_ROLE = await votingContract.ORACLE_ROLE();
    const tx5 = await votingContract.grantRole(ORACLE_ROLE, oracleAddress);
    await tx5.wait();
    console.log("   ✅ Granted ORACLE_ROLE to OracleContract");

    const SLASHER_ROLE = await oraiToken.SLASHER_ROLE();
    const tx6 = await oraiToken.grantRole(SLASHER_ROLE, votingAddress);
    await tx6.wait();
    console.log("   ✅ Granted SLASHER_ROLE to VotingContract");

    // Note: RELAYER_ROLE should be granted to the backend service address
    console.log("\n⚠️  Note: Remember to grant RELAYER_ROLE to your backend service address:");
    console.log(`   await oracleContract.grantRole(RELAYER_ROLE, <backend_address>);`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 0G TESTNET DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(60));
    console.log("\n📋 Deployed Contracts:");
    console.log("  OraiToken:         ", oraiTokenAddress);
    console.log("  VotingContract:    ", votingAddress);
    console.log("  OracleContract:    ", oracleAddress);
    console.log("  GovernanceContract:", governanceAddress);

    console.log("\n🔗 0G Testnet Explorer:");
    console.log(`  https://scan-testnet.0g.ai/address/${oraiTokenAddress}`);
    console.log(`  https://scan-testnet.0g.ai/address/${votingAddress}`);
    console.log(`  https://scan-testnet.0g.ai/address/${oracleAddress}`);
    console.log(`  https://scan-testnet.0g.ai/address/${governanceAddress}`);

    // Save deployment info
    const deploymentInfo = {
      network: "0g-testnet",
      chainId: 16600,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        OraiToken: oraiTokenAddress,
        VotingContract: votingAddress,
        OracleContract: oracleAddress,
        GovernanceContract: governanceAddress
      },
      explorer: {
        OraiToken: `https://scan-testnet.0g.ai/address/${oraiTokenAddress}`,
        VotingContract: `https://scan-testnet.0g.ai/address/${votingAddress}`,
        OracleContract: `https://scan-testnet.0g.ai/address/${oracleAddress}`,
        GovernanceContract: `https://scan-testnet.0g.ai/address/${governanceAddress}`
      },
      configuration: {
        minOracleFee: ethers.formatEther(await oracleContract.minOracleFee()),
        rewardPercentage: (await oracleContract.REWARD_PERCENTAGE()).toString(),
        treasuryPercentage: (await oracleContract.TREASURY_PERCENTAGE()).toString(),
        relayerPercentage: (await oracleContract.RELAYER_PERCENTAGE()).toString()
      }
    };

    const deploymentPath = "deployments";
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }

    const filename = `deployment-0g-testnet-${Date.now()}.json`;
    fs.writeFileSync(
      `${deploymentPath}/${filename}`,
      JSON.stringify(deploymentInfo, null, 2)
    );

    fs.writeFileSync(
      `${deploymentPath}/0g-testnet-latest.json`,
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log(`\n📝 Deployment info saved to deployments/${filename}`);

    // Update .env file with deployed addresses
    const envPath = ".env";
    let envContent = fs.readFileSync(envPath, "utf8");

    envContent = envContent.replace(
      /ORACLE_CONTRACT_ADDRESS=.*/,
      `ORACLE_CONTRACT_ADDRESS=${oracleAddress}`
    );
    envContent = envContent.replace(
      /TOKEN_CONTRACT_ADDRESS=.*/,
      `TOKEN_CONTRACT_ADDRESS=${oraiTokenAddress}`
    );
    envContent = envContent.replace(
      /VOTING_CONTRACT_ADDRESS=.*/,
      `VOTING_CONTRACT_ADDRESS=${votingAddress}`
    );
    envContent = envContent.replace(
      /GOVERNANCE_CONTRACT_ADDRESS=.*/,
      `GOVERNANCE_CONTRACT_ADDRESS=${governanceAddress}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env file with deployed addresses");

    console.log("\n🚀 Next Steps:");
    console.log("1. Grant RELAYER_ROLE to your backend service");
    console.log("2. Verify contracts on block explorer (optional)");
    console.log("3. Test the oracle system with a sample question");
    console.log("4. Configure backend to connect to these contracts");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);

    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log("\n💡 Insufficient funds. Please get testnet tokens from:");
      console.log("   https://faucet.0g.ai");
    } else if (error.code === 'NETWORK_ERROR') {
      console.log("\n💡 Network error. Please check your connection to 0G testnet.");
    }

    throw error;
  }
}

// Run deployment
main()
  .then(() => {
    console.log("\n✨ 0G Testnet deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });