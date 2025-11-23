import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("OraiToken", function () {
  let oraiToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const OraiToken = await ethers.getContractFactory("OraiToken");
    oraiToken = await OraiToken.deploy();
    await oraiToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right token name and symbol", async function () {
      expect(await oraiToken.name()).to.equal("Orai Token");
      expect(await oraiToken.symbol()).to.equal("ORAI");
    });

    it("Should mint initial supply to owner", async function () {
      const ownerBalance = await oraiToken.balanceOf(owner.address);
      expect(await oraiToken.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(ethers.parseEther("100000000"));
    });

    it("Should grant roles to owner", async function () {
      const DEFAULT_ADMIN_ROLE = await oraiToken.DEFAULT_ADMIN_ROLE();
      const PAUSER_ROLE = await oraiToken.PAUSER_ROLE();
      const MINTER_ROLE = await oraiToken.MINTER_ROLE();

      expect(await oraiToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await oraiToken.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await oraiToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      // Transfer some tokens to addr1 for testing
      await oraiToken.transfer(addr1.address, ethers.parseEther("1000"));
    });

    it("Should allow staking above minimum amount", async function () {
      const stakeAmount = ethers.parseEther("20");
      await oraiToken.connect(addr1).stake(stakeAmount);

      const stakeInfo = await oraiToken.getStakeInfo(addr1.address);
      expect(stakeInfo.amount).to.equal(stakeAmount);
      expect(stakeInfo.isStaked).to.be.true;
    });

    it("Should reject staking below minimum amount", async function () {
      const stakeAmount = ethers.parseEther("5"); // Below 10 ORAI minimum
      await expect(
        oraiToken.connect(addr1).stake(stakeAmount)
      ).to.be.revertedWith("Amount below minimum");
    });

    it("Should update total staked amount", async function () {
      const stakeAmount = ethers.parseEther("50");
      await oraiToken.connect(addr1).stake(stakeAmount);
      expect(await oraiToken.totalStaked()).to.equal(stakeAmount);
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      await oraiToken.transfer(addr1.address, ethers.parseEther("1000"));
      await oraiToken.connect(addr1).stake(ethers.parseEther("100"));
    });

    it("Should allow unstaking after lock period", async function () {
      // Advance time by 7 days
      await time.increase(7 * 24 * 60 * 60);

      const unstakeAmount = ethers.parseEther("50");
      await oraiToken.connect(addr1).unstake(unstakeAmount);

      const stakeInfo = await oraiToken.getStakeInfo(addr1.address);
      expect(stakeInfo.amount).to.equal(ethers.parseEther("50"));
    });

    it("Should reject unstaking before lock period", async function () {
      const unstakeAmount = ethers.parseEther("50");
      await expect(
        oraiToken.connect(addr1).unstake(unstakeAmount)
      ).to.be.revertedWith("Unstake period not passed");
    });
  });

  describe("Pausable", function () {
    it("Should allow pauser to pause and unpause", async function () {
      await oraiToken.pause();
      expect(await oraiToken.paused()).to.be.true;

      await oraiToken.unpause();
      expect(await oraiToken.paused()).to.be.false;
    });

    it("Should reject transfers when paused", async function () {
      await oraiToken.pause();
      await expect(
        oraiToken.transfer(addr1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(oraiToken, "EnforcedPause");
    });
  });
});