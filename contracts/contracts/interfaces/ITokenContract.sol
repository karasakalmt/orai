// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITokenContract
 * @dev Interface for the OraiToken contract
 */
interface ITokenContract {
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
        bool isStaked;
    }

    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function claimRewards() external;
    function getStakeInfo(address user) external view returns (StakeInfo memory);
    function slash(address user, uint256 amount) external;
    function totalStaked() external view returns (uint256);
}