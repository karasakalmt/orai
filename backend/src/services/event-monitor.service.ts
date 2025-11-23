import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { OG_RPC_URL, OG_CONTRACTS } from '../config/0g.config';

/**
 * Event Monitor Service
 * Watches blockchain events and syncs questions/answers to database
 */
export class EventMonitorService {
  private provider: ethers.JsonRpcProvider;
  private oracleContract: ethers.Contract;
  private prisma: PrismaClient;
  private monitoring: boolean = false;

  private readonly ORACLE_HUB_ABI = [
    'event QuestionSubmitted(bytes32 indexed questionId, address indexed submitter, string question, uint256 fee)',
    'event AnswerSubmitted(bytes32 indexed questionId, bytes32 storageHash, string answer)',
    'function getQuestion(bytes32 questionId) public view returns (tuple(string question, address submitter, uint256 timestamp, uint8 status, uint256 fee))',
  ];

  constructor() {
    this.provider = new ethers.JsonRpcProvider(OG_RPC_URL);

    // Get oracle hub address
    const oracleHubAddress = OG_CONTRACTS.oracle.hub;

    // Validate contract address
    if (!oracleHubAddress || oracleHubAddress === '0x0000000000000000000000000000000000000000') {
      logger.warn('⚠️  Oracle Hub contract address not configured. Set ORACLE_HUB_ADDRESS in .env');
      logger.warn('Event monitoring will be disabled until contract is deployed');
      // Create a dummy contract that won't be used
      this.oracleContract = new ethers.Contract(
        ethers.ZeroAddress,
        this.ORACLE_HUB_ABI,
        this.provider
      );
    } else {
      this.oracleContract = new ethers.Contract(
        oracleHubAddress,
        this.ORACLE_HUB_ABI,
        this.provider
      );
      logger.info({ oracleHubAddress }, 'Event monitor initialized with Oracle Hub contract');
    }

    this.prisma = new PrismaClient();
  }

  /**
   * Start monitoring blockchain events
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoring) {
      logger.warn('Event monitoring already running');
      return;
    }

    // Check if contract is configured
    const oracleHubAddress = OG_CONTRACTS.oracle.hub;
    if (!oracleHubAddress || oracleHubAddress === '0x0000000000000000000000000000000000000000') {
      logger.warn('⚠️  Skipping event monitoring - Oracle Hub contract not configured');
      return;
    }

    this.monitoring = true;
    logger.info('🔍 Starting blockchain event monitoring...');

    // Listen for QuestionSubmitted events
    this.oracleContract.on(
      'QuestionSubmitted',
      async (questionId: string, submitter: string, question: string, fee: bigint, event: any) => {
        try {
          await this.handleQuestionSubmitted(questionId, submitter, question, fee, event);
        } catch (error) {
          logger.error({ error, questionId }, 'Failed to handle QuestionSubmitted event');
        }
      }
    );

    // Listen for AnswerSubmitted events
    this.oracleContract.on(
      'AnswerSubmitted',
      async (questionId: string, storageHash: string, answer: string, event: any) => {
        try {
          await this.handleAnswerSubmitted(questionId, storageHash, answer, event);
        } catch (error) {
          logger.error({ error, questionId }, 'Failed to handle AnswerSubmitted event');
        }
      }
    );

    logger.info('✅ Event monitoring started successfully');
  }

  /**
   * Stop monitoring blockchain events
   */
  async stopMonitoring(): Promise<void> {
    if (!this.monitoring) {
      return;
    }

    this.monitoring = false;
    this.oracleContract.removeAllListeners();
    await this.prisma.$disconnect();
    logger.info('Event monitoring stopped');
  }

