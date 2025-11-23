import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🔧 Setting up relayer and initial configuration...\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments/latest.json");

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment found. Run 'npm run deploy' first.");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { contracts } = deployment;

  // Get signers
  const [deployer, relayer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Use second account as relayer, or specify your relayer address here
  const RELAYER_ADDRESS = relayer?.address || process.env.RELAYER_ADDRESS;

  if (!RELAYER_ADDRESS) {
    console.error("❌ No relayer address found. Set RELAYER_ADDRESS in .env");
    return;
  }

  console.log("Relayer address:", RELAYER_ADDRESS);
  console.log("\n");

  try {
    // Connect to OracleContract
    const OracleContract = await ethers.getContractFactory("OracleContract");
    const oracleContract = OracleContract.attach(contracts.OracleContract);

    // Grant RELAYER_ROLE
    console.log("1. Granting RELAYER_ROLE to relayer address...");
    const RELAYER_ROLE = await oracleContract.RELAYER_ROLE();
    const tx1 = await oracleContract.grantRole(RELAYER_ROLE, RELAYER_ADDRESS);
    await tx1.wait();
    console.log("✅ RELAYER_ROLE granted!");

    // Check if role was granted
    const hasRole = await oracleContract.hasRole(RELAYER_ROLE, RELAYER_ADDRESS);
    console.log("   Verification: Relayer has role?", hasRole);

    // Optional: Setup initial token distribution for testing
    console.log("\n2. Setting up initial token distribution...");
    const OraiToken = await ethers.getContractFactory("OraiToken");
    const oraiToken = OraiToken.attach(contracts.OraiToken);

    // Transfer some tokens to relayer for gas fees
    const relayerTokenAmount = ethers.parseEther("1000");
    const tx2 = await oraiToken.transfer(RELAYER_ADDRESS, relayerTokenAmount);
    await tx2.wait();
    console.log(`✅ Transferred ${ethers.formatEther(relayerTokenAmount)} ORAI to relayer`);

    // Optional: Transfer tokens to test accounts
    const testAccounts = [
      // Add test account addresses here if needed
    ];

    for (const account of testAccounts) {
      const amount = ethers.parseEther("100");
      const tx = await oraiToken.transfer(account, amount);
      await tx.wait();
      console.log(`✅ Transferred ${ethers.formatEther(amount)} ORAI to ${account}`);
    }

    // Display current configuration
    console.log("\n3. Current Oracle Configuration:");
    console.log("-" * 40);
    const minOracleFee = await oracleContract.minOracleFee();
    const maxQuestionLength = await oracleContract.maxQuestionLength();
    const maxReferenceUrls = await oracleContract.maxReferenceUrls();

    console.log(`Min Oracle Fee: ${ethers.formatEther(minOracleFee)} ETH`);
    console.log(`Max Question Length: ${maxQuestionLength}`);
    console.log(`Max Reference URLs: ${maxReferenceUrls}`);

    // Display fee distribution
    console.log("\n4. Fee Distribution:");
    console.log("-" * 40);
    const REWARD_PERCENTAGE = await oracleContract.REWARD_PERCENTAGE();
    const TREASURY_PERCENTAGE = await oracleContract.TREASURY_PERCENTAGE();
    const RELAYER_PERCENTAGE = await oracleContract.RELAYER_PERCENTAGE();

    console.log(`Rewards to voters: ${REWARD_PERCENTAGE}%`);
    console.log(`Treasury allocation: ${TREASURY_PERCENTAGE}%`);
    console.log(`Relayer compensation: ${RELAYER_PERCENTAGE}%`);

    console.log("\n✨ Setup completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("1. Configure your backend with the relayer private key");
    console.log("2. Set up the backend API endpoints");
    console.log("3. Connect to 0G Compute nodes for AI processing");
    console.log("4. Test with a sample question submission");

    // Save relayer setup info
    const setupInfo = {
      setupAt: new Date().toISOString(),
      relayerAddress: RELAYER_ADDRESS,
      relayerRole: RELAYER_ROLE,
      configuration: {
        minOracleFee: ethers.formatEther(minOracleFee),
        maxQuestionLength: maxQuestionLength.toString(),
        maxReferenceUrls: maxReferenceUrls.toString(),
        rewardPercentage: REWARD_PERCENTAGE.toString(),
        treasuryPercentage: TREASURY_PERCENTAGE.toString(),
        relayerPercentage: RELAYER_PERCENTAGE.toString()
      }
    };

    fs.writeFileSync(
      path.join(__dirname, "../deployments/relayer-setup.json"),
      JSON.stringify(setupInfo, null, 2)
    );

    console.log("\n📝 Setup info saved to deployments/relayer-setup.json");

  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });