import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("OracleContract", function () {
  let oracleContract;
  let votingContract;
  let oraiToken;
  let owner;
  let relayer;
  let user1;
  let user2;
  let treasury;

  const MIN_ORACLE_FEE = ethers.parseEther("0.01");
  const VOTING_PERIOD = 24 * 60 * 60; // 24 hours

  beforeEach(async function () {
    [owner, relayer, user1, user2, treasury] = await ethers.getSigners();

    // Deploy OraiToken
    const OraiToken = await ethers.getContractFactory("OraiToken");
    oraiToken = await OraiToken.deploy();

    // Deploy VotingContract
    const VotingContract = await ethers.getContractFactory("VotingContract");
    votingContract = await VotingContract.deploy(await oraiToken.getAddress());

    // Deploy OracleContract
    const OracleContract = await ethers.getContractFactory("OracleContract");
    oracleContract = await OracleContract.deploy(treasury.address);

    // Setup contracts
    await oracleContract.setContracts(
      await votingContract.getAddress(),
      await oraiToken.getAddress()
    );

    await votingContract.setOracleContract(await oracleContract.getAddress());

    // Grant relayer role
    const RELAYER_ROLE = await oracleContract.RELAYER_ROLE();
    await oracleContract.grantRole(RELAYER_ROLE, relayer.address);

    // Setup staking for voters
    await oraiToken.transfer(user1.address, ethers.parseEther("1000"));
    await oraiToken.transfer(user2.address, ethers.parseEther("1000"));
    await oraiToken.connect(user1).stake(ethers.parseEther("100"));
    await oraiToken.connect(user2).stake(ethers.parseEther("100"));
  });

  describe("Question Submission", function () {
    it("Should allow users to submit questions with sufficient fee", async function () {
      const question = "What is the price of ETH?";
      const referenceUrls = ["https://example.com"];

      await expect(
        oracleContract.connect(user1).queryOracle(question, referenceUrls, {
          value: MIN_ORACLE_FEE
        })
      ).to.emit(oracleContract, "QuestionSubmitted");

      expect(await oracleContract.totalQuestions()).to.equal(1);
    });

    it("Should reject questions with insufficient fee", async function () {
      const question = "What is the price of ETH?";

      await expect(
        oracleContract.connect(user1).queryOracle(question, [], {
          value: ethers.parseEther("0.005")
        })
      ).to.be.revertedWith("Insufficient fee");
    });

    it("Should reject empty questions", async function () {
      await expect(
        oracleContract.connect(user1).queryOracle("", [], {
          value: MIN_ORACLE_FEE
        })
      ).to.be.revertedWith("Invalid question length");
    });

    it("Should reject questions that are too long", async function () {
      const longQuestion = "a".repeat(501);

      await expect(
        oracleContract.connect(user1).queryOracle(longQuestion, [], {
          value: MIN_ORACLE_FEE
        })
      ).to.be.revertedWith("Invalid question length");
    });

    it("Should generate unique question IDs", async function () {
      const question = "What is the price of ETH?";

      const tx1 = await oracleContract.connect(user1).queryOracle(question, [], {
        value: MIN_ORACLE_FEE
      });
      const receipt1 = await tx1.wait();
      const event1 = receipt1.logs.find(log => log.fragment?.name === "QuestionSubmitted");
      const questionId1 = event1.args[0];

      // Advance time to ensure different timestamp
      await time.increase(1);

      const tx2 = await oracleContract.connect(user1).queryOracle(question, [], {
        value: MIN_ORACLE_FEE
      });
      const receipt2 = await tx2.wait();
      const event2 = receipt2.logs.find(log => log.fragment?.name === "QuestionSubmitted");
      const questionId2 = event2.args[0];

      expect(questionId1).to.not.equal(questionId2);
    });

    it("Should track user questions", async function () {
      const question = "What is the price of ETH?";

      await oracleContract.connect(user1).queryOracle(question, [], {
        value: MIN_ORACLE_FEE
      });

      const userQuestions = await oracleContract.getUserQuestions(user1.address);
      expect(userQuestions.length).to.equal(1);
    });
  });

  describe("Answer Submission", function () {
    let questionId;

    beforeEach(async function () {
      // Submit a question
      const question = "What is the price of ETH?";
      const tx = await oracleContract.connect(user1).queryOracle(question, [], {
        value: MIN_ORACLE_FEE
      });
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment?.name === "QuestionSubmitted");
      questionId = event.args[0];
    });

    it("Should allow relayer to submit answers", async function () {
      const answer = "$3000";
      const storageHash = ethers.keccak256(ethers.toUtf8Bytes(answer));
      const modelHash = ethers.keccak256(ethers.toUtf8Bytes("gpt-4"));
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("input"));
      const outputHash = ethers.keccak256(ethers.toUtf8Bytes("output"));

      await expect(
        oracleContract.connect(relayer).submitAnswer(
          questionId,
          answer,
          storageHash,
          modelHash,
          inputHash,
          outputHash
        )
      ).to.emit(oracleContract, "AnswerSubmitted");

      expect(await oracleContract.totalAnswers()).to.equal(1);
    });

    it("Should reject answers from non-relayers", async function () {
      const answer = "$3000";
      const storageHash = ethers.keccak256(ethers.toUtf8Bytes(answer));

      await expect(
        oracleContract.connect(user1).submitAnswer(
          questionId,
          answer,
          storageHash,
          ethers.zeroPadValue("0x", 32),
          ethers.zeroPadValue("0x", 32),
          ethers.zeroPadValue("0x", 32)
        )
      ).to.be.reverted;
    });

    it("Should reject answers for non-existent questions", async function () {
      const fakeQuestionId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const answer = "$3000";
      const storageHash = ethers.keccak256(ethers.toUtf8Bytes(answer));

      await expect(
        oracleContract.connect(relayer).submitAnswer(
          fakeQuestionId,
          answer,
          storageHash,
          ethers.zeroPadValue("0x", 32),
          ethers.zeroPadValue("0x", 32),
          ethers.zeroPadValue("0x", 32)
        )
      ).to.be.revertedWith("Question does not exist");
    });

    it("Should reject duplicate answers", async function () {
      const answer = "$3000";
      const storageHash = ethers.keccak256(ethers.toUtf8Bytes(answer));

      await oracleContract.connect(relayer).submitAnswer(
        questionId,
        answer,
        storageHash,
        ethers.zeroPadValue("0x", 32),
        ethers.zeroPadValue("0x", 32),
        ethers.zeroPadValue("0x", 32)
      );

      await expect(
        oracleContract.connect(relayer).submitAnswer(
          questionId,
          answer,
          storageHash,
          ethers.zeroPadValue("0x", 32),
          ethers.zeroPadValue("0x", 32),
          ethers.zeroPadValue("0x", 32)
        )
      ).to.be.revertedWith("Question already answered");
    });

    it("Should start voting after answer submission", async function () {
      const answer = "$3000";
      const storageHash = ethers.keccak256(ethers.toUtf8Bytes(answer));

      const tx = await oracleContract.connect(relayer).submitAnswer(
        questionId,
        answer,
        storageHash,
        ethers.zeroPadValue("0x", 32),
        ethers.zeroPadValue("0x", 32),
        ethers.zeroPadValue("0x", 32)
      );

      await expect(tx).to.emit(votingContract, "VotingStarted");
    });
  });

  describe("Answer Finalization", function () {
    let questionId;
    const questionFee = ethers.parseEther("0.1");

    beforeEach(async function () {
      // Submit a question with higher fee
      const question = "What is the price of ETH?";
      const tx = await oracleContract.connect(user1).queryOracle(question, [], {
        value: questionFee
      });
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment?.name === "QuestionSubmitted");
      questionId = event.args[0];

      // Submit an answer
      const answer = "$3000";
      const storageHash = ethers.keccak256(ethers.toUtf8Bytes(answer));
      await oracleContract.connect(relayer).submitAnswer(
        questionId,
        answer,
        storageHash,
        ethers.zeroPadValue("0x", 32),
        ethers.zeroPadValue("0x", 32),
        ethers.zeroPadValue("0x", 32)
      );
    });

    it("Should finalize answer after voting approval", async function () {
      // Vote on the answer
      await votingContract.connect(user1).castVote(questionId, true);
      await votingContract.connect(user2).castVote(questionId, true);

      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);

      // Get oracle operator role and finalize voting
      const ORACLE_ROLE = await votingContract.ORACLE_ROLE();
      await votingContract.grantRole(ORACLE_ROLE, owner.address);

      // Finalize voting (this should trigger oracle finalization)
      await votingContract.distributeRewards(questionId, questionFee);

      // Check if answer is verified
      expect(await oracleContract.isAnswerVerified(questionId)).to.equal(true);
    });

    it("Should return fee to asker if answer is rejected", async function () {
      // Vote against the answer
      await votingContract.connect(user1).castVote(questionId, false);
      await votingContract.connect(user2).castVote(questionId, false);

      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);

      // Get oracle operator role and finalize voting
      const ORACLE_ROLE = await votingContract.ORACLE_ROLE();
      await votingContract.grantRole(ORACLE_ROLE, owner.address);

      const balanceBefore = await ethers.provider.getBalance(user1.address);

      // Finalize voting
      await votingContract.distributeRewards(questionId, questionFee);

      const balanceAfter = await ethers.provider.getBalance(user1.address);

      // User should receive refund (answer rejected)
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Configuration", function () {
    it("Should allow admin to update configuration", async function () {
      const newMinFee = ethers.parseEther("0.02");
      const newMaxQuestionLength = 1000;
      const newMaxReferenceUrls = 10;

      await oracleContract.updateConfig(newMinFee, newMaxQuestionLength, newMaxReferenceUrls);

      expect(await oracleContract.minOracleFee()).to.equal(newMinFee);
      expect(await oracleContract.maxQuestionLength()).to.equal(newMaxQuestionLength);
      expect(await oracleContract.maxReferenceUrls()).to.equal(newMaxReferenceUrls);
    });

    it("Should reject configuration updates from non-admin", async function () {
      await expect(
        oracleContract.connect(user1).updateConfig(
          ethers.parseEther("0.02"),
          1000,
          10
        )
      ).to.be.reverted;
    });

    it("Should allow admin to update treasury", async function () {
      await oracleContract.updateTreasury(user2.address);
      expect(await oracleContract.treasury()).to.equal(user2.address);
    });

    it("Should reject zero address for treasury", async function () {
      await expect(
        oracleContract.updateTreasury(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid treasury");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow admin to pause and unpause", async function () {
      await oracleContract.pause();

      // Should reject question submission when paused
      await expect(
        oracleContract.connect(user1).queryOracle("Test", [], {
          value: MIN_ORACLE_FEE
        })
      ).to.be.revertedWithCustomError(oracleContract, "EnforcedPause");

      await oracleContract.unpause();

      // Should allow question submission when unpaused
      await expect(
        oracleContract.connect(user1).queryOracle("Test", [], {
          value: MIN_ORACLE_FEE
        })
      ).to.emit(oracleContract, "QuestionSubmitted");
    });

    it("Should reject pause from non-admin", async function () {
      await expect(
        oracleContract.connect(user1).pause()
      ).to.be.reverted;
    });
  });

  describe("Getters", function () {
    let questionId;

    beforeEach(async function () {
      // Submit a question and answer
      const question = "What is the price of ETH?";
      const tx = await oracleContract.connect(user1).queryOracle(question, ["https://example.com"], {
        value: MIN_ORACLE_FEE
      });
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment?.name === "QuestionSubmitted");
      questionId = event.args[0];

      const answer = "$3000";
      const storageHash = ethers.keccak256(ethers.toUtf8Bytes(answer));
      await oracleContract.connect(relayer).submitAnswer(
        questionId,
        answer,
        storageHash,
        ethers.zeroPadValue("0x", 32),
        ethers.zeroPadValue("0x", 32),
        ethers.zeroPadValue("0x", 32)
      );
    });

    it("Should get question details", async function () {
      const question = await oracleContract.getQuestion(questionId);

      expect(question.asker).to.equal(user1.address);
      expect(question.question).to.equal("What is the price of ETH?");
      expect(question.fee).to.equal(MIN_ORACLE_FEE);
      expect(question.answered).to.equal(true);
    });

    it("Should get answer details", async function () {
      const [answer, verified] = await oracleContract.getAnswer(questionId);

      expect(answer).to.equal("$3000");
      expect(verified).to.equal(false); // Not verified until voting completes
    });

    it("Should revert when getting non-existent answer", async function () {
      const fakeQuestionId = ethers.keccak256(ethers.toUtf8Bytes("fake"));

      await expect(
        oracleContract.getAnswer(fakeQuestionId)
      ).to.be.revertedWith("No answer available");
    });
  });
});