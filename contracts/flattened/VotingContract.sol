// Sources flattened with hardhat v3.0.15 https://hardhat.org

// SPDX-License-Identifier: MIT

// File npm/@openzeppelin/contracts@5.4.0/access/IAccessControl.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (access/IAccessControl.sol)

pragma solidity >=0.8.4;

/**
 * @dev External interface of AccessControl declared to support ERC-165 detection.
 */
interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted to signal this.
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
     * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}


// File npm/@openzeppelin/contracts@5.4.0/utils/Context.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File npm/@openzeppelin/contracts@5.4.0/utils/introspection/IERC165.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File npm/@openzeppelin/contracts@5.4.0/utils/introspection/ERC165.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/ERC165.sol)

pragma solidity ^0.8.20;

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC-165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 */
abstract contract ERC165 is IERC165 {
    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}


// File npm/@openzeppelin/contracts@5.4.0/access/AccessControl.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (access/AccessControl.sol)

pragma solidity ^0.8.20;



/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 role => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` from `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}


// File npm/@openzeppelin/contracts@5.4.0/utils/ReentrancyGuard.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/interfaces/IOracleContract.sol

// Original license: SPDX_License_Identifier: MIT
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


// File contracts/interfaces/ITokenContract.sol

// Original license: SPDX_License_Identifier: MIT
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


// File contracts/interfaces/IVotingContract.sol

// Original license: SPDX_License_Identifier: MIT
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


// File contracts/VotingContract.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;





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

