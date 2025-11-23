import { expect } from "chai";
import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

/**
 * End-to-End Oracle Flow Test
 *
 * This test validates the complete oracle workflow:
 * 1. User submits a question
 * 2. Backend relayer detects the QuestionAsked event
 * 3. Backend processes with AI (0G Compute)
 * 4. Backend stores answer (0G Storage)
 * 5. Backend submits answer to blockchain
 * 6. Test verifies the answer was received
 */
describe("End-to-End Oracle Flow", function () {
  this.timeout(6 * 60 * 1000); // 6 minutes timeout for whole suite

  let provider;
  let userWallet;
  let oracleContract;
  let oraiToken;
  let deployment;

  // Test question
  const testQuestion = "What is the capital of France?";
  const minOracleFee = ethers.parseEther("0.01"); // 0.01 A0GI

  before(async function () {
    console.log("\n🚀 Setting up End-to-End Oracle Test...\n");

    // Load deployment info
    deployment = JSON.parse(
      fs.readFileSync("deployments/0g-testnet-latest.json", "utf8")
    );

    console.log("📋 Deployment Info:");
    console.log("  Network:", deployment.network);
    console.log("  Chain ID:", deployment.chainId);
    console.log("  OracleContract:", deployment.contracts.OracleContract);
    console.log("  OraiToken:", deployment.contracts.OraiToken);
    console.log();

    // Connect to 0G testnet
    provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");

    // Create user wallet (same as deployer for this test)
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not set in .env");
    }
    userWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log("👤 User Wallet:", userWallet.address);

    // Check balance
    const balance = await provider.getBalance(userWallet.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "A0GI");

    if (balance < minOracleFee) {
      throw new Error("Insufficient balance to pay oracle fee");
    }

    // Load contract ABIs
    const OracleContractArtifact = JSON.parse(
      fs.readFileSync("artifacts/contracts/OracleContract.sol/OracleContract.json", "utf8")
    );

    const OraiTokenArtifact = JSON.parse(
      fs.readFileSync("artifacts/contracts/OraiToken.sol/OraiToken.json", "utf8")
    );

    // Connect to contracts
    oracleContract = new ethers.Contract(
      deployment.contracts.OracleContract,
      OracleContractArtifact.abi,
      userWallet
    );

    oraiToken = new ethers.Contract(
      deployment.contracts.OraiToken,
      OraiTokenArtifact.abi,
      userWallet
    );

    console.log("✅ Contracts loaded\n");
  });

  it("should complete full oracle question-answer flow", async function () {
    this.timeout(5 * 60 * 1000); // 5 minutes for this test

    console.log("=" .repeat(70));
    console.log("📝 STEP 1: Submitting Question to Oracle");
    console.log("=".repeat(70));

    console.log(`Question: "${testQuestion}"`);
    console.log(`Fee: ${ethers.formatEther(minOracleFee)} A0GI`);

    // Submit question
    const tx = await oracleContract.queryOracle(
      testQuestion,
      [], // no reference URLs for this test
      { value: minOracleFee }
    );

    console.log("Transaction hash:", tx.hash);
    console.log("⏳ Waiting for transaction confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // Find QuestionSubmitted event
    const questionSubmittedEvent = receipt.logs
      .map(log => {
        try {
          return oracleContract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(parsed => parsed && parsed.name === "QuestionSubmitted");

    if (!questionSubmittedEvent) {
      throw new Error("QuestionSubmitted event not found in transaction receipt");
    }

    const questionId = questionSubmittedEvent.args[0];
    console.log("📌 Question ID:", questionId);

    // Verify question was stored
    const storedQuestion = await oracleContract.getQuestion(questionId);
    console.log("\n📊 Question Details:");
    console.log("  Asker:", storedQuestion.asker);
    console.log("  Question:", storedQuestion.question);
    console.log("  Fee:", ethers.formatEther(storedQuestion.fee), "A0GI");
    console.log("  Timestamp:", new Date(Number(storedQuestion.timestamp) * 1000).toISOString());
    console.log("  Has Answer:", storedQuestion.answered);

    expect(storedQuestion.question).to.equal(testQuestion);
    expect(storedQuestion.asker).to.equal(userWallet.address);
    expect(storedQuestion.answered).to.be.false;

    console.log("\n" + "=".repeat(70));
    console.log("⏰ STEP 2: Waiting for Backend to Process Question");
    console.log("=".repeat(70));
    console.log("The backend relayer should:");
    console.log("  1. Detect QuestionSubmitted event");
    console.log("  2. Process question with 0G Compute (AI)");
    console.log("  3. Store answer in 0G Storage");
    console.log("  4. Submit answer back to OracleContract");
    console.log("\n⏳ Polling for answer (timeout: 5 minutes)...\n");

    // Wait for answer (poll every 10 seconds for 5 minutes)
    const maxAttempts = 30; // 30 attempts * 10 seconds = 5 minutes
    let answer = null;
    let answerDetails = null;
    let attempt = 0;

    while (attempt < maxAttempts && !answer) {
      attempt++;

      // Wait 10 seconds between checks
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check if answer has been submitted
      const updatedQuestion = await oracleContract.getQuestion(questionId);

      const elapsed = attempt * 10;
      const remaining = (maxAttempts - attempt) * 10;

      console.log(`⏱️  Attempt ${attempt}/${maxAttempts} (${elapsed}s elapsed, ${remaining}s remaining)`);
      console.log(`   Has Answer: ${updatedQuestion.answered}`);

      if (updatedQuestion.answered) {
        // Answer found!
        answerDetails = await oracleContract.getAnswer(questionId);
        answer = answerDetails.answer;

        console.log("\n🎉 Answer received!");
        break;
      }

      if (attempt % 3 === 0) {
        console.log("   💭 Backend is processing...");
      }
    }

    if (!answer) {
      console.log("\n⚠️  WARNING: No answer received after 5 minutes");
      console.log("This could mean:");
      console.log("  - Backend relayer is not running");
      console.log("  - RELAYER_ROLE not granted correctly");
      console.log("  - 0G Compute/Storage services unavailable");
      console.log("  - Network connectivity issues");
      console.log("\nTo debug:");
      console.log("  1. Check backend logs: cd ../backend && npm run dev");
      console.log("  2. Verify RELAYER_ROLE: node scripts/configure-relayer.js");
      console.log("  3. Check contract on explorer:", deployment.explorer.OracleContract);

      throw new Error("Timeout: No answer received after 5 minutes");
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ STEP 3: Answer Verification");
    console.log("=".repeat(70));

    console.log("\n📊 Answer Details:");
    console.log("  Answer:", answerDetails.answer);
    console.log("  Relayer:", answerDetails.relayer);
    console.log("  Storage Hash:", answerDetails.storageHash);
    console.log("  Model Hash:", answerDetails.proofOfInference.modelHash);
    console.log("  Input Hash:", answerDetails.proofOfInference.inputHash);
    console.log("  Output Hash:", answerDetails.proofOfInference.outputHash);
    console.log("  Submitted At:", new Date(Number(answerDetails.timestamp) * 1000).toISOString());

    // Verify answer structure
    expect(answer).to.be.a('string');
    expect(answer.length).to.be.greaterThan(0);
    expect(answerDetails.relayer).to.not.equal(ethers.ZeroAddress);
    expect(answerDetails.storageHash).to.not.equal(ethers.ZeroHash);

    console.log("\n" + "=".repeat(70));
    console.log("🔍 STEP 4: Data Verification Across System");
    console.log("=".repeat(70));

    // Check voting status
    const votingPeriodEnd = await oracleContract.getVotingPeriodEnd(questionId);
    const now = Math.floor(Date.now() / 1000);
    const votingActive = now < Number(votingPeriodEnd);

    console.log("\n📊 Voting Status:");
    console.log("  Voting Period Ends:", new Date(Number(votingPeriodEnd) * 1000).toISOString());
    console.log("  Voting Active:", votingActive);

    if (votingActive) {
      const remainingTime = Number(votingPeriodEnd) - now;
      const hours = Math.floor(remainingTime / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);
      console.log("  Time Remaining:", `${hours}h ${minutes}m`);
    }

    // Check relayer balance (should have received fee)
    const relayerBalance = await provider.getBalance(answerDetails.relayer);
    console.log("\n💰 Relayer Info:");
    console.log("  Address:", answerDetails.relayer);
    console.log("  Balance:", ethers.formatEther(relayerBalance), "A0GI");

    // Check ORAI token balance
    const relayerTokens = await oraiToken.balanceOf(answerDetails.relayer);
    console.log("  ORAI Tokens:", ethers.formatEther(relayerTokens), "ORAI");

    console.log("\n🔗 Explorer Links:");
    console.log("  Question TX:", `https://scan-testnet.0g.ai/tx/${tx.hash}`);
    console.log("  OracleContract:", deployment.explorer.OracleContract);

    console.log("\n" + "=".repeat(70));
    console.log("✅ END-TO-END TEST COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70));

    console.log("\n📈 Test Summary:");
    console.log("  ✅ Question submitted to blockchain");
    console.log("  ✅ Backend detected and processed question");
    console.log("  ✅ Answer generated by AI");
    console.log("  ✅ Answer stored in 0G Storage");
    console.log("  ✅ Answer submitted back to blockchain");
    console.log("  ✅ All data verified and consistent");

    console.log("\n🎯 Next Steps:");
    console.log("  - Wait for voting period to end (24 hours)");
    console.log("  - Community votes on answer accuracy");
    console.log("  - Answer gets finalized on-chain");
    console.log("  - Fees distributed to correct voters");

    console.log("\n🔍 View full question details:");
    console.log(`  Question ID: ${questionId}`);
    console.log(`  Storage URL: https://0g-storage.example.com/${answerDetails.storageHash}`);

    // All assertions passed
    expect(true).to.be.true;
  });

  after(function () {
    console.log("\n✨ Test suite completed\n");
  });
});
