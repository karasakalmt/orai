// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOracleContract
 * @dev Interface for the oracle contract
 */
interface IOracleContract {
    /**
     * @dev Finalize an answer after voting
     * @param questionId The question being finalized
     * @param approved Whether the answer was approved
     * @param votesFor Number of votes in favor
     * @param votesAgainst Number of votes against
     */
    function finalizeAnswer(
        bytes32 questionId,
        bool approved,
        uint256 votesFor,
        uint256 votesAgainst
    ) external;
}