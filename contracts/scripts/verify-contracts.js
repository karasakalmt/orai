import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function main() {
  console.log("🔍 Starting Contract Verification on 0G Testnet...\n");

  // Load deployment info
  const deploymentInfo = JSON.parse(
    fs.readFileSync('deployments/0g-testnet-latest.json', 'utf8')
  );

  const contracts = [
    {
      name: 'OraiToken',
      address: deploymentInfo.contracts.OraiToken,
      constructorArgs: []
    },
    {
      name: 'VotingContract',
      address: deploymentInfo.contracts.VotingContract,
      constructorArgs: [deploymentInfo.contracts.OraiToken]
    },
    {
      name: 'OracleContract',
      address: deploymentInfo.contracts.OracleContract,
      constructorArgs: [deploymentInfo.deployer]
    },
    {
      name: 'GovernanceContract',
      address: deploymentInfo.contracts.GovernanceContract,
      constructorArgs: [deploymentInfo.contracts.OraiToken]
    }
  ];

  console.log("📋 Contracts to verify:");
  contracts.forEach(c => {
    console.log(`  ${c.name}: ${c.address}`);
  });
  console.log();

  // Check if 0G testnet supports verification API
  console.log("⚠️  Note: 0G Testnet verification depends on their block explorer API support.");
  console.log("    Attempting verification using Hardhat verify plugin...\n");

  for (const contract of contracts) {
    try {
      console.log(`\n🔍 Verifying ${contract.name}...`);

      // Create constructor args file
      const argsFile = `scripts/verify-args-${contract.name}.js`;
      const argsContent = `export default ${JSON.stringify(contract.constructorArgs, null, 2)};`;
      fs.writeFileSync(argsFile, argsContent);

      // Try to verify using Hardhat
      const verifyCommand = `npx hardhat verify --network 0g-testnet ${contract.address} ${contract.constructorArgs.join(' ')}`;

      console.log(`   Command: ${verifyCommand}`);

      try {
        const { stdout, stderr } = await execAsync(verifyCommand);
        console.log(stdout);
        if (stderr && !stderr.includes('Warning')) {
          console.error(stderr);
        }
        console.log(`✅ ${contract.name} verified successfully!`);
      } catch (error) {
        if (error.message.includes('Already Verified')) {
          console.log(`✅ ${contract.name} already verified!`);
        } else if (error.message.includes('API key')) {
          console.log(`⚠️  ${contract.name}: Verification API not configured or not supported`);
          console.log(`   Manual verification may be required on the block explorer.`);
        } else {
          console.log(`❌ ${contract.name}: ${error.message}`);
        }
      }

      // Clean up args file
      if (fs.existsSync(argsFile)) {
        fs.unlinkSync(argsFile);
      }

    } catch (error) {
      console.error(`Error verifying ${contract.name}:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Verification Summary");
  console.log("=".repeat(60));
  console.log("\n💡 If automatic verification failed, you can manually verify contracts at:");
  console.log("   https://scan-testnet.0g.ai\n");
  console.log("   You'll need:");
  console.log("   - Contract address");
  console.log("   - Source code");
  console.log("   - Compiler version: 0.8.20");
  console.log("   - Optimization: Enabled (200 runs)");
  console.log("   - Constructor arguments (ABI-encoded)\n");

  console.log("📁 Contract Source Files:");
  console.log("   OraiToken:          contracts/OraiToken.sol");
  console.log("   VotingContract:     contracts/VotingContract.sol");
  console.log("   OracleContract:     contracts/OracleContract.sol");
  console.log("   GovernanceContract: contracts/GovernanceContract.sol\n");

  console.log("🔗 Explorer Links:");
  Object.entries(deploymentInfo.explorer).forEach(([name, url]) => {
    console.log(`   ${name.padEnd(18)}: ${url}`);
  });
}

main()
  .then(() => {
    console.log("\n✨ Verification process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  });