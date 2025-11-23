import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VotingContract", function () {
  let votingContract;
  let oraiToken;
  let owner;
  let oracle;
  let voter1;
  let voter2;
  let voter3;
  let nonStaker;

  const VOTING_DURATION = 24 * 60 * 60; // 24 hours
  const STAKE_AMOUNT = ethers.parseEther("100");
  const MIN_STAKE = ethers.parseEther("10");

  beforeEach(async function () {
    [owner, oracle, voter1, voter2, voter3, nonStaker] = await ethers.getSigners();

    // Deploy OraiToken
    const OraiToken = await ethers.getContractFactory("OraiToken");
    oraiToken = await OraiToken.deploy();
    await oraiToken.waitForDeployment();

    // Deploy VotingContract
    const VotingContract = await ethers.getContractFactory("VotingContract");
    votingContract = await VotingContract.deploy(await oraiToken.getAddress());
    await votingContract.waitForDeployment();

    // Set up roles
    await votingContract.setOracleContract(oracle.address);
    await oraiToken.grantRole(await oraiToken.SLASHER_ROLE(), await votingContract.getAddress());

    // Distribute tokens and stake
    await oraiToken.transfer(voter1.address, ethers.parseEther("1000"));
    await oraiToken.transfer(voter2.address, ethers.parseEther("1000"));
    await oraiToken.transfer(voter3.address, ethers.parseEther("1000"));

    // Voters stake their tokens
    await oraiToken.connect(voter1).stake(STAKE_AMOUNT);
    await oraiToken.connect(voter2).stake(STAKE_AMOUNT);
    await oraiToken.connect(voter3).stake(ethers.parseEther("50"));
  });

  describe("Deployment", function () {
    it("Should set the correct token contract", async function () {
      expect(await votingContract.tokenContract()).to.equal(await oraiToken.getAddress());
    });

    it("Should set the correct oracle contract", async function () {
      expect(await votingContract.oracleContract()).to.equal(oracle.address);
    });

    it("Should have correct constants", async function () {
      expect(await votingContract.QUORUM_PERCENTAGE()).to.equal(33);
      expect(await votingContract.APPROVAL_THRESHOLD()).to.equal(66);
      expect(await votingContract.REWARD_PERCENTAGE()).to.equal(5);
      expect(await votingContract.SLASH_PERCENTAGE()).to.equal(20);
    });
  });

  describe("Starting Voting", function () {
    const questionId = ethers.keccak256(ethers.toUtf8Bytes("question1"));

    it("Should allow oracle to start voting", async function () {
      await expect(
        votingContract.connect(oracle).startVoting(questionId, VOTING_DURATION)
      ).to.emit(votingContract, "VotingStarted");

      const roundInfo = await votingContract.getVotingRoundInfo(questionId);
      expect(roundInfo.startTime).to.be.gt(0);
      expect(roundInfo.endTime).to.equal(roundInfo.startTime + BigInt(VOTING_DURATION));
    });

    it("Should reject non-oracle from starting voting", async function () {
      await expect(
        votingContract.connect(voter1).startVoting(questionId, VOTING_DURATION)
      ).to.be.reverted;
    });

    it("Should reject starting voting twice for same question", async function () {
      await votingContract.connect(oracle).startVoting(questionId, VOTING_DURATION);

      await expect(
        votingContract.connect(oracle).startVoting(questionId, VOTING_DURATION)
      ).to.be.revertedWith("Voting already started");
    });
  });

  describe("Casting Votes", function () {
    const questionId = ethers.keccak256(ethers.toUtf8Bytes("question1"));

    beforeEach(async function () {
      await votingContract.connect(oracle).startVoting(questionId, VOTING_DURATION);
    });

    it("Should allow stakers to cast votes", async function () {
      await expect(
        votingContract.connect(voter1).castVote(questionId, true)
      ).to.emit(votingContract, "VoteCast")
        .withArgs(questionId, voter1.address, true, STAKE_AMOUNT);

      const vote = await votingContract.getVote(questionId, voter1.address);
      expect(vote.approved).to.be.true;
      expect(vote.stake).to.equal(STAKE_AMOUNT);
    });

    it("Should track votes correctly", async function () {
      await votingContract.connect(voter1).castVote(questionId, true);
      await votingContract.connect(voter2).castVote(questionId, true);
      await votingContract.connect(voter3).castVote(questionId, false);

      const roundInfo = await votingContract.getVotingRoundInfo(questionId);
      expect(roundInfo.totalVotesFor).to.equal(ethers.parseEther("200")); // voter1 + voter2
      expect(roundInfo.totalVotesAgainst).to.equal(ethers.parseEther("50")); // voter3
      expect(roundInfo.totalStake).to.equal(ethers.parseEther("250"));
    });

    it("Should reject duplicate votes", async function () {
      await votingContract.connect(voter1).castVote(questionId, true);

      await expect(
        votingContract.connect(voter1).castVote(questionId, true)
      ).to.be.revertedWith("Already voted");
    });

    it("Should reject votes from non-stakers", async function () {
      await expect(
        votingContract.connect(nonStaker).castVote(questionId, true)
      ).to.be.revertedWith("Must have staked tokens");
    });

    it("Should reject votes after voting period", async function () {
      await time.increase(VOTING_DURATION + 1);

      await expect(
        votingContract.connect(voter1).castVote(questionId, true)
      ).to.be.revertedWith("Voting ended");
    });
  });

  describe("Getting Voting Results", function () {
    const questionId = ethers.keccak256(ethers.toUtf8Bytes("question1"));

    beforeEach(async function () {
      await votingContract.connect(oracle).startVoting(questionId, VOTING_DURATION);
    });

    it("Should return correct results when approved", async function () {
      // 200 for, 50 against = 80% approval > 66% threshold
      await votingContract.connect(voter1).castVote(questionId, true);
      await votingContract.connect(voter2).castVote(questionId, true);
      await votingContract.connect(voter3).castVote(questionId, false);

      await time.increase(VOTING_DURATION);

      const [approved, voteCount] = await votingContract.getVotingResults(questionId);
      expect(approved).to.be.true;
      expect(voteCount).to.equal(ethers.parseEther("250"));
    });

    it("Should return false when below approval threshold", async function () {
      // 50 for, 200 against = 20% approval < 66% threshold
      await votingContract.connect(voter1).castVote(questionId, false);
      await votingContract.connect(voter2).castVote(questionId, false);
      await votingContract.connect(voter3).castVote(questionId, true);

      await time.increase(VOTING_DURATION);

      const [approved, voteCount] = await votingContract.getVotingResults(questionId);
      expect(approved).to.be.false;
      expect(voteCount).to.equal(ethers.parseEther("250"));
    });

    it("Should return false when quorum not reached", async function () {
      // Only voter3 votes (50 tokens out of 250 total staked = 20% < 33% quorum)
      await votingContract.connect(voter3).castVote(questionId, true);

      await time.increase(VOTING_DURATION);

      const [approved, voteCount] = await votingContract.getVotingResults(questionId);
      expect(approved).to.be.false;
      expect(voteCount).to.equal(ethers.parseEther("50"));
    });

    it("Should reject getting results before voting ends", async function () {
      await votingContract.connect(voter1).castVote(questionId, true);

      await expect(
        votingContract.getVotingResults(questionId)
      ).to.be.revertedWith("Voting not ended");
    });
  });

  describe("Distributing Rewards", function () {
    const questionId = ethers.keccak256(ethers.toUtf8Bytes("question1"));
    const totalFee = ethers.parseEther("1");

    beforeEach(async function () {
      await votingContract.connect(oracle).startVoting(questionId, VOTING_DURATION);

      // Send ETH to voting contract for rewards
      await owner.sendTransaction({
        to: await votingContract.getAddress(),
        value: totalFee
      });
    });

    it("Should distribute rewards to correct voters", async function () {
      // voter1 and voter2 vote correctly (for), voter3 votes incorrectly (against)
      await votingContract.connect(voter1).castVote(questionId, true);
      await votingContract.connect(voter2).castVote(questionId, true);
      await votingContract.connect(voter3).castVote(questionId, false);

      await time.increase(VOTING_DURATION);

      const voter1BalanceBefore = await ethers.provider.getBalance(voter1.address);
      const voter2BalanceBefore = await ethers.provider.getBalance(voter2.address);

      await expect(
        votingContract.connect(oracle).distributeRewards(questionId, totalFee)
      ).to.emit(votingContract, "VotingFinalized");

      const voter1BalanceAfter = await ethers.provider.getBalance(voter1.address);
      const voter2BalanceAfter = await ethers.provider.getBalance(voter2.address);

      // Each correct voter gets 50% of reward pool (5% of 1 ETH = 0.05 ETH)
      const expectedReward = (totalFee * 5n / 100n) / 2n; // 0.025 ETH each

      expect(voter1BalanceAfter - voter1BalanceBefore).to.equal(expectedReward);
      expect(voter2BalanceAfter - voter2BalanceBefore).to.equal(expectedReward);
    });

    it("Should slash incorrect voters", async function () {
      await votingContract.connect(voter1).castVote(questionId, true);
      await votingContract.connect(voter2).castVote(questionId, true);
      await votingContract.connect(voter3).castVote(questionId, false);

      await time.increase(VOTING_DURATION);

      // Check voter3's stake before slashing
      const stakeInfoBefore = await oraiToken.getStakeInfo(voter3.address);
      expect(stakeInfoBefore.amount).to.equal(ethers.parseEther("50"));

      await votingContract.connect(oracle).distributeRewards(questionId, totalFee);

      // Check voter3's stake after slashing (20% of 50 = 10 tokens slashed)
      const stakeInfoAfter = await oraiToken.getStakeInfo(voter3.address);
      expect(stakeInfoAfter.amount).to.equal(ethers.parseEther("40"));
    });

    it("Should reject distributing rewards twice", async function () {
      await votingContract.connect(voter1).castVote(questionId, true);
      await time.increase(VOTING_DURATION);

      await votingContract.connect(oracle).distributeRewards(questionId, totalFee);

      await expect(
        votingContract.connect(oracle).distributeRewards(questionId, totalFee)
      ).to.be.revertedWith("Already finalized");
    });

    it("Should only allow oracle to distribute rewards", async function () {
      await votingContract.connect(voter1).castVote(questionId, true);
      await time.increase(VOTING_DURATION);

      await expect(
        votingContract.connect(voter1).distributeRewards(questionId, totalFee)
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    const questionId = ethers.keccak256(ethers.toUtf8Bytes("question1"));

    beforeEach(async function () {
      await votingContract.connect(oracle).startVoting(questionId, VOTING_DURATION);
      await votingContract.connect(voter1).castVote(questionId, true);
      await votingContract.connect(voter2).castVote(questionId, false);
    });

    it("Should return correct voting round info", async function () {
      const info = await votingContract.getVotingRoundInfo(questionId);
      expect(info.totalVotesFor).to.equal(STAKE_AMOUNT);
      expect(info.totalVotesAgainst).to.equal(STAKE_AMOUNT);
      expect(info.totalStake).to.equal(STAKE_AMOUNT * 2n);
      expect(info.finalized).to.be.false;
    });

    it("Should return correct voter list", async function () {
      const voters = await votingContract.getVoters(questionId);
      expect(voters.length).to.equal(2);
      expect(voters).to.include(voter1.address);
      expect(voters).to.include(voter2.address);
    });

    it("Should check if voting has ended", async function () {
      expect(await votingContract.hasVotingEnded(questionId)).to.be.false;

      await time.increase(VOTING_DURATION);

      expect(await votingContract.hasVotingEnded(questionId)).to.be.true;
    });

    it("Should check if user has voted", async function () {
      expect(await votingContract.hasVoted(questionId, voter1.address)).to.be.true;
      expect(await votingContract.hasVoted(questionId, voter3.address)).to.be.false;
    });
  });
});