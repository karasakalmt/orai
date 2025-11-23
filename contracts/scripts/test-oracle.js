import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🧪 Testing Oracle System...\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments/latest.json");

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment found. Run 'npm run deploy' first.");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { contracts } = deployment;

  // Get signers
  const [deployer, relayer, user1, user2] = await ethers.getSigners();
  console.log("Testing with accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  Relayer:", relayer.address);
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);
  console.log("\n");

  try {
    // Connect to contracts
    const OracleContract = await ethers.getContractFactory("OracleContract");
    const oracleContract = OracleContract.attach(contracts.OracleContract);

    const VotingContract = await ethers.getContractFactory("VotingContract");
    const votingContract = VotingContract.attach(contracts.VotingContract);

    const OraiToken = await ethers.getContractFactory("OraiToken");
    const oraiToken = OraiToken.attach(contracts.OraiToken);

    // ============================
    // 1. Setup test users with tokens
    // ============================
    console.log("1. Setting up test users...");

    // Transfer tokens to users for staking
    const tokenAmount = ethers.parseEther("1000");
    await oraiToken.transfer(user1.address, tokenAmount);
    await oraiToken.transfer(user2.address, tokenAmount);

    // Users stake tokens for voting
    const stakeAmount = ethers.parseEther("100");
    await oraiToken.connect(user1).stake(stakeAmount);
    await oraiToken.connect(user2).stake(stakeAmount);

    console.log("✅ Users funded and staked");

    // ============================
    // 2. Submit a question
    // ============================
    console.log("\n2. Submitting a question...");

    const question = "What is the current price of Bitcoin in USD?";
    const referenceUrls = ["https://coinmarketcap.com", "https://coingecko.com"];
    const questionFee = ethers.parseEther("0.05");

    const tx1 = await oracleContract.connect(user1).queryOracle(
      question,
      referenceUrls,
      { value: questionFee }
    );

    const receipt1 = await tx1.wait();
    const questionEvent = receipt1.logs.find(log =>
      log.fragment?.name === "QuestionSubmitted"
    );
    const questionId = questionEvent.args[0];

    console.log("✅ Question submitted!");
    console.log("   Question ID:", questionId);
    console.log("   Question:", question);
    console.log("   Fee paid:", ethers.formatEther(questionFee), "ETH");

    // ============================
    // 3. Relayer submits answer
    // ============================
    console.log("\n3. Relayer submitting answer...");

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const answer = "$98,542.31 USD per Bitcoin";
    const storageHash = ethers.keccak256(ethers.toUtf8Bytes(answer));
    const modelHash = ethers.keccak256(ethers.toUtf8Bytes("gpt-4"));
    const inputHash = ethers.keccak256(ethers.toUtf8Bytes(question));
    const outputHash = ethers.keccak256(ethers.toUtf8Bytes(answer));

    // Grant relayer role if not already granted
    const RELAYER_ROLE = await oracleContract.RELAYER_ROLE();
    const hasRole = await oracleContract.hasRole(RELAYER_ROLE, relayer.address);
    if (!hasRole) {
      await oracleContract.grantRole(RELAYER_ROLE, relayer.address);
      console.log("   Granted RELAYER_ROLE to relayer");
    }

    const tx2 = await oracleContract.connect(relayer).submitAnswer(
      questionId,
      answer,
      storageHash,
      modelHash,
      inputHash,
      outputHash
    );

    const receipt2 = await tx2.wait();
    const answerEvent = receipt2.logs.find(log =>
      log.fragment?.name === "AnswerSubmitted"
    );

    console.log("✅ Answer submitted!");
    console.log("   Answer:", answer);
    console.log("   Storage Hash:", storageHash);

    // Get voting round ID
    const votingEvent = receipt2.logs.find(log =>
      log.fragment?.name === "VotingStarted"
    );
    console.log("   Voting started for verification");

    // ============================
    // 4. Users vote on answer
    // ============================
    console.log("\n4. Users voting on answer...");

    // User1 approves the answer
    await votingContract.connect(user1).castVote(questionId, true);
    console.log("   User1 voted: APPROVE ✅");

    // User2 approves the answer
    await votingContract.connect(user2).castVote(questionId, false);
    console.log("   User2 voted: REJECT ❌");

    // Get voting info
    const votingInfo = await votingContract.getVotingRoundInfo(questionId);
    console.log("\n   Voting Status:");
    console.log("   - Votes For:", ethers.formatEther(votingInfo.totalVotesFor), "ORAI");
    console.log("   - Votes Against:", ethers.formatEther(votingInfo.totalVotesAgainst), "ORAI");

    // ============================
    // 5. Check answer status (before finalization)
    // ============================
    console.log("\n5. Checking answer status...");

    const [answerText, isVerified] = await oracleContract.getAnswer(questionId);
    console.log("   Answer:", answerText);
    console.log("   Verified:", isVerified ? "Yes ✅" : "Not yet ⏳");

    console.log("\n⚠️  Note: In production, voting period is 24 hours.");
    console.log("   To finalize voting, you would:");
    console.log("   1. Wait for voting period to end");
    console.log("   2. Call votingContract.distributeRewards()");
    console.log("   3. Answer will be automatically finalized");

    // ============================
    // 6. Display system statistics
    // ============================
    console.log("\n6. System Statistics:");
    console.log("-" * 40);

    const totalQuestions = await oracleContract.totalQuestions();
    const totalAnswers = await oracleContract.totalAnswers();
    const totalFeesCollected = await oracleContract.totalFeesCollected();

    console.log(`Total Questions: ${totalQuestions}`);
    console.log(`Total Answers: ${totalAnswers}`);
    console.log(`Total Fees Collected: ${ethers.formatEther(totalFeesCollected)} ETH`);

    // Get user's questions
    const userQuestions = await oracleContract.getUserQuestions(user1.address);
    console.log(`\nUser1's questions: ${userQuestions.length}`);
    console.log(`Question IDs:`, userQuestions);

    console.log("\n✨ Oracle system test completed successfully!");

    // Save test results
    const testResults = {
      testedAt: new Date().toISOString(),
      questionId: questionId,
      question: question,
      answer: answer,
      storageHash: storageHash,
      votingStatus: {
        votesFor: ethers.formatEther(votingInfo.totalVotesFor),
        votesAgainst: ethers.formatEther(votingInfo.totalVotesAgainst)
      },
      systemStats: {
        totalQuestions: totalQuestions.toString(),
        totalAnswers: totalAnswers.toString(),
        totalFeesCollected: ethers.formatEther(totalFeesCollected)
      }
    };

    fs.writeFileSync(
      path.join(__dirname, "../deployments/test-results.json"),
      JSON.stringify(testResults, null, 2)
    );

    console.log("\n📝 Test results saved to deployments/test-results.json");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });