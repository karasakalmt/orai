import { OracleContractService } from '../contracts/OracleContract.service';
import { VotingContractService } from '../contracts/VotingContract.service';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

/**
 * Event types emitted by the listener service
 */
export interface OracleEvents {
  'question:submitted': (data: {
    questionId: string;
    asker: string;
    question: string;
    fee: bigint;
  }) => void;

  'answer:submitted': (data: {
    questionId: string;
    relayer: string;
    answer: string;
    storageHash: string;
  }) => void;

  'vote:cast': (data: {
    questionId: string;
    voter: string;
    approved: boolean;
    stake: bigint;
  }) => void;
}

/**
 * Service for listening to blockchain events
 */
export class EventListenerService extends EventEmitter {
  private oracleService: OracleContractService;
  private votingService: VotingContractService;
  private isListening: boolean = false;

  constructor(privateKey?: string) {
    super();
    this.oracleService = new OracleContractService(privateKey);
    this.votingService = new VotingContractService(privateKey);
  }

  /**
   * Start listening to all contract events
   */
  start(): void {
    if (this.isListening) {
      logger.warn('Event listener already running');
      return;
    }

    logger.info('Starting blockchain event listeners...');

    // Listen to QuestionSubmitted events
    this.oracleService.onQuestionSubmitted((questionId, asker, question, fee) => {
      logger.info({
        questionId,
        asker,
        question: question.substring(0, 100) + '...',
        fee: fee.toString()
      }, 'QuestionSubmitted event received');

      this.emit('question:submitted', {
        questionId,
        asker,
        question,
        fee
      });
    });

    // Listen to AnswerSubmitted events
    this.oracleService.onAnswerSubmitted((questionId, relayer, answer, storageHash) => {
      logger.info({
        questionId,
        relayer,
        answer: answer.substring(0, 100) + '...',
        storageHash
      }, 'AnswerSubmitted event received');

      this.emit('answer:submitted', {
        questionId,
        relayer,
        answer,
        storageHash
      });
    });

    // Listen to VoteCast events
    this.votingService.onVoteCast((questionId, voter, approved, stake) => {
      logger.info({
        questionId,
        voter,
        approved,
        stake: stake.toString()
      }, 'VoteCast event received');

      this.emit('vote:cast', {
        questionId,
        voter,
        approved,
        stake
      });
    });

    this.isListening = true;
    logger.info('✅ Blockchain event listeners started successfully');
  }

  /**
   * Stop listening to contract events
   */
  stop(): void {
    if (!this.isListening) {
      logger.warn('Event listener not running');
      return;
    }

    logger.info('Stopping blockchain event listeners...');

    this.oracleService.removeAllListeners();
    this.votingService.removeAllListeners();
    this.removeAllListeners();

    this.isListening = false;
    logger.info('Event listeners stopped');
  }

  /**
   * Check if service is listening
   */
  isActive(): boolean {
    return this.isListening;
  }
}
