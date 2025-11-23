// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IVotingContract.sol";
import "./interfaces/ITokenContract.sol";

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