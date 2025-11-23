import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from './addresses';
import OracleContractABI from './abis/OracleContract.json';
import { logger } from '../utils/logger';

/**
 * Service for interacting with the OracleContract
 */
export class OracleContractService {
  private contract: ethers.Contract;
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Wallet;

  constructor(privateKey?: string) {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);

    // Read-only contract instance
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.OracleContract,
      OracleContractABI,
      this.provider
    );

    // If private key is provided, create a signer for write operations
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESSES.OracleContract,
        OracleContractABI,
        this.signer
      );
    }
  }

  /**
   * Submit a question to the oracle
   */
  async submitQuestion(
    question: string,
    referenceUrls: string[],
    fee: string // in ETH
  ): Promise<{ questionId: string; txHash: string }> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    try {
      const tx = await this.contract.queryOracle(question, referenceUrls, {
        value: ethers.parseEther(fee),
      });

      const receipt = await tx.wait();

      // Extract questionId from event logs
      const event = receipt.logs
        .map((log: any) => {
          try {
            return this.contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e && e.name === 'QuestionSubmitted');

      const questionId = event?.args?.questionId || '0x0';

      logger.info({ questionId, txHash: receipt.hash }, 'Question submitted to oracle contract');

      return {
        questionId,
        txHash: receipt.hash,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to submit question to oracle contract');
      throw error;
    }
  }

  /**
   * Get question details
   */
  async getQuestion(questionId: string): Promise<{
    asker: string;
    question: string;
    referenceUrls: string[];
    fee: bigint;
    timestamp: bigint;
    answered: boolean;
    finalized: boolean;
  }> {
    try {
      const result = await this.contract.getQuestion(questionId);

      return {
        asker: result.asker,
        question: result.question,
        referenceUrls: result.referenceUrls,
        fee: result.fee,
        timestamp: result.timestamp,
        answered: result.answered,
        finalized: result.finalized,
      };
    } catch (error) {
      logger.error({ error, questionId }, 'Failed to get question from oracle contract');
      throw error;
    }
  }

  /**
   * Get answer for a question
   */
  async getAnswer(questionId: string): Promise<{
    answer: string;
    verified: boolean;
  }> {
    try {
      const result = await this.contract.getAnswer(questionId);

      return {
        answer: result.answer,
        verified: result.verified,
      };
    } catch (error) {
      logger.error({ error, questionId }, 'Failed to get answer from oracle contract');
      throw error;
    }
  }

  /**
   * Submit an answer to a question (relayer only)
   */
  async submitAnswer(
    questionId: string,
    answer: string,
    storageHash: string,
    modelHash: string,
    inputHash: string,
    outputHash: string
  ): Promise<{ txHash: string }> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    try {
      const tx = await this.contract.submitAnswer(
        questionId,
        answer,
        storageHash,
        modelHash,
        inputHash,
        outputHash
      );

      const receipt = await tx.wait();

      logger.info({ questionId, txHash: receipt.hash }, 'Answer submitted to oracle contract');

      return { txHash: receipt.hash };
    } catch (error) {
      logger.error({ error, questionId }, 'Failed to submit answer to oracle contract');
      throw error;
    }
  }

  /**
   * Get minimum oracle fee
   */
  async getMinOracleFee(): Promise<bigint> {
    try {
      return await this.contract.minOracleFee();
    } catch (error) {
      logger.error({ error }, 'Failed to get min oracle fee');
      throw error;
    }
  }

  /**
   * Get total questions count
   */
  async getTotalQuestions(): Promise<bigint> {
    try {
      return await this.contract.totalQuestions();
    } catch (error) {
      logger.error({ error }, 'Failed to get total questions');
      throw error;
    }
  }

  /**
   * Listen to QuestionSubmitted events
   */
  onQuestionSubmitted(
    callback: (questionId: string, asker: string, question: string, fee: bigint) => void
  ): void {
    this.contract.on('QuestionSubmitted', (questionId, asker, question, fee, event) => {
      logger.info({ questionId, asker }, 'QuestionSubmitted event received');
      callback(questionId, asker, question, fee);
    });
  }

  /**
   * Listen to AnswerSubmitted events
   */
  onAnswerSubmitted(
    callback: (questionId: string, relayer: string, answer: string, storageHash: string) => void
  ): void {
    this.contract.on('AnswerSubmitted', (questionId, relayer, answer, storageHash, event) => {
      logger.info({ questionId, relayer }, 'AnswerSubmitted event received');
      callback(questionId, relayer, answer, storageHash);
    });
  }

  /**
   * Stop listening to all events
   */
  removeAllListeners(): void {
    this.contract.removeAllListeners();
  }
}
