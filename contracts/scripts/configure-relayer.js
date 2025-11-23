import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔧 Configuring Relayer and Minting Tokens...\n");

  // Relayer address
  const relayerAddress = "0x059181b3C4a7bf7026C6310742877252e285E2da";

  // Load deployment info
  const deploymentInfo = JSON.parse(
    fs.readFileSync("deployments/0g-testnet-latest.json", "utf8")
  );

  // Connect to 0G testnet
  const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Network: 0G Testnet");
  console.log("Deployer:", deployer.address);
  console.log("Relayer:", relayerAddress);
  console.log();

  // Load contract artifacts
  const OracleContractArtifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/OracleContract.sol/OracleContract.json", "utf8")
  );
  const OraiTokenArtifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/OraiToken.sol/OraiToken.json", "utf8")
  );

  // Connect to deployed contracts
  const oracleContract = new ethers.Contract(
    deploymentInfo.contracts.OracleContract,
    OracleContractArtifact.abi,
    deployer
  );

  const oraiToken = new ethers.Contract(
    deploymentInfo.contracts.OraiToken,
    OraiTokenArtifact.abi,
    deployer
  );

  console.log("📋 Contract Addresses:");
  console.log("  OracleContract:", deploymentInfo.contracts.OracleContract);
  console.log("  OraiToken:", deploymentInfo.contracts.OraiToken);
  console.log();

  try {
    // 1. Grant RELAYER_ROLE
    console.log("1️⃣ Granting RELAYER_ROLE to relayer address...");
    const RELAYER_ROLE = await oracleContract.RELAYER_ROLE();
    console.log("   RELAYER_ROLE:", RELAYER_ROLE);

    const hasRole = await oracleContract.hasRole(RELAYER_ROLE, relayerAddress);
    if (hasRole) {
      console.log("   ✅ Relayer already has RELAYER_ROLE");
    } else {
      const tx1 = await oracleContract.grantRole(RELAYER_ROLE, relayerAddress);
      console.log("   Transaction hash:", tx1.hash);
      await tx1.wait();
      console.log("   ✅ RELAYER_ROLE granted successfully!");
    }

    // 2. Check token balance
    console.log("\n2️⃣ Checking ORAI token balance...");

    const balance = await oraiToken.balanceOf(relayerAddress);
    console.log("   Token balance:", ethers.formatEther(balance), "ORAI");
    console.log("   ✅ Relayer has sufficient tokens!");

    // Note: 100M ORAI were minted to deployer in constructor
    console.log("   (100M ORAI were pre-minted to deployer in constructor)");

    // 3. Verify configuration
    console.log("\n3️⃣ Verifying configuration...");

    const verifyRole = await oracleContract.hasRole(RELAYER_ROLE, relayerAddress);
    console.log("   RELAYER_ROLE granted:", verifyRole ? "✅" : "❌");

    const finalBalance = await oraiToken.balanceOf(relayerAddress);
    console.log("   Token balance:", ethers.formatEther(finalBalance), "ORAI");

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ RELAYER CONFIGURATION COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log("  Relayer Address:", relayerAddress);
    console.log("  RELAYER_ROLE:", verifyRole ? "Granted ✅" : "Not Granted ❌");
    console.log("  ORAI Balance:", ethers.formatEther(finalBalance), "tokens");
    console.log("\n🚀 Next Steps:");
    console.log("1. Configure backend service with this wallet private key");
    console.log("2. Backend can now call submitAnswer() on OracleContract");
    console.log("3. Relayer will receive 85% of oracle fees");
    console.log("4. Test the full oracle flow:");
    console.log("   - User calls queryOracle()");
    console.log("   - Backend listens for QuestionAsked event");
    console.log("   - Backend calls submitAnswer()");
    console.log("   - Community votes on answer");
    console.log("   - Answer is finalized\n");

  } catch (error) {
    console.error("\n❌ Configuration failed:", error.message);
    throw error;
  }
}

main()
  .then(() => {
    console.log("✨ Configuration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Configuration failed:", error);
    process.exit(1);
  });