  /**
   * Handle QuestionSubmitted event
   */
  private async handleQuestionSubmitted(
    questionId: string,
    submitter: string,
    question: string,
    fee: bigint,
    event: any
  ): Promise<void> {
    logger.info({
      questionId,
      submitter,
      question: question.substring(0, 100) + '...',
      fee: ethers.formatEther(fee),
      blockNumber: event.log.blockNumber,
      transactionHash: event.log.transactionHash
    }, '📩 New QuestionSubmitted event');

    // Check if question already exists
    const existing = await this.prisma.question.findUnique({
      where: { questionId }
    });

    if (existing) {
      logger.info({ questionId }, 'Question already in database, skipping');
      return;
    }

    // Create question in database
    await this.prisma.question.create({
      data: {
        questionId,
        questionText: question,
        referenceUrls: [], // Can be extracted from event data if needed
        submitter,
        status: 'pending',
        feePaid: ethers.formatEther(fee),
        timestamp: new Date()
      }
    });

    // Update or create user
    await this.prisma.user.upsert({
      where: { address: submitter },
      create: {
        address: submitter,
        totalQuestions: 1
      },
      update: {
        totalQuestions: { increment: 1 }
      }
    });

    logger.info({ questionId }, '✅ Question saved to database');
  }

  /**
   * Handle AnswerSubmitted event
   */
  private async handleAnswerSubmitted(
    questionId: string,
    storageHash: string,
    answer: string,
    event: any
  ): Promise<void> {
    logger.info({
      questionId,
      storageHash,
      answer: answer.substring(0, 100) + '...',
      blockNumber: event.log.blockNumber,
      transactionHash: event.log.transactionHash
    }, '📝 New AnswerSubmitted event');

    // Check if answer already exists
    const existingAnswer = await this.prisma.answer.findUnique({
      where: { questionId }
    });

    if (existingAnswer) {
      logger.info({ questionId }, 'Answer already in database, skipping');
      return;
    }

    // Create answer in database
    await this.prisma.answer.create({
      data: {
        questionId,
        answerText: answer,
        evidenceSummary: 'Generated from blockchain event',
        storageHash,
        modelHash: '', // Will be populated from compute results
        inputHash: '',
        outputHash: '',
        verified: false,
        timestamp: new Date()
      }
    });

    // Update question status
    await this.prisma.question.update({
      where: { questionId },
      data: { status: 'answered' }
    });

    // Create voting stats (24 hour voting period)
    const votingEndTime = new Date();
    votingEndTime.setHours(votingEndTime.getHours() + 24);

    await this.prisma.votingStats.create({
      data: {
        questionId,
        votingEndTime,
        finalized: false
      }
    });

    logger.info({ questionId }, '✅ Answer saved to database and voting opened');
  }

  /**
   * Sync past events from blockchain
   */
  async syncPastEvents(fromBlock: number = 0): Promise<void> {
    logger.info({ fromBlock }, 'Syncing past events from blockchain...');

    try {
      const currentBlock = await this.provider.getBlockNumber();

      // Query QuestionSubmitted events
      const questionFilter = this.oracleContract.filters.QuestionSubmitted();
      const questionEvents = await this.oracleContract.queryFilter(
        questionFilter,
        fromBlock,
        currentBlock
      );

      logger.info({ count: questionEvents.length }, 'Found QuestionSubmitted events');

      for (const event of questionEvents) {
        const [questionId, submitter, question, fee] = event.args || [];
        await this.handleQuestionSubmitted(questionId, submitter, question, fee, event);
      }

      // Query AnswerSubmitted events
      const answerFilter = this.oracleContract.filters.AnswerSubmitted();
      const answerEvents = await this.oracleContract.queryFilter(
        answerFilter,
        fromBlock,
        currentBlock
      );

      logger.info({ count: answerEvents.length }, 'Found AnswerSubmitted events');

      for (const event of answerEvents) {
        const [questionId, storageHash, answer] = event.args || [];
        await this.handleAnswerSubmitted(questionId, storageHash, answer, event);
      }

      logger.info('✅ Past events synced successfully');
    } catch (error) {
      logger.error({ error, fromBlock }, 'Failed to sync past events');
      throw error;
    }
  }

  /**
   * Get all questions with their answers
   */
  async getAllQuestionsWithAnswers() {
    return await this.prisma.question.findMany({
      include: {
        answer: {
          include: {
            votingStats: true
          }
        },
        votes: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }

  /**
   * Get pending questions (not answered yet)
   */
  async getPendingQuestions() {
    return await this.prisma.question.findMany({
      where: {
        status: 'pending'
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }

  /**
   * Get answered questions
   */
  async getAnsweredQuestions() {
    return await this.prisma.question.findMany({
      where: {
        status: 'answered'
      },
      include: {
        answer: {
          include: {
            votingStats: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }
}
