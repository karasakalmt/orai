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


// File npm/@openzeppelin/contracts@5.4.0/utils/Pausable.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
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


// File contracts/OracleContract.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;





/**
 * @title OracleContract
 * @dev Core oracle contract for AI-verified knowledge on 0G Chain
 * Questions are submitted by users and answered by a backend relayer
 */
contract OracleContract is AccessControl, ReentrancyGuard, Pausable {
    // Roles
    bytes32 public constant ORACLE_OPERATOR = keccak256("ORACLE_OPERATOR");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    // Contract references
    IVotingContract public votingContract;
    ITokenContract public tokenContract;

    // Oracle configuration
    uint256 public minOracleFee = 0.01 ether;
    uint256 public maxQuestionLength = 500;
    uint256 public maxReferenceUrls = 5;
    uint256 public constant VOTING_PERIOD = 24 hours;

    // Fee distribution percentages
    uint256 public constant REWARD_PERCENTAGE = 5; // 5% to correct voters
    uint256 public constant TREASURY_PERCENTAGE = 10; // 10% to treasury
    uint256 public constant RELAYER_PERCENTAGE = 85; // 85% to relayer/operators

    // Question structure
    struct Question {
        address asker;
        string question;
        string[] referenceUrls;
        uint256 fee;
        uint256 timestamp;
        bool answered;
        bool finalized;
    }

    // Answer structure
    struct Answer {
        string answer;
        bytes32 storageHash;     // 0G Storage hash
        bytes32 modelHash;       // AI model hash
        bytes32 inputHash;       // Input data hash
        bytes32 outputHash;      // Output data hash
        uint256 timestamp;
        address relayer;         // Backend relayer who submitted
        bool verified;
        uint256 votingRoundId;
    }

    // Storage
    mapping(bytes32 => Question) public questions;
    mapping(bytes32 => Answer) public answers;
    mapping(address => bytes32[]) public userQuestions;

    bytes32[] public allQuestionIds;
    uint256 public totalQuestions;
    uint256 public totalAnswers;
    uint256 public totalFeesCollected;

    // Treasury for collecting fees
    address public treasury;

    // Events
    event QuestionSubmitted(
        bytes32 indexed questionId,
        address indexed asker,
        string question,
        uint256 fee
    );

    event AnswerSubmitted(
        bytes32 indexed questionId,
        address indexed relayer,
        string answer,
        bytes32 storageHash
    );

    event AnswerVerified(
        bytes32 indexed questionId,
        bool approved,
        uint256 votesFor,
        uint256 votesAgainst
    );

    event FeeDistributed(
        bytes32 indexed questionId,
        uint256 rewardAmount,
        uint256 treasuryAmount,
        uint256 relayerAmount
    );

    /**
     * @dev Constructor
     */
    constructor(address _treasury) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_OPERATOR, msg.sender);
        treasury = _treasury;
    }

    /**
     * @dev Set contract references
     */
    function setContracts(
        address _votingContract,
        address _tokenContract
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_votingContract != address(0), "Invalid voting contract");
        require(_tokenContract != address(0), "Invalid token contract");

        votingContract = IVotingContract(_votingContract);
        tokenContract = ITokenContract(_tokenContract);
    }

    /**
     * @dev Submit a question to the oracle
     * @param question The question to ask
     * @param referenceUrls Optional reference URLs
     * @return questionId Unique identifier for the question
     */
    function queryOracle(
        string memory question,
        string[] memory referenceUrls
    ) external payable nonReentrant whenNotPaused returns (bytes32 questionId) {
        // Validations
        require(bytes(question).length > 0 && bytes(question).length <= maxQuestionLength, "Invalid question length");
        require(msg.value >= minOracleFee, "Insufficient fee");
        require(referenceUrls.length <= maxReferenceUrls, "Too many reference URLs");

        // Generate unique question ID
        questionId = keccak256(abi.encodePacked(
            msg.sender,
            question,
            block.timestamp,
            block.number
        ));

        // Ensure uniqueness
        require(questions[questionId].timestamp == 0, "Question ID collision");

        // Store question
        questions[questionId] = Question({
            asker: msg.sender,
            question: question,
            referenceUrls: referenceUrls,
            fee: msg.value,
            timestamp: block.timestamp,
            answered: false,
            finalized: false
        });

        // Track question
        userQuestions[msg.sender].push(questionId);
        allQuestionIds.push(questionId);
        totalQuestions++;
        totalFeesCollected += msg.value;

        emit QuestionSubmitted(questionId, msg.sender, question, msg.value);

        return questionId;
    }

    /**
     * @dev Submit an answer (called by backend relayer)
     * @param questionId The question being answered
     * @param answer The answer content
     * @param storageHash 0G Storage hash for the answer
     * @param modelHash Hash of the AI model used
     * @param inputHash Hash of the input data
     * @param outputHash Hash of the output data
     */
    function submitAnswer(
        bytes32 questionId,
        string memory answer,
        bytes32 storageHash,
        bytes32 modelHash,
        bytes32 inputHash,
        bytes32 outputHash
    ) external onlyRole(RELAYER_ROLE) nonReentrant whenNotPaused {
        Question storage q = questions[questionId];
        require(q.timestamp != 0, "Question does not exist");
        require(!q.answered, "Question already answered");
        require(bytes(answer).length > 0, "Empty answer");
        require(storageHash != bytes32(0), "Invalid storage hash");

        // Store answer
        answers[questionId] = Answer({
            answer: answer,
            storageHash: storageHash,
            modelHash: modelHash,
            inputHash: inputHash,
            outputHash: outputHash,
            timestamp: block.timestamp,
            relayer: msg.sender,
            verified: false,
            votingRoundId: 0
        });

        q.answered = true;
        totalAnswers++;

        // Start voting process
        uint256 votingRoundId = votingContract.startVoting(
            questionId,
            q.asker,
            q.fee
        );

        answers[questionId].votingRoundId = votingRoundId;

        emit AnswerSubmitted(questionId, msg.sender, answer, storageHash);
    }

    /**
     * @dev Finalize an answer after voting (called by VotingContract)
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
    ) external {
        require(msg.sender == address(votingContract), "Only voting contract");

        Question storage q = questions[questionId];
        require(q.answered, "Question not answered");
        require(!q.finalized, "Already finalized");

        Answer storage a = answers[questionId];
        a.verified = approved;
        q.finalized = true;

        if (approved) {
            // Distribute fees
            distributeFees(questionId);
        } else {
            // Return fee to asker if answer rejected
            payable(q.asker).transfer(q.fee);
        }

        emit AnswerVerified(questionId, approved, votesFor, votesAgainst);
    }

    /**
     * @dev Distribute fees after successful answer verification
     * @param questionId The question whose fees to distribute
     */
    function distributeFees(bytes32 questionId) private {
        Question storage q = questions[questionId];
        Answer storage a = answers[questionId];

        uint256 rewardAmount = (q.fee * REWARD_PERCENTAGE) / 100;
        uint256 treasuryAmount = (q.fee * TREASURY_PERCENTAGE) / 100;
        uint256 relayerAmount = (q.fee * RELAYER_PERCENTAGE) / 100;

        // Send to voting contract for voter rewards
        if (rewardAmount > 0) {
            payable(address(votingContract)).transfer(rewardAmount);
            votingContract.distributeRewards(a.votingRoundId, rewardAmount);
        }

        // Send to treasury
        if (treasuryAmount > 0) {
            payable(treasury).transfer(treasuryAmount);
        }

        // Send to relayer
        if (relayerAmount > 0) {
            payable(a.relayer).transfer(relayerAmount);
        }

        emit FeeDistributed(questionId, rewardAmount, treasuryAmount, relayerAmount);
    }

    /**
     * @dev Get answer for a question
     * @param questionId The question ID
     * @return answer The answer content
     * @return verified Whether the answer is verified
     */
    function getAnswer(bytes32 questionId) external view returns (string memory answer, bool verified) {
        Answer storage a = answers[questionId];
        require(a.timestamp != 0, "No answer available");
        return (a.answer, a.verified);
    }

    /**
     * @dev Check if an answer is verified
     * @param questionId The question ID
     * @return bool Whether the answer is verified
     */
    function isAnswerVerified(bytes32 questionId) external view returns (bool) {
        return answers[questionId].verified;
    }

    /**
     * @dev Get question details
     * @param questionId The question ID
     * @return question The question struct
     */
    function getQuestion(bytes32 questionId) external view returns (Question memory) {
        return questions[questionId];
    }

    /**
     * @dev Get user's question IDs
     * @param user The user address
     * @return questionIds Array of question IDs
     */
    function getUserQuestions(address user) external view returns (bytes32[] memory) {
        return userQuestions[user];
    }

    /**
     * @dev Update oracle configuration
     */
    function updateConfig(
        uint256 _minOracleFee,
        uint256 _maxQuestionLength,
        uint256 _maxReferenceUrls
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minOracleFee = _minOracleFee;
        maxQuestionLength = _maxQuestionLength;
        maxReferenceUrls = _maxReferenceUrls;
    }

    /**
     * @dev Update treasury address
     */
    function updateTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}

