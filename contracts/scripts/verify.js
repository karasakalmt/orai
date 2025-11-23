import { run } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🔍 Starting contract verification...\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments/latest.json");

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment found. Run 'npm run deploy' first.");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { contracts, configuration } = deployment;

  console.log("Verifying contracts deployed at:", deployment.deployedAt);
  console.log("Network:", deployment.network);
  console.log("\n");

  // Contracts to verify
  const verificationTasks = [
    {
      name: "OraiToken",
      address: contracts.OraiToken,
      constructorArguments: []
    },
    {
      name: "VotingContract",
      address: contracts.VotingContract,
      constructorArguments: [contracts.OraiToken]
    },
    {
      name: "OracleContract",
      address: contracts.OracleContract,
      constructorArguments: [configuration.treasury]
    },
    {
      name: "GovernanceContract",
      address: contracts.GovernanceContract,
      constructorArguments: [
        contracts.OraiToken,
        contracts.TimelockController,
        configuration.votingDelay,
        configuration.votingPeriod,
        configuration.proposalThreshold,
        configuration.quorumPercentage
      ]
    },
    {
      name: "TimelockController",
      address: contracts.TimelockController,
      contract: "@openzeppelin/contracts/governance/TimelockController.sol:TimelockController",
      constructorArguments: [
        configuration.timelockDelay,
        [],
        [],
        deployment.deployer
      ]
    }
  ];

  // Verify each contract
  for (const task of verificationTasks) {
    console.log(`Verifying ${task.name}...`);

    try {
      const verifyConfig = {
        address: task.address,
        constructorArguments: task.constructorArguments
      };

      if (task.contract) {
        verifyConfig.contract = task.contract;
      }

      await run("verify:verify", verifyConfig);

      console.log(`✅ ${task.name} verified successfully!\n`);
    } catch (error) {
      if (error.message.includes("already verified")) {
        console.log(`ℹ️  ${task.name} is already verified.\n`);
      } else {
        console.error(`❌ Failed to verify ${task.name}:`, error.message, "\n");
      }
    }
  }

  console.log("\n✨ Verification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });