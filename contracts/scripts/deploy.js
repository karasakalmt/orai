import hardhat from "hardhat";
const { ethers } = hardhat;
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting Orai Oracle System Deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Configuration
  const config = {
    // Governance parameters
    votingDelay: 1, // 1 block
    votingPeriod: 50400, // ~7 days with 12s blocks
    proposalThreshold: ethers.parseEther("100"), // 100 ORAI tokens to create proposal
    quorumPercentage: 4, // 4% quorum
    timelockDelay: 2 * 24 * 60 * 60, // 2 days timelock

    // Oracle parameters
    minOracleFee: ethers.parseEther("0.01"),
    maxQuestionLength: 500,
    maxReferenceUrls: 5,

    // Token parameters
    initialSupply: ethers.parseEther("100000000"), // 100M ORAI
    minStakeAmount: ethers.parseEther("10"),

    // Treasury address (change this to your treasury)
    treasury: deployer.address // Using deployer as treasury for testing
  };

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
    // 2. Deploy TimelockController (for Governance)
    // ============================
    console.log("\n2. Deploying TimelockController...");
    const minDelay = config.timelockDelay;
    const proposers = []; // Will be set to Governor
    const executors = []; // Will be set to Governor
    const admin = deployer.address;

    const TimelockController = await ethers.getContractFactory("@openzeppelin/contracts/governance/TimelockController.sol:TimelockController");
    const timelock = await TimelockController.deploy(
      minDelay,
      proposers,
      executors,
      admin
    );
    await timelock.waitForDeployment();
    deployedContracts.TimelockController = await timelock.getAddress();
    console.log("✅ TimelockController deployed to:", deployedContracts.TimelockController);

    // ============================
    // 3. Deploy GovernanceContract
    // ============================
    console.log("\n3. Deploying GovernanceContract...");
    const GovernanceContract = await ethers.getContractFactory("GovernanceContract");
    const governanceContract = await GovernanceContract.deploy(
      deployedContracts.OraiToken,
      deployedContracts.TimelockController,
      config.votingDelay,
      config.votingPeriod,
      config.proposalThreshold,
      config.quorumPercentage
    );
    await governanceContract.waitForDeployment();
    deployedContracts.GovernanceContract = await governanceContract.getAddress();
    console.log("✅ GovernanceContract deployed to:", deployedContracts.GovernanceContract);

    // ============================
    // 4. Deploy VotingContract
    // ============================
    console.log("\n4. Deploying VotingContract...");
    const VotingContract = await ethers.getContractFactory("VotingContract");
    const votingContract = await VotingContract.deploy(
      deployedContracts.OraiToken
    );
    await votingContract.waitForDeployment();
    deployedContracts.VotingContract = await votingContract.getAddress();
    console.log("✅ VotingContract deployed to:", deployedContracts.VotingContract);

    // ============================
    // 5. Deploy OracleContract
    // ============================
    console.log("\n5. Deploying OracleContract...");
    const OracleContract = await ethers.getContractFactory("OracleContract");
    const oracleContract = await OracleContract.deploy(
      config.treasury
    );
    await oracleContract.waitForDeployment();
    deployedContracts.OracleContract = await oracleContract.getAddress();
    console.log("✅ OracleContract deployed to:", deployedContracts.OracleContract);

    // ============================
    // 6. Configure Contracts
    // ============================
    console.log("\n6. Configuring contracts...");

    // Setup TimelockController roles
    console.log("   Setting up TimelockController roles...");
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();

    await timelock.grantRole(PROPOSER_ROLE, deployedContracts.GovernanceContract);
    await timelock.grantRole(EXECUTOR_ROLE, deployedContracts.GovernanceContract);
    await timelock.grantRole(CANCELLER_ROLE, deployedContracts.GovernanceContract);

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

    // Setup GovernanceContract
    console.log("   Setting up GovernanceContract...");
    await governanceContract.setContracts(
      deployedContracts.OracleContract,
      deployedContracts.VotingContract,
      deployedContracts.OraiToken
    );

    // Grant necessary roles in OraiToken
    console.log("   Setting up OraiToken roles...");
    const SLASHER_ROLE = await oraiToken.SLASHER_ROLE();
    await oraiToken.grantRole(SLASHER_ROLE, deployedContracts.VotingContract);

    console.log("✅ All contracts configured successfully!");

    // ============================
    // 7. Save Deployment Info
    // ============================
    const deploymentInfo = {
      network: "0g-testnet",
      chainId: 16600,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      contracts: deployedContracts,
      configuration: config,
      roles: {
        ORACLE_ROLE: ORACLE_ROLE,
        SLASHER_ROLE: SLASHER_ROLE,
        PROPOSER_ROLE: PROPOSER_ROLE,
        EXECUTOR_ROLE: EXECUTOR_ROLE,
        CANCELLER_ROLE: CANCELLER_ROLE
      }
    };

    const deploymentPath = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }

    const filename = `deployment-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(deploymentPath, filename),
      JSON.stringify(deploymentInfo, null, 2)
    );

    fs.writeFileSync(
      path.join(deploymentPath, "latest.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n📝 Deployment info saved to:", path.join(deploymentPath, filename));

    // ============================
    // 8. Update .env file
    // ============================
    const envPath = path.join(__dirname, "../.env");
    let envContent = fs.readFileSync(envPath, "utf8");

    // Update contract addresses in .env
    envContent = envContent.replace(
      /ORACLE_CONTRACT_ADDRESS=.*/,
      `ORACLE_CONTRACT_ADDRESS=${deployedContracts.OracleContract}`
    );
    envContent = envContent.replace(
      /TOKEN_CONTRACT_ADDRESS=.*/,
      `TOKEN_CONTRACT_ADDRESS=${deployedContracts.OraiToken}`
    );
    envContent = envContent.replace(
      /VOTING_CONTRACT_ADDRESS=.*/,
      `VOTING_CONTRACT_ADDRESS=${deployedContracts.VotingContract}`
    );
    envContent = envContent.replace(
      /GOVERNANCE_CONTRACT_ADDRESS=.*/,
      `GOVERNANCE_CONTRACT_ADDRESS=${deployedContracts.GovernanceContract}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env file with deployed addresses\n");

    // ============================
    // 9. Display Summary
    // ============================
    console.log("=" * 60);
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=" * 60);
    console.log("\nDeployed Contracts:");
    console.log("-" * 40);
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name.padEnd(20)} : ${address}`);
    });
    console.log("\n📋 Next Steps:");
    console.log("1. Grant RELAYER_ROLE to your backend address in OracleContract");
    console.log("2. Fund the contracts if needed");
    console.log("3. Verify contracts on block explorer");
    console.log("4. Test the system with a sample question");

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