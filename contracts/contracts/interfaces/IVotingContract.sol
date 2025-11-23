// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVotingContract
 * @dev Interface for the voting contract in the Orai oracle system
 */
interface IVotingContract {
    /**
     * @dev Starts a voting round for a question
     * @param questionId The ID of the question
     * @param asker The address that asked the question
     * @param fee The fee paid for the question
     * @return roundId The ID of the voting round
     */
    function startVoting(bytes32 questionId, address asker, uint256 fee) external returns (uint256);

    /**
     * @dev Casts a vote for a question
     * @param questionId The ID of the question
     * @param approved Whether the voter approves the answer
     */
    function castVote(bytes32 questionId, bool approved) external;

    /**
     * @dev Gets the voting results for a question
     * @param questionId The ID of the question
     * @return approved Whether the answer was approved
     * @return voteCount The total number of votes cast
     */
    function getVotingResults(bytes32 questionId)
        external
        view
        returns (bool approved, uint256 voteCount);

    /**
     * @dev Distributes rewards to correct voters and slashes incorrect voters
     * @param questionId The ID of the question
     * @param totalFee The total fee for the question
     */
    function distributeRewards(bytes32 questionId, uint256 totalFee) external;

    /**
     * @dev Distributes rewards by round ID (called by OracleContract)
     * @param roundId The ID of the voting round
     * @param totalReward The total reward amount
     */
    function distributeRewards(uint256 roundId, uint256 totalReward) external;
}