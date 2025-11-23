import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getContractServices, CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../contracts';
import { logger } from '../utils/logger';

interface SubmitQuestionBody {
  question: string;
  referenceUrls: string[];
  fee: string; // in ETH
}

interface GetQuestionParams {
  questionId: string;
}

interface CastVoteBody {
  questionId: string;
  approved: boolean;
}

interface StakeBody {
  amount: string; // in ORAI tokens
}

interface GetBalanceParams {
  address: string;
}

/**
 * Contract interaction routes
 * These endpoints interact with deployed smart contracts on 0G testnet
 */
export async function contractRoutes(app: FastifyInstance) {
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  const contracts = getContractServices(privateKey);

  /**
   * Get contract addresses and network info
   */
  app.get('/api/contracts/info', async (request, reply) => {
    return {
      success: true,
      contracts: CONTRACT_ADDRESSES,
      network: NETWORK_CONFIG,
    };
  });

  /**
   * Submit a question to the oracle
   */
  app.post<{ Body: SubmitQuestionBody }>(
    '/api/contracts/oracle/submit-question',
    {
      schema: {
        tags: ['contracts'],
        body: {
          type: 'object',
          required: ['question', 'fee'],
          properties: {
            question: { type: 'string', minLength: 10 },
            referenceUrls: {
              type: 'array',
              items: { type: 'string', format: 'uri' },
              default: [],
            },
            fee: { type: 'string', description: 'Fee in ETH (e.g., "0.01")' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SubmitQuestionBody }>, reply: FastifyReply) => {
      try {
        const { question, referenceUrls = [], fee } = request.body;

        const result = await contracts.oracle.submitQuestion(question, referenceUrls, fee);

        logger.info({ questionId: result.questionId }, 'Question submitted to oracle');

        return reply.code(200).send({
          success: true,
          questionId: result.questionId,
          txHash: result.txHash,
          explorerUrl: `${NETWORK_CONFIG.explorerUrl}/tx/${result.txHash}`,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to submit question');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to submit question',
        });
      }
    }
  );

  /**
   * Get question details
   */
  app.get<{ Params: GetQuestionParams }>(
    '/api/contracts/oracle/question/:questionId',
    {
      schema: {
        tags: ['contracts'],
        params: {
          type: 'object',
          properties: {
            questionId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: GetQuestionParams }>, reply: FastifyReply) => {
      try {
        const { questionId } = request.params;

        const question = await contracts.oracle.getQuestion(questionId);

        return reply.code(200).send({
          success: true,
          question: {
            ...question,
            fee: question.fee.toString(),
            timestamp: question.timestamp.toString(),
          },
        });
      } catch (error) {
        logger.error({ error }, 'Failed to get question');
        return reply.code(404).send({
          success: false,
          error: error instanceof Error ? error.message : 'Question not found',
        });
      }
    }
  );

  /**
   * Get answer for a question
   */
  app.get<{ Params: GetQuestionParams }>(
    '/api/contracts/oracle/answer/:questionId',
    {
      schema: {
        tags: ['contracts'],
      },
    },
    async (request: FastifyRequest<{ Params: GetQuestionParams }>, reply: FastifyReply) => {
      try {
        const { questionId } = request.params;

        const answer = await contracts.oracle.getAnswer(questionId);

        return reply.code(200).send({
          success: true,
          answer,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to get answer');
        return reply.code(404).send({
          success: false,
          error: error instanceof Error ? error.message : 'Answer not found',
        });
      }
    }
  );

  /**
   * Cast a vote
   */
  app.post<{ Body: CastVoteBody }>(
    '/api/contracts/voting/cast-vote',
    {
      schema: {
        tags: ['contracts'],
        body: {
          type: 'object',
          required: ['questionId', 'approved'],
          properties: {
            questionId: { type: 'string' },
            approved: { type: 'boolean' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CastVoteBody }>, reply: FastifyReply) => {
      try {
        const { questionId, approved } = request.body;

        const result = await contracts.voting.castVote(questionId, approved);

        logger.info({ questionId, approved }, 'Vote cast');

        return reply.code(200).send({
          success: true,
          txHash: result.txHash,
          explorerUrl: `${NETWORK_CONFIG.explorerUrl}/tx/${result.txHash}`,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to cast vote');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to cast vote',
        });
      }
    }
  );

  /**
   * Get voting results
   */
  app.get<{ Params: GetQuestionParams }>(
    '/api/contracts/voting/results/:questionId',
    {
      schema: {
        tags: ['contracts'],
      },
    },
    async (request: FastifyRequest<{ Params: GetQuestionParams }>, reply: FastifyReply) => {
      try {
        const { questionId } = request.params;

        const results = await contracts.voting.getVotingResults(questionId);

        return reply.code(200).send({
          success: true,
          results: {
            approved: results.approved,
            voteCount: results.voteCount.toString(),
          },
        });
      } catch (error) {
        logger.error({ error }, 'Failed to get voting results');
        return reply.code(404).send({
          success: false,
          error: error instanceof Error ? error.message : 'Voting results not found',
        });
      }
    }
  );

  /**
   * Get token balance
   */
  app.get<{ Params: GetBalanceParams }>(
    '/api/contracts/token/balance/:address',
    {
      schema: {
        tags: ['contracts'],
      },
    },
    async (request: FastifyRequest<{ Params: GetBalanceParams }>, reply: FastifyReply) => {
      try {
        const { address } = request.params;

        const balance = await contracts.token.getBalance(address);
        const decimals = await contracts.token.getDecimals();

        return reply.code(200).send({
          success: true,
          balance: {
            raw: balance.toString(),
            formatted: contracts.token.formatAmount(balance, decimals),
            decimals,
          },
        });
      } catch (error) {
        logger.error({ error }, 'Failed to get token balance');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get balance',
        });
      }
    }
  );

  /**
   * Get stake info
   */
  app.get<{ Params: GetBalanceParams }>(
    '/api/contracts/token/stake-info/:address',
    {
      schema: {
        tags: ['contracts'],
      },
    },
    async (request: FastifyRequest<{ Params: GetBalanceParams }>, reply: FastifyReply) => {
      try {
        const { address } = request.params;

        const stakeInfo = await contracts.token.getStakeInfo(address);
        const decimals = await contracts.token.getDecimals();

        return reply.code(200).send({
          success: true,
          stakeInfo: {
            amount: stakeInfo.amount.toString(),
            amountFormatted: contracts.token.formatAmount(stakeInfo.amount, decimals),
            timestamp: stakeInfo.timestamp.toString(),
            rewardDebt: stakeInfo.rewardDebt.toString(),
            isStaked: stakeInfo.isStaked,
          },
        });
      } catch (error) {
        logger.error({ error }, 'Failed to get stake info');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get stake info',
        });
      }
    }
  );

  /**
   * Stake tokens
   */
  app.post<{ Body: StakeBody }>(
    '/api/contracts/token/stake',
    {
      schema: {
        tags: ['contracts'],
        body: {
          type: 'object',
          required: ['amount'],
          properties: {
            amount: { type: 'string', description: 'Amount in ORAI tokens' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: StakeBody }>, reply: FastifyReply) => {
      try {
        const { amount } = request.body;

        const decimals = await contracts.token.getDecimals();
        const amountWei = contracts.token.parseAmount(amount, decimals);

        const result = await contracts.token.stake(amountWei);

        logger.info({ amount }, 'Tokens staked');

        return reply.code(200).send({
          success: true,
          txHash: result.txHash,
          explorerUrl: `${NETWORK_CONFIG.explorerUrl}/tx/${result.txHash}`,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to stake tokens');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to stake tokens',
        });
      }
    }
  );

  /**
   * Get oracle statistics
   */
  app.get('/api/contracts/oracle/stats', async (request, reply) => {
    try {
      const [totalQuestions, minFee] = await Promise.all([
        contracts.oracle.getTotalQuestions(),
        contracts.oracle.getMinOracleFee(),
      ]);

      return reply.code(200).send({
        success: true,
        stats: {
          totalQuestions: totalQuestions.toString(),
          minOracleFee: minFee.toString(),
          minOracleFeeETH: (Number(minFee) / 1e18).toString(),
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get oracle stats');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      });
    }
  });

  logger.info('Contract routes registered');
}
