import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { ZERO_G_CONFIG, OG_RPC_URL, OG_CONTRACTS } from '../config/0g.config';
import {
  OGServiceError,
  OGErrorCode,
  OGTransactionResult,
  OGTransactionReceipt
} from '../types/0g.types';

/**
 * Blockchain Service for 0G Network
 * Handles all smart contract interactions for the Orai oracle system
 */
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet?: ethers.Wallet;
  private oracleHubContract?: ethers.Contract;
  private votingContract?: ethers.Contract;
  private tokenContract?: ethers.Contract;
  private connected: boolean = false;

  // Contract ABIs (simplified for development)
  private readonly ORACLE_HUB_ABI = [
    'function submitQuestion(string memory question, string[] memory referenceUrls) public payable returns (bytes32)',
    'function submitAnswer(bytes32 questionId, string memory answer, bytes32 storageHash) public',
    'function getQuestion(bytes32 questionId) public view returns (tuple(string question, address submitter, uint256 timestamp, uint8 status))',
    'function getAnswer(bytes32 questionId) public view returns (tuple(string answer, bytes32 storageHash, uint256 timestamp, bool verified))',
    'event QuestionSubmitted(bytes32 indexed questionId, address indexed submitter, string question)',
    'event AnswerSubmitted(bytes32 indexed questionId, bytes32 storageHash)',
  ];

  private readonly VOTING_ABI = [
    'function castVote(bytes32 questionId, bool support, uint256 weight) public',
    'function getVoteCount(bytes32 questionId) public view returns (uint256 yesVotes, uint256 noVotes, uint256 totalWeight)',
    'function finalizeVoting(bytes32 questionId) public returns (bool passed)',
    'event VoteCast(bytes32 indexed questionId, address indexed voter, bool support, uint256 weight)',
    'event VotingFinalized(bytes32 indexed questionId, bool passed)',
  ];

  private readonly TOKEN_ABI = [
    'function balanceOf(address account) public view returns (uint256)',
    'function allowance(address owner, address spender) public view returns (uint256)',
    'function approve(address spender, uint256 amount) public returns (bool)',
    'function transfer(address to, uint256 amount) public returns (bool)',
    'function decimals() public view returns (uint8)',
    'function symbol() public view returns (string)',
  ];

  constructor() {
    this.provider = new ethers.JsonRpcProvider(OG_RPC_URL);
    this.initializeProvider();
  }

  /**
   * Initialize provider and wallet
   */
  private async initializeProvider(): Promise<void> {
    try {
      const network = await this.provider.getNetwork();

      if (Number(network.chainId) !== ZERO_G_CONFIG.network.chainId) {
        logger.warn(
          {
            expected: ZERO_G_CONFIG.network.chainId,
            actual: Number(network.chainId)
          },
          'Chain ID mismatch'
        );
      }

      this.connected = true;
      logger.info(
        {
          network: ZERO_G_CONFIG.network.name,
          chainId: Number(network.chainId),
          rpcUrl: OG_RPC_URL
        },
        'Blockchain provider initialized'
      );

      // Initialize wallet if private key is provided
      if (process.env.WALLET_PRIVATE_KEY) {
        await this.initializeWallet(process.env.WALLET_PRIVATE_KEY);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to initialize blockchain provider');
      this.connected = false;
      throw new OGServiceError(
        'Failed to connect to blockchain',
        OGErrorCode.CONNECTION_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Initialize wallet for transactions
   */
  async initializeWallet(privateKey: string): Promise<void> {
    try {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      const address = await this.wallet.getAddress();
      const balance = await this.provider.getBalance(address);

      logger.info(
        {
          address,
          balance: ethers.formatEther(balance)
        },
        'Wallet initialized'
      );

      // Initialize contracts with signer
      await this.initializeContracts();
    } catch (error) {
      logger.error({ error }, 'Failed to initialize wallet');
      throw new OGServiceError(
        'Wallet initialization failed',
        OGErrorCode.INITIALIZATION_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Initialize smart contract instances
   */
  private async initializeContracts(): Promise<void> {
    if (!this.wallet) {
      throw new OGServiceError(
        'Wallet not initialized',
        OGErrorCode.INITIALIZATION_ERROR,
        500
      );
    }

    try {
      // Only initialize contracts with valid addresses
      if (OG_CONTRACTS.oracle.hub !== '0x0000000000000000000000000000000000000000') {
        this.oracleHubContract = new ethers.Contract(
          OG_CONTRACTS.oracle.hub,
          this.ORACLE_HUB_ABI,
          this.wallet
        );
      }

      if (OG_CONTRACTS.oracle.voting !== '0x0000000000000000000000000000000000000000') {
        this.votingContract = new ethers.Contract(
          OG_CONTRACTS.oracle.voting,
          this.VOTING_ABI,
          this.wallet
        );
      }

      if (OG_CONTRACTS.oracle.token !== '0x0000000000000000000000000000000000000000') {
        this.tokenContract = new ethers.Contract(
          OG_CONTRACTS.oracle.token,
          this.TOKEN_ABI,
          this.wallet
        );
      }

      logger.info('Smart contracts initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize contracts');
      throw new OGServiceError(
        'Contract initialization failed',
        OGErrorCode.INITIALIZATION_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Submit a question to the oracle
   */
  async submitQuestion(
    question: string,
    referenceUrls: string[] = [],
    paymentAmount?: string
  ): Promise<{
    questionId: string;
    txHash: string;
    blockNumber: number;
  }> {
    if (!this.oracleHubContract) {
      throw new OGServiceError(
        'Oracle hub contract not initialized',
        OGErrorCode.CONTRACT_ERROR,
        500
      );
    }

    try {
      const value = paymentAmount ? ethers.parseEther(paymentAmount) : 0;

      const tx = await this.oracleHubContract.submitQuestion(
        question,
        referenceUrls,
        { value, gasLimit: ZERO_G_CONFIG.gas.limits.submitQuestion }
      );

      const receipt = await tx.wait();

      // Extract question ID from events
      const event = receipt.logs.find(
        (log: any) => log.fragment?.name === 'QuestionSubmitted'
      );

      const questionId = event?.args?.[0] || ethers.keccak256(ethers.toUtf8Bytes(question));

      logger.info(
        {
          questionId,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber
        },
        'Question submitted to oracle'
      );

      return {
        questionId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to submit question');
      throw new OGServiceError(
        'Question submission failed',
        OGErrorCode.TRANSACTION_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Submit an answer to the oracle
   */
  async submitAnswer(
    questionId: string,
    answer: string,
    storageHash: string
  ): Promise<{
    txHash: string;
    blockNumber: number;
  }> {
    if (!this.oracleHubContract) {
      throw new OGServiceError(
        'Oracle hub contract not initialized',
        OGErrorCode.CONTRACT_ERROR,
        500
      );
    }

    try {
      const tx = await this.oracleHubContract.submitAnswer(
        questionId,
        answer,
        storageHash,
        { gasLimit: ZERO_G_CONFIG.gas.limits.submitAnswer }
      );

      const receipt = await tx.wait();

      logger.info(
        {
          questionId,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber
        },
        'Answer submitted to oracle'
      );

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error({ error, questionId }, 'Failed to submit answer');
      throw new OGServiceError(
        'Answer submission failed',
        OGErrorCode.TRANSACTION_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Cast a vote for answer validation
   */
  async castVote(
    questionId: string,
    support: boolean,
    weight?: bigint
  ): Promise<{
    txHash: string;
    blockNumber: number;
  }> {
    if (!this.votingContract) {
      throw new OGServiceError(
        'Voting contract not initialized',
        OGErrorCode.CONTRACT_ERROR,
        500
      );
    }

    try {
      // Get voter's token balance if weight not specified
      let voteWeight = weight;
      if (!voteWeight && this.tokenContract && this.wallet) {
        const balance = await this.tokenContract.balanceOf(this.wallet.address);
        voteWeight = balance;
      }

      const tx = await this.votingContract.castVote(
        questionId,
        support,
        voteWeight || 0,
        { gasLimit: ZERO_G_CONFIG.gas.limits.castVote }
      );

      const receipt = await tx.wait();

      logger.info(
        {
          questionId,
          support,
          weight: voteWeight?.toString(),
          txHash: receipt.hash
        },
        'Vote cast successfully'
      );

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error({ error, questionId }, 'Failed to cast vote');
      throw new OGServiceError(
        'Vote casting failed',
        OGErrorCode.TRANSACTION_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Get vote count for a question
   */
  async getVoteCount(questionId: string): Promise<{
    yesVotes: bigint;
    noVotes: bigint;
    totalWeight: bigint;
    consensusReached: boolean;
  }> {
    if (!this.votingContract) {
      throw new OGServiceError(
        'Voting contract not initialized',
        OGErrorCode.CONTRACT_ERROR,
        500
      );
    }

    try {
      const [yesVotes, noVotes, totalWeight] = await this.votingContract.getVoteCount(questionId);

      const yesPercentage = totalWeight > 0n
        ? (Number(yesVotes) * 100) / Number(totalWeight)
        : 0;

      const consensusReached = yesPercentage >= ZERO_G_CONFIG.validation.consensusThreshold;

      return {
        yesVotes,
        noVotes,
        totalWeight,
        consensusReached,
      };
    } catch (error) {
      logger.error({ error, questionId }, 'Failed to get vote count');
      throw new OGServiceError(
        'Failed to get vote count',
        OGErrorCode.CONTRACT_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Finalize voting for a question
   */
  async finalizeVoting(questionId: string): Promise<{
    passed: boolean;
    txHash: string;
    blockNumber: number;
  }> {
    if (!this.votingContract) {
      throw new OGServiceError(
        'Voting contract not initialized',
        OGErrorCode.CONTRACT_ERROR,
        500
      );
    }

    try {
      const tx = await this.votingContract.finalizeVoting(
        questionId,
        { gasLimit: ZERO_G_CONFIG.gas.limits.finalizeVoting }
      );

      const receipt = await tx.wait();

      // Extract result from events
      const event = receipt.logs.find(
        (log: any) => log.fragment?.name === 'VotingFinalized'
      );

      const passed = event?.args?.[1] || false;

      logger.info(
        {
          questionId,
          passed,
          txHash: receipt.hash
        },
        'Voting finalized'
      );

      return {
        passed,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error({ error, questionId }, 'Failed to finalize voting');
      throw new OGServiceError(
        'Voting finalization failed',
        OGErrorCode.TRANSACTION_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(address: string): Promise<{
    balance: string;
    formatted: string;
    decimals: number;
  }> {
    if (!this.tokenContract) {
      // Return mock data if token contract not deployed
      return {
        balance: '0',
        formatted: '0.0',
        decimals: 18,
      };
    }

    try {
      const [balance, decimals] = await Promise.all([
        this.tokenContract.balanceOf(address),
        this.tokenContract.decimals(),
      ]);

      const formatted = ethers.formatUnits(balance, decimals);

      return {
        balance: balance.toString(),
        formatted,
        decimals,
      };
    } catch (error) {
      logger.error({ error, address }, 'Failed to get token balance');
      throw new OGServiceError(
        'Failed to get token balance',
        OGErrorCode.CONTRACT_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Get ETH balance for an address
   */
  async getEthBalance(address: string): Promise<{
    balance: string;
    formatted: string;
  }> {
    try {
      const balance = await this.provider.getBalance(address);
      const formatted = ethers.formatEther(balance);

      return {
        balance: balance.toString(),
        formatted,
      };
    } catch (error) {
      logger.error({ error, address }, 'Failed to get ETH balance');
      throw new OGServiceError(
        'Failed to get ETH balance',
        OGErrorCode.CONTRACT_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt | null> {
    try {
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);

      logger.info(
        {
          txHash,
          blockNumber: receipt?.blockNumber,
          status: receipt?.status
        },
        'Transaction confirmed'
      );

      return receipt;
    } catch (error) {
      logger.error({ error, txHash }, 'Failed to wait for transaction');
      throw new OGServiceError(
        'Transaction confirmation failed',
        OGErrorCode.TRANSACTION_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    to: string,
    data: string,
    value?: string
  ): Promise<{
    gasLimit: bigint;
    gasPrice: bigint;
    totalCost: string;
  }> {
    try {
      const [gasLimit, feeData] = await Promise.all([
        this.provider.estimateGas({
          to,
          data,
          value: value ? ethers.parseEther(value) : 0,
        }),
        this.provider.getFeeData(),
      ]);

      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      const totalCost = ethers.formatEther(gasLimit * gasPrice);

      return {
        gasLimit,
        gasPrice,
        totalCost,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to estimate gas');
      throw new OGServiceError(
        'Gas estimation failed',
        OGErrorCode.CONTRACT_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      logger.error({ error }, 'Failed to get block number');
      throw new OGServiceError(
        'Failed to get block number',
        OGErrorCode.CONNECTION_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string): Promise<ethers.TransactionResponse | null> {
    try {
      return await this.provider.getTransaction(txHash);
    } catch (error) {
      logger.error({ error, txHash }, 'Failed to get transaction');
      throw new OGServiceError(
        'Failed to get transaction',
        OGErrorCode.CONTRACT_ERROR,
        500,
        error
      );
    }
  }

  /**
   * Subscribe to contract events
   */
  subscribeToEvents(
    contractType: 'oracle' | 'voting' | 'token',
    eventName: string,
    callback: (event: any) => void
  ): void {
    let contract: ethers.Contract | undefined;

    switch (contractType) {
      case 'oracle':
        contract = this.oracleHubContract;
        break;
      case 'voting':
        contract = this.votingContract;
        break;
      case 'token':
        contract = this.tokenContract;
        break;
    }

    if (!contract) {
      logger.warn({ contractType }, 'Contract not initialized for event subscription');
      return;
    }

    contract.on(eventName, callback);
    logger.info({ contractType, eventName }, 'Subscribed to contract event');
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribeFromAllEvents(): void {
    if (this.oracleHubContract) {
      this.oracleHubContract.removeAllListeners();
    }
    if (this.votingContract) {
      this.votingContract.removeAllListeners();
    }
    if (this.tokenContract) {
      this.tokenContract.removeAllListeners();
    }
    logger.info('Unsubscribed from all contract events');
  }

  /**
   * Check if service is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get provider instance
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get wallet address
   */
  async getWalletAddress(): Promise<string | null> {
    if (!this.wallet) {
      return null;
    }
    return await this.wallet.getAddress();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();