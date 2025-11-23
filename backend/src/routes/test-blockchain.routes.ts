import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { blockchainService } from '../services';
import { logger } from '../utils/logger';

interface TestQuestionBody {
  question: string;
  referenceUrls?: string[];
  paymentAmount?: string;
}

interface TestVoteBody {
  questionId: string;
  support: boolean;
  weight?: string;
}

/**
 * Test routes for blockchain operations
 * These endpoints test smart contract interactions on 0G Network
 */
export async function testBlockchainRoutes(app: FastifyInstance) {
  /**
   * Test blockchain connection
   */
  app.get('/api/test/blockchain/status', async (request, reply) => {
    try {
      const isConnected = blockchainService.isConnected();
      const [blockNumber, walletAddress, health] = await Promise.all([
        blockchainService.getBlockNumber(),
        blockchainService.getWalletAddress(),
        blockchainService.healthCheck(),
      ]);

      let walletBalance = null;
      if (walletAddress) {
        const balance = await blockchainService.getEthBalance(walletAddress);
        walletBalance = balance.formatted;
      }

      return reply.code(200).send({
        success: true,
        connected: isConnected,
        healthy: health,
        currentBlock: blockNumber,
        network: {
          name: '0G-Galileo-Testnet',
          chainId: 16602,
        },
        wallet: {
          address: walletAddress,
          balance: walletBalance ? `${walletBalance} 0G` : null,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get blockchain status');
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Test wallet initialization
   */
  app.post<{ Body: { privateKey: string } }>(
    '/api/test/blockchain/init-wallet',
    {
      schema: {
        description: 'Initialize wallet for blockchain operations',
        tags: ['test', 'blockchain'],
        body: {
          type: 'object',
          required: ['privateKey'],
          properties: {
            privateKey: { type: 'string', minLength: 64, maxLength: 66 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { privateKey } = request.body;

        await blockchainService.initializeWallet(privateKey);
        const walletAddress = await blockchainService.getWalletAddress();

        if (!walletAddress) {
          throw new Error('Failed to initialize wallet');
        }

        const balance = await blockchainService.getEthBalance(walletAddress);

        return reply.code(200).send({
          success: true,
          address: walletAddress,
          balance: `${balance.formatted} 0G`,
          message: 'Wallet initialized successfully',
        });
      } catch (error) {
        logger.error({ error }, 'Failed to initialize wallet');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Wallet initialization failed',
        });
      }
    }
  );

  /**
   * Get balance for an address
   */
  app.get<{ Params: { address: string } }>(
    '/api/test/blockchain/balance/:address',
    {
      schema: {
        description: 'Get balance for an address',
        tags: ['test', 'blockchain'],
        params: {
          type: 'object',
          properties: {
            address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { address } = request.params;

        const [ethBalance, tokenBalance] = await Promise.all([
          blockchainService.getEthBalance(address),
          blockchainService.getTokenBalance(address),
        ]);

        return reply.code(200).send({
          success: true,
          address,
          balances: {
            native: {
              balance: ethBalance.balance,
              formatted: `${ethBalance.formatted} 0G`,
            },
            token: {
              balance: tokenBalance.balance,
              formatted: `${tokenBalance.formatted} ORAI`,
              decimals: tokenBalance.decimals,
            },
          },
        });
      } catch (error) {
        logger.error({ error }, 'Failed to get balance');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get balance',
        });
      }
    }
  );

  /**
   * Test submitting a question (mock - requires deployed contracts)
   */
  app.post<{ Body: TestQuestionBody }>(
    '/api/test/blockchain/submit-question',
    {
      schema: {
        description: 'Submit a question to the oracle (mock)',
        tags: ['test', 'blockchain'],
        body: {
          type: 'object',
          required: ['question'],
          properties: {
            question: { type: 'string', minLength: 10 },
            referenceUrls: {
              type: 'array',
              items: { type: 'string', format: 'uri' },
            },
            paymentAmount: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { question, referenceUrls, paymentAmount } = request.body;

        // Check if wallet is initialized
        const walletAddress = await blockchainService.getWalletAddress();
        if (!walletAddress) {
          return reply.code(400).send({
            success: false,
            error: 'Wallet not initialized. Please initialize wallet first.',
          });
        }

        // Check if contracts are deployed (they're not on testnet yet)
        if (OG_CONTRACTS.oracle.hub === '0x0000000000000000000000000000000000000000') {
          // Mock response for development
          const mockQuestionId = `0x${Buffer.from(question).toString('hex').slice(0, 64).padEnd(64, '0')}`;
          const mockTxHash = `0x${Buffer.from(Date.now().toString()).toString('hex').padEnd(64, '0')}`;

          logger.info(
            { questionId: mockQuestionId, question },
            'Mock question submission (contracts not deployed)'
          );

          return reply.code(200).send({
            success: true,
            mock: true,
            message: 'Mock submission (contracts not yet deployed)',
            data: {
              questionId: mockQuestionId,
              txHash: mockTxHash,
              blockNumber: await blockchainService.getBlockNumber(),
              question,
              referenceUrls: referenceUrls || [],
            },
          });
        }

        // Real submission when contracts are deployed
        const result = await blockchainService.submitQuestion(
          question,
          referenceUrls,
          paymentAmount
        );

        return reply.code(200).send({
          success: true,
          ...result,
          explorerUrl: `https://chainscan-galileo.0g.ai/tx/${result.txHash}`,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to submit question');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Question submission failed',
        });
      }
    }
  );

  /**
   * Test casting a vote (mock - requires deployed contracts)
   */
  app.post<{ Body: TestVoteBody }>(
    '/api/test/blockchain/cast-vote',
    {
      schema: {
        description: 'Cast a vote for answer validation (mock)',
        tags: ['test', 'blockchain'],
        body: {
          type: 'object',
          required: ['questionId', 'support'],
          properties: {
            questionId: { type: 'string', pattern: '^0x[a-fA-F0-9]{64}$' },
            support: { type: 'boolean' },
            weight: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { questionId, support, weight } = request.body;

        // Check if wallet is initialized
        const walletAddress = await blockchainService.getWalletAddress();
        if (!walletAddress) {
          return reply.code(400).send({
            success: false,
            error: 'Wallet not initialized. Please initialize wallet first.',
          });
        }

        // Check if contracts are deployed
        if (OG_CONTRACTS.oracle.voting === '0x0000000000000000000000000000000000000000') {
          // Mock response for development
          const mockTxHash = `0x${Buffer.from(Date.now().toString()).toString('hex').padEnd(64, '0')}`;

          logger.info(
            { questionId, support, weight },
            'Mock vote cast (contracts not deployed)'
          );

          return reply.code(200).send({
            success: true,
            mock: true,
            message: 'Mock vote (contracts not yet deployed)',
            data: {
              questionId,
              support,
              weight: weight || '1000000000000000000', // 1 token
              txHash: mockTxHash,
              blockNumber: await blockchainService.getBlockNumber(),
            },
          });
        }

        // Real vote when contracts are deployed
        const voteWeight = weight ? BigInt(weight) : undefined;
        const result = await blockchainService.castVote(questionId, support, voteWeight);

        return reply.code(200).send({
          success: true,
          ...result,
          explorerUrl: `https://chainscan-galileo.0g.ai/tx/${result.txHash}`,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to cast vote');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Vote casting failed',
        });
      }
    }
  );

  /**
   * Get vote count for a question
   */
  app.get<{ Params: { questionId: string } }>(
    '/api/test/blockchain/votes/:questionId',
    {
      schema: {
        description: 'Get vote count for a question',
        tags: ['test', 'blockchain'],
        params: {
          type: 'object',
          properties: {
            questionId: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { questionId } = request.params;

        // Mock response if contracts not deployed
        if (OG_CONTRACTS.oracle.voting === '0x0000000000000000000000000000000000000000') {
          return reply.code(200).send({
            success: true,
            mock: true,
            questionId,
            votes: {
              yesVotes: '0',
              noVotes: '0',
              totalWeight: '0',
              consensusReached: false,
              yesPercentage: 0,
              noPercentage: 0,
            },
          });
        }

        const voteCount = await blockchainService.getVoteCount(questionId);

        const totalWeight = Number(voteCount.totalWeight);
        const yesPercentage = totalWeight > 0
          ? (Number(voteCount.yesVotes) * 100) / totalWeight
          : 0;
        const noPercentage = totalWeight > 0
          ? (Number(voteCount.noVotes) * 100) / totalWeight
          : 0;

        return reply.code(200).send({
          success: true,
          questionId,
          votes: {
            yesVotes: voteCount.yesVotes.toString(),
            noVotes: voteCount.noVotes.toString(),
            totalWeight: voteCount.totalWeight.toString(),
            consensusReached: voteCount.consensusReached,
            yesPercentage: yesPercentage.toFixed(2),
            noPercentage: noPercentage.toFixed(2),
          },
        });
      } catch (error) {
        logger.error({ error }, 'Failed to get vote count');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get vote count',
        });
      }
    }
  );

  /**
   * Estimate gas for a transaction
   */
  app.post<{ Body: { to: string; data: string; value?: string } }>(
    '/api/test/blockchain/estimate-gas',
    {
      schema: {
        description: 'Estimate gas for a transaction',
        tags: ['test', 'blockchain'],
        body: {
          type: 'object',
          required: ['to', 'data'],
          properties: {
            to: { type: 'string' },
            data: { type: 'string' },
            value: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { to, data, value } = request.body;

        const estimate = await blockchainService.estimateGas(to, data, value);

        return reply.code(200).send({
          success: true,
          gasLimit: estimate.gasLimit.toString(),
          gasPrice: estimate.gasPrice.toString(),
          gasPriceGwei: (Number(estimate.gasPrice) / 1e9).toFixed(2),
          totalCost: `${estimate.totalCost} 0G`,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to estimate gas');
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Gas estimation failed',
        });
      }
    }
  );

  logger.info('Blockchain test routes registered');
}

// Import OG_CONTRACTS from the config
import { OG_CONTRACTS } from '../config/0g.config';