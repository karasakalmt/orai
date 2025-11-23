import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from './addresses';
import VotingContractABI from './abis/VotingContract.json';
import { logger } from '../utils/logger';

/**
 * Service for interacting with the VotingContract
 */
export class VotingContractService {
  private contract: ethers.Contract;
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Wallet;

  constructor(privateKey?: string) {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);

    // Read-only contract instance
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.VotingContract,
      VotingContractABI,
      this.provider
    );

    // If private key is provided, create a signer for write operations
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESSES.VotingContract,
        VotingContractABI,
        this.signer
      );
    }
  }

  /**
   * Cast a vote on a question
   */
  async castVote(
    questionId: string,
    approved: boolean
  ): Promise<{ txHash: string }> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    try {
      const tx = await this.contract.castVote(questionId, approved);
      const receipt = await tx.wait();

      logger.info(
        { questionId, approved, txHash: receipt.hash },
        'Vote cast on voting contract'
      );

      return { txHash: receipt.hash };
    } catch (error) {
      logger.error({ error, questionId, approved }, 'Failed to cast vote');
      throw error;
    }
  }

  /**
   * Start voting for a question (oracle contract only)
   */
  async startVoting(
    questionId: string,
    asker: string,
    fee: bigint
  ): Promise<{ roundId: bigint; txHash: string }> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    try {
      const tx = await this.contract.startVoting(questionId, asker, fee);
      const receipt = await tx.wait();

      // Extract roundId from return value or events
      const roundId = BigInt(0); // Would need to parse from receipt

      logger.info({ questionId, txHash: receipt.hash }, 'Voting started');

      return { roundId, txHash: receipt.hash };
    } catch (error) {
      logger.error({ error, questionId }, 'Failed to start voting');
      throw error;
    }
  }

  /**
   * Get voting results for a question
   */
  async getVotingResults(questionId: string): Promise<{
    approved: boolean;
    voteCount: bigint;
  }> {
    try {
      const result = await this.contract.getVotingResults(questionId);

      return {
        approved: result.approved,
        voteCount: result.voteCount,
      };
    } catch (error) {
      logger.error({ error, questionId }, 'Failed to get voting results');
      throw error;
    }
  }

  /**
   * Check if an address has voted on a question
   */
  async hasVoted(questionId: string, voter: string): Promise<boolean> {
    try {
      return await this.contract.hasVoted(questionId, voter);
    } catch (error) {
      logger.error({ error, questionId, voter }, 'Failed to check if voted');
      throw error;
    }
  }

  /**
   * Listen to VoteCast events
   */
  onVoteCast(
    callback: (
      questionId: string,
      voter: string,
      approved: boolean,
      stake: bigint
    ) => void
  ): void {
    this.contract.on('VoteCast', (questionId, voter, approved, stake, event) => {
      logger.info({ questionId, voter, approved }, 'VoteCast event received');
      callback(questionId, voter, approved, stake);
    });
  }

  /**
   * Stop listening to all events
   */
  removeAllListeners(): void {
    this.contract.removeAllListeners();
  }
}
