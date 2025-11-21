# Orai Smart Contracts Documentation

**Version:** 1.0  
**Last Updated:** November 21, 2025  
**Network:** 0G Chain (EVM Compatible)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Contract Architecture](#2-contract-architecture)
3. [OracleContract](#3-oraclecontract)
4. [TokenContract](#4-tokencontract)
5. [GovernanceContract](#5-governancecontract)
6. [VotingContract](#6-votingcontract)
7. [Security Considerations](#7-security-considerations)
8. [Deployment Guide](#8-deployment-guide)
9. [Integration Examples](#9-integration-examples)

---

## 1. Overview

The Orai smart contract system consists of four core contracts that work together to provide decentralized, AI-verified oracle services on the 0G Chain.

### Contract Hierarchy

```
┌──────────────────────┐
│  OracleContract      │ ◄── Main entry point
└──────────┬───────────┘
           │
     ┌─────┴─────┬──────────┐
     │           │          │
┌────▼────┐ ┌───▼────┐ ┌───▼──────────┐
│ Token   │ │ Voting │ │ Governance   │
│Contract │ │Contract│ │ Contract     │
└─────────┘ └────────┘ └──────────────┘
```

### Key Features

- **Question Submission**: Users and contracts can submit questions
- **Answer Storage**: Answers stored with 0G Storage hashes
- **Voting System**: Token-weighted community validation
- **Governance**: Parameter updates and model management
- **Fee Management**: Oracle fees and reward distribution

---

## 2. Contract Architecture

### Design Principles

1. **Modularity**: Each contract handles specific functionality
2. **Upgradeability**: Proxy pattern for future updates
3. **Security**: ReentrancyGuard, AccessControl, Pausable
4. **Gas Efficiency**: Optimized storage patterns
5. **Interoperability**: Standard interfaces for integration

### Technology Stack

- **Solidity Version**: 0.8.20+
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin Contracts
- **Testing**: Hardhat + Waffle + Chai
- **Audit**: TBD

---

## 3. OracleContract

### Purpose

Main contract handling question submission, answer storage, and oracle queries.

### Contract Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

interface IOracleContract {
    // Events
    event QuestionSubmitted(
        bytes32 indexed questionId,
        address indexed asker,
        string question,
        uint256 fee,
        uint256 timestamp
    );
    
    event AnswerSubmitted(
        bytes32 indexed questionId,
        bytes32 storageHash,
        bytes32 modelHash,
        bytes32 inputHash,
        bytes32 outputHash,
        uint256 timestamp
    );
    
    event AnswerVerified(
        bytes32 indexed questionId,
        bool approved,
        uint256 voteCount,
        uint256 timestamp
    );
    
    event AnswerFinalized(
        bytes32 indexed questionId,
        string answer,
        uint256 timestamp
    );

    // Structs
    struct Question {
        address asker;
        string questionText;
        uint256 fee;
        uint256 timestamp;
        QuestionStatus status;
        string[] referenceUrls;
    }
    
    struct Answer {
        bytes32 storageHash;        // 0G Storage hash
        bytes32 modelHash;          // AI model identifier
        bytes32 inputHash;          // Question input hash
        bytes32 outputHash;         // Answer output hash
        string answerText;          // Full answer text
        string evidenceSummary;     // Supporting evidence
        uint256 timestamp;
        bool verified;
        uint256 voteCount;
    }
    
    enum QuestionStatus {
        Pending,        // Submitted, waiting for answer
        Answered,       // Answer submitted, voting in progress
        Verified,       // Answer verified by voting
        Rejected,       // Answer rejected by voting
        Finalized       // Answer finalized and locked
    }
    
    // Core Functions
    function queryOracle(
        string calldata question,
        string[] calldata referenceUrls
    ) external payable returns (bytes32 questionId);
    
    function submitAnswer(
        bytes32 questionId,
        bytes32 storageHash,
        bytes32 modelHash,
        bytes32 inputHash,
        bytes32 outputHash,
        string calldata answerText,
        string calldata evidenceSummary
    ) external;
    
    function finalizeAnswer(bytes32 questionId) external;
    
    // View Functions
    function getAnswer(bytes32 questionId) 
        external 
        view 
        returns (string memory);
    
    function isAnswerVerified(bytes32 questionId) 
        external 
        view 
        returns (bool);
    
    function getAnswerMetadata(bytes32 questionId)
        external
        view
        returns (
            string memory answer,
            uint256 timestamp,
            uint256 voteCount,
            bool verified,
            bytes32 storageHash
        );
    
    function getQuestion(bytes32 questionId)
        external
        view
        returns (Question memory);
    
    function getQuestionStatus(bytes32 questionId)
        external
        view
        returns (QuestionStatus);
}
```

### Implementation Details

```solidity
contract OracleContract is 
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    IOracleContract
{
    // Role definitions
    bytes32 public constant ORACLE_OPERATOR = keccak256("ORACLE_OPERATOR");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // State variables
    mapping(bytes32 => Question) public questions;
    mapping(bytes32 => Answer) public answers;
    mapping(address => bytes32[]) public userQuestions;
    
    uint256 public minOracleFee;
    uint256 public maxQuestionLength;
    address public tokenContract;
    address public votingContract;
    address public governanceContract;
    
    // Constants
    uint256 public constant VOTING_PERIOD = 24 hours;
    uint256 public constant MAX_REFERENCE_URLS = 5;
    
    function initialize(
        address _tokenContract,
        address _votingContract,
        address _governanceContract,
        uint256 _minOracleFee
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_OPERATOR, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        tokenContract = _tokenContract;
        votingContract = _votingContract;
        governanceContract = _governanceContract;
        minOracleFee = _minOracleFee;
        maxQuestionLength = 500;
    }
    
    function queryOracle(
        string calldata question,
        string[] calldata referenceUrls
    ) 
        external 
        payable 
        override
        nonReentrant
        whenNotPaused
        returns (bytes32 questionId) 
    {
        require(bytes(question).length > 0, "Question cannot be empty");
        require(bytes(question).length <= maxQuestionLength, "Question too long");
        require(msg.value >= minOracleFee, "Insufficient oracle fee");
        require(referenceUrls.length <= MAX_REFERENCE_URLS, "Too many reference URLs");
        
        // Generate unique question ID
        questionId = keccak256(
            abi.encodePacked(
                msg.sender,
                question,
                block.timestamp,
                block.number
            )
        );
        
        require(questions[questionId].asker == address(0), "Question already exists");
        
        // Store question
        questions[questionId] = Question({
            asker: msg.sender,
            questionText: question,
            fee: msg.value,
            timestamp: block.timestamp,
            status: QuestionStatus.Pending,
            referenceUrls: referenceUrls
        });
        
        // Track user questions
        userQuestions[msg.sender].push(questionId);
        
        emit QuestionSubmitted(
            questionId,
            msg.sender,
            question,
            msg.value,
            block.timestamp
        );
        
        return questionId;
    }
    
    function submitAnswer(
        bytes32 questionId,
        bytes32 storageHash,
        bytes32 modelHash,
        bytes32 inputHash,
        bytes32 outputHash,
        string calldata answerText,
        string calldata evidenceSummary
    ) 
        external 
        override
        onlyRole(ORACLE_OPERATOR)
        whenNotPaused
    {
        Question storage question = questions[questionId];
        require(question.asker != address(0), "Question does not exist");
        require(question.status == QuestionStatus.Pending, "Invalid question status");
        require(bytes(answerText).length > 0, "Answer cannot be empty");
        
        // Store answer with proof-of-inference data
        answers[questionId] = Answer({
            storageHash: storageHash,
            modelHash: modelHash,
            inputHash: inputHash,
            outputHash: outputHash,
            answerText: answerText,
            evidenceSummary: evidenceSummary,
            timestamp: block.timestamp,
            verified: false,
            voteCount: 0
        });
        
        // Update question status
        question.status = QuestionStatus.Answered;
        
        emit AnswerSubmitted(
            questionId,
            storageHash,
            modelHash,
            inputHash,
            outputHash,
            block.timestamp
        );
        
        // Trigger voting period
        IVotingContract(votingContract).startVoting(questionId, VOTING_PERIOD);
    }
    
    function finalizeAnswer(bytes32 questionId) 
        external 
        override
        whenNotPaused
    {
        Question storage question = questions[questionId];
        Answer storage answer = answers[questionId];
        
        require(question.status == QuestionStatus.Answered, "Invalid question status");
        require(answer.timestamp + VOTING_PERIOD <= block.timestamp, "Voting period not ended");
        
        // Get voting results
        (bool approved, uint256 voteCount) = IVotingContract(votingContract)
            .getVotingResults(questionId);
        
        answer.voteCount = voteCount;
        
        if (approved) {
            answer.verified = true;
            question.status = QuestionStatus.Verified;
            
            emit AnswerVerified(questionId, true, voteCount, block.timestamp);
            
            // Distribute rewards to correct voters
            IVotingContract(votingContract).distributeRewards(
                questionId,
                question.fee
            );
        } else {
            question.status = QuestionStatus.Rejected;
            
            emit AnswerVerified(questionId, false, voteCount, block.timestamp);
            
            // Refund fee to asker
            payable(question.asker).transfer(question.fee);
        }
        
        question.status = QuestionStatus.Finalized;
        
        emit AnswerFinalized(
            questionId,
            answer.answerText,
            block.timestamp
        );
    }
    
    function getAnswer(bytes32 questionId) 
        external 
        view 
        override
        returns (string memory) 
    {
        Answer storage answer = answers[questionId];
        require(answer.verified, "Answer not verified");
        return answer.answerText;
    }
    
    function isAnswerVerified(bytes32 questionId) 
        external 
        view 
        override
        returns (bool) 
    {
        return answers[questionId].verified;
    }
    
    function getAnswerMetadata(bytes32 questionId)
        external
        view
        override
        returns (
            string memory answer,
            uint256 timestamp,
            uint256 voteCount,
            bool verified,
            bytes32 storageHash
        )
    {
        Answer storage ans = answers[questionId];
        return (
            ans.answerText,
            ans.timestamp,
            ans.voteCount,
            ans.verified,
            ans.storageHash
        );
    }
    
    function getQuestion(bytes32 questionId)
        external
        view
        override
        returns (Question memory)
    {
        return questions[questionId];
    }
    
    function getQuestionStatus(bytes32 questionId)
        external
        view
        override
        returns (QuestionStatus)
    {
        return questions[questionId].status;
    }
    
    function getUserQuestions(address user)
        external
        view
        returns (bytes32[] memory)
    {
        return userQuestions[user];
    }
    
    // Admin functions
    function updateMinFee(uint256 newFee) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        minOracleFee = newFee;
    }
    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    function withdrawFees(address to, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(to).transfer(amount);
    }
}
```

---

## 4. TokenContract

### Purpose

ERC-20 token with staking functionality for governance and voting.

### Contract Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface ITokenContract {
    // Events
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event Slashed(address indexed user, uint256 amount, uint256 timestamp);
    
    // Structs
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
        bool isStaked;
    }
    
    // Functions
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function claimRewards() external;
    function getStakeInfo(address user) external view returns (StakeInfo memory);
    function slash(address user, uint256 amount) external;
}

contract OraiToken is 
    ERC20,
    ERC20Burnable,
    Pausable,
    AccessControl,
    ITokenContract
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant SLASHER_ROLE = keccak256("SLASHER_ROLE");
    
    mapping(address => StakeInfo) public stakes;
    
    uint256 public totalStaked;
    uint256 public minStakeAmount;
    uint256 public unstakeLockPeriod;
    
    uint256 private constant REWARD_PRECISION = 1e18;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public rewardRate;
    
    constructor() ERC20("Orai Token", "ORAI") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        minStakeAmount = 10 * 10**18; // 10 ORAI
        unstakeLockPeriod = 7 days;
        rewardRate = 100 * 10**18; // 100 ORAI per day
        
        // Mint initial supply
        _mint(msg.sender, 100_000_000 * 10**18); // 100M ORAI
    }
    
    function stake(uint256 amount) 
        external 
        override
        whenNotPaused 
    {
        require(amount >= minStakeAmount, "Amount below minimum");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        updateReward(msg.sender);
        
        _transfer(msg.sender, address(this), amount);
        
        StakeInfo storage stakeInfo = stakes[msg.sender];
        stakeInfo.amount += amount;
        stakeInfo.timestamp = block.timestamp;
        stakeInfo.isStaked = true;
        
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, block.timestamp);
    }
    
    function unstake(uint256 amount) 
        external 
        override
        whenNotPaused 
    {
        StakeInfo storage stakeInfo = stakes[msg.sender];
        require(stakeInfo.isStaked, "No active stake");
        require(stakeInfo.amount >= amount, "Insufficient staked amount");
        require(
            block.timestamp >= stakeInfo.timestamp + unstakeLockPeriod,
            "Unstake period not passed"
        );
        
        updateReward(msg.sender);
        
        stakeInfo.amount -= amount;
        if (stakeInfo.amount == 0) {
            stakeInfo.isStaked = false;
        }
        
        totalStaked -= amount;
        
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount, block.timestamp);
    }
    
    function claimRewards() 
        external 
        override
        whenNotPaused 
    {
        updateReward(msg.sender);
        
        StakeInfo storage stakeInfo = stakes[msg.sender];
        uint256 reward = calculateReward(msg.sender);
        
        require(reward > 0, "No rewards available");
        
        stakeInfo.rewardDebt = rewardPerTokenStored;
        
        _mint(msg.sender, reward);
        
        emit RewardClaimed(msg.sender, reward, block.timestamp);
    }
    
    function slash(address user, uint256 amount) 
        external 
        override
        onlyRole(SLASHER_ROLE) 
    {
        StakeInfo storage stakeInfo = stakes[user];
        require(stakeInfo.amount >= amount, "Insufficient stake to slash");
        
        stakeInfo.amount -= amount;
        totalStaked -= amount;
        
        // Burn slashed tokens
        _burn(address(this), amount);
        
        emit Slashed(user, amount, block.timestamp);
    }
    
    function updateReward(address user) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        if (user != address(0)) {
            StakeInfo storage stakeInfo = stakes[user];
            stakeInfo.rewardDebt = calculateReward(user);
        }
    }
    
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        
        return rewardPerTokenStored + (
            ((block.timestamp - lastUpdateTime) * rewardRate * REWARD_PRECISION) / 
            totalStaked
        );
    }
    
    function calculateReward(address user) public view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user];
        return (stakeInfo.amount * 
            (rewardPerToken() - stakeInfo.rewardDebt)) / 
            REWARD_PRECISION;
    }
    
    function getStakeInfo(address user) 
        external 
        view 
        override
        returns (StakeInfo memory) 
    {
        return stakes[user];
    }
    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
```

---

## 5. GovernanceContract

### Purpose

Manage oracle parameters, model updates, and platform governance.

### Contract Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";

contract OraiGovernance is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes
{
    // Governance parameters
    struct GovernanceParams {
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 proposalThreshold;
        uint256 quorumPercentage;
    }
    
    GovernanceParams public params;
    
    constructor(IVotes _token)
        Governor("Orai Governance")
        GovernorSettings(
            1,              // 1 block voting delay
            50400,          // 1 week voting period
            100e18          // 100 ORAI proposal threshold
        )
        GovernorVotes(_token)
    {
        params = GovernanceParams({
            votingDelay: 1,
            votingPeriod: 50400,
            proposalThreshold: 100e18,
            quorumPercentage: 4 // 4% quorum
        });
    }
    
    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }
    
    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }
    
    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor)
        returns (uint256)
    {
        return (token.getPastTotalSupply(blockNumber) * params.quorumPercentage) / 100;
    }
    
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
}
```

---

## 6. VotingContract

### Purpose

Handle community voting on answer verification.

### Contract Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingContract {
    struct Vote {
        bool approved;
        uint256 stake;
        uint256 timestamp;
        bool claimed;
    }
    
    struct VotingRound {
        bytes32 questionId;
        uint256 startTime;
        uint256 endTime;
        uint256 totalVotesFor;
        uint256 totalVotesAgainst;
        uint256 totalStake;
        bool finalized;
        mapping(address => Vote) votes;
        address[] voters;
    }
    
    mapping(bytes32 => VotingRound) public votingRounds;
    
    uint256 public constant QUORUM_PERCENTAGE = 33;
    uint256 public constant APPROVAL_THRESHOLD = 66;
    uint256 public constant REWARD_PERCENTAGE = 5;
    uint256 public constant SLASH_PERCENTAGE = 20;
    
    address public oracleContract;
    address public tokenContract;
    
    event VotingStarted(bytes32 indexed questionId, uint256 endTime);
    event VoteCast(bytes32 indexed questionId, address indexed voter, bool approved, uint256 stake);
    event VotingFinalized(bytes32 indexed questionId, bool approved, uint256 totalVotes);
    event RewardDistributed(bytes32 indexed questionId, address indexed voter, uint256 amount);
    
    function startVoting(bytes32 questionId, uint256 duration) external {
        require(msg.sender == oracleContract, "Only oracle contract");
        
        VotingRound storage round = votingRounds[questionId];
        require(round.startTime == 0, "Voting already started");
        
        round.questionId = questionId;
        round.startTime = block.timestamp;
        round.endTime = block.timestamp + duration;
        
        emit VotingStarted(questionId, round.endTime);
    }
    
    function castVote(bytes32 questionId, bool approved) external {
        VotingRound storage round = votingRounds[questionId];
        require(block.timestamp >= round.startTime, "Voting not started");
        require(block.timestamp < round.endTime, "Voting ended");
        require(round.votes[msg.sender].stake == 0, "Already voted");
        
        uint256 voterStake = ITokenContract(tokenContract)
            .getStakeInfo(msg.sender).amount;
        require(voterStake > 0, "Must have staked tokens");
        
        round.votes[msg.sender] = Vote({
            approved: approved,
            stake: voterStake,
            timestamp: block.timestamp,
            claimed: false
        });
        
        round.voters.push(msg.sender);
        round.totalStake += voterStake;
        
        if (approved) {
            round.totalVotesFor += voterStake;
        } else {
            round.totalVotesAgainst += voterStake;
        }
        
        emit VoteCast(questionId, msg.sender, approved, voterStake);
    }
    
    function getVotingResults(bytes32 questionId)
        external
        view
        returns (bool approved, uint256 voteCount)
    {
        VotingRound storage round = votingRounds[questionId];
        require(block.timestamp >= round.endTime, "Voting not ended");
        
        uint256 totalSupply = ITokenContract(tokenContract).totalStaked();
        bool quorumReached = (round.totalStake * 100) / totalSupply >= QUORUM_PERCENTAGE;
        
        if (!quorumReached) {
            return (false, round.totalStake);
        }
        
        bool votePassed = (round.totalVotesFor * 100) / round.totalStake >= APPROVAL_THRESHOLD;
        
        return (votePassed, round.totalStake);
    }
    
    function distributeRewards(bytes32 questionId, uint256 totalFee) external {
        require(msg.sender == oracleContract, "Only oracle contract");
        
        VotingRound storage round = votingRounds[questionId];
        require(!round.finalized, "Already finalized");
        
        (bool approved, ) = this.getVotingResults(questionId);
        
        uint256 rewardPool = (totalFee * REWARD_PERCENTAGE) / 100;
        uint256 correctStake = approved ? round.totalVotesFor : round.totalVotesAgainst;
        
        for (uint256 i = 0; i < round.voters.length; i++) {
            address voter = round.voters[i];
            Vote storage vote = round.votes[voter];
            
            if (vote.approved == approved) {
                // Reward correct voters
                uint256 reward = (rewardPool * vote.stake) / correctStake;
                payable(voter).transfer(reward);
                
                emit RewardDistributed(questionId, voter, reward);
            } else {
                // Slash incorrect voters
                uint256 slashAmount = (vote.stake * SLASH_PERCENTAGE) / 100;
                ITokenContract(tokenContract).slash(voter, slashAmount);
            }
        }
        
        round.finalized = true;
        
        emit VotingFinalized(questionId, approved, round.totalStake);
    }
}
```

---

## 7. Security Considerations

### Audit Checklist

- [ ] Reentrancy guards on all state-changing functions
- [ ] Access control properly implemented
- [ ] Input validation on all external calls
- [ ] Integer overflow/underflow protection
- [ ] Front-running mitigation
- [ ] Emergency pause functionality
- [ ] Upgrade mechanism security
- [ ] Gas optimization
- [ ] Event emission for all critical operations

### Known Vulnerabilities & Mitigations

| Vulnerability | Mitigation |
|--------------|------------|
| Reentrancy | ReentrancyGuard on critical functions |
| Access Control | Role-based permissions |
| Oracle Manipulation | Multiple node validation + voting |
| Vote Buying | Stake slashing for malicious voting |
| Griefing Attacks | Minimum fees and cooldowns |
| Front-running | Commit-reveal for sensitive operations |

---

## 8. Deployment Guide

### Prerequisites

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts @openzeppelin/contracts-upgradeable
```

### Deployment Script

```javascript
// scripts/deploy.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1. Deploy Token
  const Token = await ethers.getContractFactory("OraiToken");
  const token = await Token.deploy();
  await token.deployed();
  console.log("Token deployed to:", token.address);

  // 2. Deploy Voting Contract
  const Voting = await ethers.getContractFactory("VotingContract");
  const voting = await Voting.deploy();
  await voting.deployed();
  console.log("Voting deployed to:", voting.address);

  // 3. Deploy Governance
  const Governance = await ethers.getContractFactory("OraiGovernance");
  const governance = await Governance.deploy(token.address);
  await governance.deployed();
  console.log("Governance deployed to:", governance.address);

  // 4. Deploy Oracle (Upgradeable)
  const Oracle = await ethers.getContractFactory("OracleContract");
  const oracle = await upgrades.deployProxy(
    Oracle,
    [token.address, voting.address, governance.address, ethers.utils.parseEther("0.01")],
    { initializer: "initialize" }
  );
  await oracle.deployed();
  console.log("Oracle deployed to:", oracle.address);

  // 5. Set up permissions
  await voting.setOracleContract(oracle.address);
  await voting.setTokenContract(token.address);

  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Hardhat Configuration

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    "0g-testnet": {
      url: "https://rpc-testnet.0g.ai",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 16600
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

---

## 9. Integration Examples

### For DApp Developers

```solidity
// Example: Prediction Market using Orai
contract PredictionMarket {
    IOracleContract public oracle;
    
    constructor(address _oracle) {
        oracle = IOracleContract(_oracle);
    }
    
    function resolveMarket(string memory question) external payable {
        // Submit question to oracle
        bytes32 questionId = oracle.queryOracle{value: msg.value}(
            question,
            new string[](0)
        );
        
        // Store questionId for later resolution
        // ... market logic
    }
    
    function settleMarket(bytes32 questionId) external {
        // Check if answer is verified
        require(oracle.isAnswerVerified(questionId), "Not verified");
        
        // Get answer
        string memory answer = oracle.getAnswer(questionId);
        
        // Settle market based on answer
        // ... settlement logic
    }
}
```

### Testing

```javascript
// test/Oracle.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OracleContract", function () {
  let oracle, token, voting;
  let owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    
    // Deploy contracts
    const Token = await ethers.getContractFactory("OraiToken");
    token = await Token.deploy();
    
    const Voting = await ethers.getContractFactory("VotingContract");
    voting = await Voting.deploy();
    
    const Oracle = await ethers.getContractFactory("OracleContract");
    oracle = await upgrades.deployProxy(
      Oracle,
      [token.address, voting.address, owner.address, ethers.utils.parseEther("0.01")]
    );
  });

  it("Should submit a question", async function () {
    const question = "What is the capital of France?";
    const fee = ethers.utils.parseEther("0.01");
    
    await expect(
      oracle.connect(user).queryOracle(question, [], { value: fee })
    ).to.emit(oracle, "QuestionSubmitted");
  });

  it("Should submit and verify answer", async function () {
    // Submit question
    const question = "What is 2+2?";
    const fee = ethers.utils.parseEther("0.01");
    const tx = await oracle.connect(user).queryOracle(question, [], { value: fee });
    const receipt = await tx.wait();
    const questionId = receipt.events[0].args.questionId;
    
    // Submit answer
    await oracle.submitAnswer(
      questionId,
      ethers.utils.formatBytes32String("hash"),
      ethers.utils.formatBytes32String("model"),
      ethers.utils.formatBytes32String("input"),
      ethers.utils.formatBytes32String("output"),
      "The answer is 4",
      "Basic arithmetic"
    );
    
    const status = await oracle.getQuestionStatus(questionId);
    expect(status).to.equal(1); // Answered
  });
});
```

---

## Appendix

### Contract Addresses (Testnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| OraiToken | TBD | TBD |
| OracleContract | TBD | TBD |
| VotingContract | TBD | TBD |
| GovernanceContract | TBD | TBD |

### Gas Usage Estimates

| Function | Estimated Gas |
|----------|---------------|
| queryOracle | ~150,000 |
| submitAnswer | ~200,000 |
| castVote | ~100,000 |
| finalizeAnswer | ~150,000 |
| stake | ~80,000 |
| unstake | ~70,000 |

---

**Last Updated**: November 21, 2025  
**Maintainers**: Orai Core Team  
**License**: MIT
