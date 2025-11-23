// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GovernanceContract
 * @dev Simplified governance for the Orai oracle system
 * Allows token holders to create and vote on proposals
 */
contract GovernanceContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    // Proposal structure
    struct Proposal {
        string description;
        address proposer;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool canceled;
        ProposalType proposalType;
        bytes callData;
        address target;
    }

    // Proposal types
    enum ProposalType {
        PARAMETER_UPDATE,
        CONTRACT_UPGRADE,
        TREASURY_ALLOCATION,
        EMERGENCY_ACTION
    }

    // Governance parameters
    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 7 days;
    uint256 public proposalThreshold = 100 * 10**18; // 100 tokens
    uint256 public quorumPercentage = 4; // 4%

    // Contract references
    IERC20 public governanceToken;
    address public oracleContract;
    address public votingContract;

    // Proposal tracking
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public votingPower;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        ProposalType proposalType
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    constructor(address _governanceToken) {
        require(_governanceToken != address(0), "Invalid token address");
        governanceToken = IERC20(_governanceToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
    }

    /**
     * @dev Set contract addresses
     */
    function setContracts(
        address _oracleContract,
        address _votingContract
    ) external onlyRole(ADMIN_ROLE) {
        require(_oracleContract != address(0), "Invalid oracle address");
        require(_votingContract != address(0), "Invalid voting address");

        oracleContract = _oracleContract;
        votingContract = _votingContract;
    }

    /**
     * @dev Create a new proposal
     */
    function propose(
        string memory description,
        ProposalType proposalType,
        address target,
        bytes memory callData
    ) external nonReentrant returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= proposalThreshold,
            "Below proposal threshold"
        );
        require(bytes(description).length > 0, "Empty description");

        uint256 proposalId = ++proposalCount;
        Proposal storage proposal = proposals[proposalId];

        proposal.description = description;
        proposal.proposer = msg.sender;
        proposal.startTime = block.timestamp + votingDelay;
        proposal.endTime = proposal.startTime + votingPeriod;
        proposal.proposalType = proposalType;
        proposal.target = target;
        proposal.callData = callData;

        emit ProposalCreated(proposalId, msg.sender, description, proposalType);

        return proposalId;
    }

    /**
     * @dev Cast a vote on a proposal
     */
    function castVote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];

        require(proposal.startTime <= block.timestamp, "Voting not started");
        require(proposal.endTime >= block.timestamp, "Voting ended");
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    /**
     * @dev Execute a successful proposal
     */
    function execute(uint256 proposalId) external nonReentrant onlyRole(EXECUTOR_ROLE) {
        Proposal storage proposal = proposals[proposalId];

        require(proposal.endTime < block.timestamp, "Voting not ended");
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(isProposalSuccessful(proposalId), "Proposal failed");

        proposal.executed = true;

        // Execute the proposal if it has a target and calldata
        if (proposal.target != address(0) && proposal.callData.length > 0) {
            (bool success, ) = proposal.target.call(proposal.callData);
            require(success, "Execution failed");
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel a proposal (only proposer or admin)
     */
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];

        require(
            msg.sender == proposal.proposer || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Already canceled");

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev Check if a proposal is successful
     */
    function isProposalSuccessful(uint256 proposalId) public view returns (bool) {
        Proposal storage proposal = proposals[proposalId];

        uint256 totalSupply = governanceToken.totalSupply();
        uint256 quorum = (totalSupply * quorumPercentage) / 100;

        return (
            proposal.forVotes > proposal.againstVotes &&
            proposal.forVotes >= quorum
        );
    }

    /**
     * @dev Update governance parameters (only through successful proposals)
     */
    function updateParameters(
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    ) external {
        require(msg.sender == address(this), "Only through governance");

        if (_votingDelay > 0) votingDelay = _votingDelay;
        if (_votingPeriod > 0) votingPeriod = _votingPeriod;
        if (_proposalThreshold > 0) proposalThreshold = _proposalThreshold;
        if (_quorumPercentage > 0 && _quorumPercentage <= 100) {
            quorumPercentage = _quorumPercentage;
        }
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (
        string memory description,
        address proposer,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 startTime,
        uint256 endTime,
        bool executed,
        bool canceled
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.description,
            proposal.proposer,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.startTime,
            proposal.endTime,
            proposal.executed,
            proposal.canceled
        );
    }

    /**
     * @dev Get voting status
     */
    function getVotingStatus(uint256 proposalId) external view returns (
        bool isActive,
        bool hasEnded,
        bool isSuccessful
    ) {
        Proposal storage proposal = proposals[proposalId];

        isActive = (
            block.timestamp >= proposal.startTime &&
            block.timestamp <= proposal.endTime &&
            !proposal.executed &&
            !proposal.canceled
        );

        hasEnded = block.timestamp > proposal.endTime;
        isSuccessful = isProposalSuccessful(proposalId);
    }
}