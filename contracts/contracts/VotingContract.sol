// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IVotingContract.sol";
import "./interfaces/ITokenContract.sol";
import "./interfaces/IOracleContract.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VotingContract
 * @dev Handles community voting on answer verification for the Orai oracle system
 */
contract VotingContract is IVotingContract, AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

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

    // Constants
    uint256 public constant QUORUM_PERCENTAGE = 33;
    uint256 public constant APPROVAL_THRESHOLD = 66;
    uint256 public constant REWARD_PERCENTAGE = 5;
    uint256 public constant SLASH_PERCENTAGE = 20;

    // State variables
    mapping(bytes32 => VotingRound) public votingRounds;
    mapping(uint256 => bytes32) public roundIdToQuestionId;
    uint256 public nextRoundId = 1;
    address public oracleContract;
    address public tokenContract;

    // Events
    event VotingStarted(bytes32 indexed questionId, uint256 endTime);
    event VoteCast(bytes32 indexed questionId, address indexed voter, bool approved, uint256 stake);
    event VotingFinalized(bytes32 indexed questionId, bool approved, uint256 totalVotes);
    event RewardDistributed(bytes32 indexed questionId, address indexed voter, uint256 amount);
    event VoterSlashed(bytes32 indexed questionId, address indexed voter, uint256 amount);

    constructor(address _tokenContract) {
        require(_tokenContract != address(0), "Invalid token contract");
        tokenContract = _tokenContract;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }

    /**
     * @dev Sets the oracle contract address
     * @param _oracleContract Address of the oracle contract
     */
    function setOracleContract(address _oracleContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_oracleContract != address(0), "Invalid oracle contract");
        oracleContract = _oracleContract;
        _grantRole(ORACLE_ROLE, _oracleContract);
    }

    /**
     * @dev Sets the token contract address
     * @param _tokenContract Address of the token contract
     */
    function setTokenContract(address _tokenContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_tokenContract != address(0), "Invalid token contract");
        tokenContract = _tokenContract;
    }

    /**
     * @dev Starts a voting round for a question
     * @param questionId The ID of the question
     * @param asker The address that asked the question (unused but required for compatibility)
     * @param fee The fee paid for the question (unused but required for compatibility)
     * @return roundId The ID of the voting round
     */
    function startVoting(
        bytes32 questionId,
        address asker,
        uint256 fee
    ) external override onlyRole(ORACLE_ROLE) returns (uint256) {
        VotingRound storage round = votingRounds[questionId];
        require(round.startTime == 0, "Voting already started");

        uint256 roundId = nextRoundId++;
        roundIdToQuestionId[roundId] = questionId;

        round.questionId = questionId;
        round.startTime = block.timestamp;
        round.endTime = block.timestamp + 24 hours; // Fixed 24-hour voting period

        emit VotingStarted(questionId, round.endTime);

        return roundId;
    }

    /**
     * @dev Casts a vote for a question
     * @param questionId The ID of the question
     * @param approved Whether the voter approves the answer
     */
    function castVote(bytes32 questionId, bool approved)
        external
        override
        nonReentrant
    {
        VotingRound storage round = votingRounds[questionId];
        require(block.timestamp >= round.startTime, "Voting not started");
        require(block.timestamp < round.endTime, "Voting ended");
        require(round.votes[msg.sender].stake == 0, "Already voted");

        // Get voter's staked tokens
        ITokenContract.StakeInfo memory stakeInfo = ITokenContract(tokenContract)
            .getStakeInfo(msg.sender);
        require(stakeInfo.amount > 0, "Must have staked tokens");

        // Record vote
        round.votes[msg.sender] = Vote({
            approved: approved,
            stake: stakeInfo.amount,
            timestamp: block.timestamp,
            claimed: false
        });

        round.voters.push(msg.sender);
        round.totalStake += stakeInfo.amount;

        if (approved) {
            round.totalVotesFor += stakeInfo.amount;
        } else {
            round.totalVotesAgainst += stakeInfo.amount;
        }

        emit VoteCast(questionId, msg.sender, approved, stakeInfo.amount);
    }

    /**
     * @dev Gets the voting results for a question
     * @param questionId The ID of the question
     * @return approved Whether the answer was approved
     * @return voteCount The total number of votes cast
     */
    function getVotingResults(bytes32 questionId)
        external
        view
        override
        returns (bool approved, uint256 voteCount)
    {
        VotingRound storage round = votingRounds[questionId];
        require(block.timestamp >= round.endTime, "Voting not ended");

        // Check if quorum was reached
        uint256 totalStaked = ITokenContract(tokenContract).totalStaked();
        bool quorumReached = (round.totalStake * 100) / totalStaked >= QUORUM_PERCENTAGE;

        if (!quorumReached) {
            return (false, round.totalStake);
        }

        // Check if approval threshold was met
        bool votePassed = (round.totalVotesFor * 100) / round.totalStake >= APPROVAL_THRESHOLD;

        return (votePassed, round.totalStake);
    }

    /**
     * @dev Distributes rewards to correct voters and slashes incorrect voters
     * @param questionId The ID of the question
     * @param totalFee The total fee for the question
     */
    function distributeRewards(bytes32 questionId, uint256 totalFee)
        external
        override
        onlyRole(ORACLE_ROLE)
        nonReentrant
    {
        VotingRound storage round = votingRounds[questionId];
        require(!round.finalized, "Already finalized");
        require(block.timestamp >= round.endTime, "Voting not ended");

        (bool approved, ) = this.getVotingResults(questionId);

        uint256 rewardPool = (totalFee * REWARD_PERCENTAGE) / 100;
        uint256 correctStake = approved ? round.totalVotesFor : round.totalVotesAgainst;

        if (correctStake == 0) {
            // No correct voters, return funds to oracle contract
            round.finalized = true;
            emit VotingFinalized(questionId, approved, round.totalStake);
            return;
        }

        for (uint256 i = 0; i < round.voters.length; i++) {
            address voter = round.voters[i];
            Vote storage vote = round.votes[voter];

            if (vote.approved == approved) {
                // Reward correct voters
                uint256 reward = (rewardPool * vote.stake) / correctStake;
                if (reward > 0 && address(this).balance >= reward) {
                    payable(voter).transfer(reward);
                    emit RewardDistributed(questionId, voter, reward);
                }
            } else {
                // Slash incorrect voters
                uint256 slashAmount = (vote.stake * SLASH_PERCENTAGE) / 100;
                try ITokenContract(tokenContract).slash(voter, slashAmount) {
                    emit VoterSlashed(questionId, voter, slashAmount);
                } catch {
                    // Slashing failed, continue with other voters
                }
            }

            vote.claimed = true;
        }

        round.finalized = true;
        emit VotingFinalized(questionId, approved, round.totalStake);

        // Notify oracle contract about the result
        if (oracleContract != address(0)) {
            try IOracleContract(oracleContract).finalizeAnswer(
                questionId,
                approved,
                round.totalVotesFor,
                round.totalVotesAgainst
            ) {} catch {
                // Failed to notify oracle, but voting is still finalized
            }
        }
    }

    /**
     * @dev Gets detailed information about a voting round
     * @param questionId The ID of the question
     */
    function getVotingRoundInfo(bytes32 questionId)
        external
        view
        returns (
            uint256 startTime,
            uint256 endTime,
            uint256 totalVotesFor,
            uint256 totalVotesAgainst,
            uint256 totalStake,
            bool finalized
        )
    {
        VotingRound storage round = votingRounds[questionId];
        return (
            round.startTime,
            round.endTime,
            round.totalVotesFor,
            round.totalVotesAgainst,
            round.totalStake,
            round.finalized
        );
    }

    /**
     * @dev Gets a voter's vote for a specific question
     * @param questionId The ID of the question
     * @param voter The address of the voter
     */
    function getVote(bytes32 questionId, address voter)
        external
        view
        returns (
            bool approved,
            uint256 stake,
            uint256 timestamp,
            bool claimed
        )
    {
        Vote storage vote = votingRounds[questionId].votes[voter];
        return (vote.approved, vote.stake, vote.timestamp, vote.claimed);
    }

    /**
     * @dev Gets the list of voters for a question
     * @param questionId The ID of the question
     */
    function getVoters(bytes32 questionId)
        external
        view
        returns (address[] memory)
    {
        return votingRounds[questionId].voters;
    }

    /**
     * @dev Checks if voting has ended for a question
     * @param questionId The ID of the question
     */
    function hasVotingEnded(bytes32 questionId)
        external
        view
        returns (bool)
    {
        return block.timestamp >= votingRounds[questionId].endTime;
    }

    /**
     * @dev Checks if a user has voted for a question
     * @param questionId The ID of the question
     * @param voter The address of the voter
     */
    function hasVoted(bytes32 questionId, address voter)
        external
        view
        returns (bool)
    {
        return votingRounds[questionId].votes[voter].stake > 0;
    }

    /**
     * @dev Distributes rewards to voters who voted correctly
     * @param roundId The ID of the voting round
     * @param totalReward The total reward amount to distribute
     */
    function distributeRewards(uint256 roundId, uint256 totalReward) external {
        require(msg.sender == oracleContract, "Only oracle contract");

        bytes32 questionId = roundIdToQuestionId[roundId];
        VotingRound storage round = votingRounds[questionId];
        require(round.finalized, "Round not finalized");

        bool approved = round.totalVotesFor > round.totalVotesAgainst;
        uint256 winningStake = approved ? round.totalVotesFor : round.totalVotesAgainst;

        if (winningStake == 0 || totalReward == 0) {
            return; // No winners or no reward to distribute
        }

        // Distribute proportionally to winning voters
        for (uint256 i = 0; i < round.voters.length; i++) {
            address voter = round.voters[i];
            Vote storage vote = round.votes[voter];

            if (vote.approved == approved && !vote.claimed) {
                uint256 voterReward = (totalReward * vote.stake) / winningStake;
                if (voterReward > 0) {
                    payable(voter).transfer(voterReward);
                    emit RewardDistributed(questionId, voter, voterReward);
                }
                vote.claimed = true;
            }
        }
    }

    /**
     * @dev Receive function to accept ETH for rewards
     */
    receive() external payable {}
}