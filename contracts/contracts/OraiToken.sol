// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ITokenContract.sol";

/**
 * @title OraiToken
 * @dev ERC20 token with staking functionality for the Orai oracle system
 */
contract OraiToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ITokenContract {
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

    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event Slashed(address indexed user, uint256 amount, uint256 timestamp);

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

    function stake(uint256 amount) external override whenNotPaused {
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

    function unstake(uint256 amount) external override whenNotPaused {
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

    function claimRewards() external override whenNotPaused {
        updateReward(msg.sender);

        uint256 reward = calculateReward(msg.sender);

        require(reward > 0, "No rewards available");

        stakes[msg.sender].rewardDebt = rewardPerTokenStored;

        _mint(msg.sender, reward);

        emit RewardClaimed(msg.sender, reward, block.timestamp);
    }

    function slash(address user, uint256 amount) external override onlyRole(SLASHER_ROLE) {
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
            stakes[user].rewardDebt = calculateReward(user);
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
        StakeInfo memory stakeInfo = stakes[user];
        return (stakeInfo.amount *
            (rewardPerToken() - stakeInfo.rewardDebt)) /
            REWARD_PRECISION;
    }

    function getStakeInfo(address user) external view override returns (StakeInfo memory) {
        return stakes[user];
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Required override for ERC20Pausable
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, amount);
    }
}