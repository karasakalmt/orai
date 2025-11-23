import { FastifyInstance } from 'fastify';
import { EventMonitorService } from '../services/event-monitor.service';
import { prisma } from '../config/database';

const eventMonitor = new EventMonitorService();

export async function questionsRoutes(fastify: FastifyInstance) {
  // GET /api/questions
  fastify.get('/api/questions', async (request, reply) => {
    try {
      const { status, sortBy, search, page = '1', limit = '20' } = request.query as any;

      // Fetch all questions from database (both from blockchain events and relayer)
      const dbQuestions = await prisma.question.findMany({
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

      let allQuestions = dbQuestions;

      // Map to expected format with verification and storage data
      let filtered = allQuestions.map((q: any) => ({
        id: q.questionId,
        question: q.questionText,
        answer: q.answer?.answerText,
        status: q.status,
        asker: q.submitter,
        timestamp: new Date(q.timestamp).getTime(),
        fee: parseFloat(q.feePaid || '0'),
        isPriority: false,
        votes: {
          yes: q.answer?.votingStats?.votesCorrect || 0,
          no: q.answer?.votingStats?.votesIncorrect || 0
        },
        references: q.referenceUrls || [],
        // Verification & Storage Data
        verification: q.answer ? {
          verified: q.answer.verified,
          modelHash: q.answer.modelHash,
          inputHash: q.answer.inputHash,
          outputHash: q.answer.outputHash,
          evidenceSummary: q.answer.evidenceSummary
        } : null,
        storage: q.answer ? {
          storageHash: q.answer.storageHash,
          storageUrl: `https://storagescan-galileo.0g.ai/hash/${q.answer.storageHash}`,
          timestamp: new Date(q.answer.timestamp).getTime()
        } : null
      }));

      // Filter by status
      if (status) {
        filtered = filtered.filter((q: any) => q.status === status);
      }

      // Search
      if (search) {
        const searchStr = search.toString().toLowerCase();
        filtered = filtered.filter((q: any) =>
          q.question.toLowerCase().includes(searchStr)
        );
      }

      // Sort
      if (sortBy === 'fee') {
        filtered.sort((a: any, b: any) => b.fee - a.fee);
      } else if (sortBy === 'votes') {
        filtered.sort((a: any, b: any) => {
          const aVotes = (a.votes?.yes || 0) + (a.votes?.no || 0);
          const bVotes = (b.votes?.yes || 0) + (b.votes?.no || 0);
          return bVotes - aVotes;
        });
      } else {
        // Default to recent (sortBy=recent or no sortBy)
        filtered.sort((a: any, b: any) => b.timestamp - a.timestamp);
      }

      // Pagination
      const pageNum = parseInt(page.toString());
      const limitNum = parseInt(limit.toString());
      const start = (pageNum - 1) * limitNum;
      const paginatedQuestions = filtered.slice(start, start + limitNum);

      return reply.send({
        questions: paginatedQuestions,
        pagination: {
          total: filtered.length,
          page: pageNum,
          pages: Math.ceil(filtered.length / limitNum)
        }
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch questions');
      return reply.status(500).send({
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch questions'
        }
      });
    }
  });

  // GET /api/questions/blockchain/all
  fastify.get('/api/questions/blockchain/all', async (request, reply) => {
    try {
      const questions = await eventMonitor.getAllQuestionsWithAnswers();
      return reply.send({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch all questions');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch questions from blockchain'
      });
    }
  });

  // GET /api/questions/pending (alias for blockchain/pending)
  fastify.get('/api/questions/pending', async (request, reply) => {
    try {
      const questions = await eventMonitor.getPendingQuestions();
      return reply.send({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch pending questions');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch pending questions'
      });
    }
  });

  // GET /api/questions/answered (alias for blockchain/answered)
  fastify.get('/api/questions/answered', async (request, reply) => {
    try {
      const questions = await eventMonitor.getAnsweredQuestions();
      return reply.send({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch answered questions');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch answered questions'
      });
    }
  });

  // GET /api/questions/blockchain/pending
  fastify.get('/api/questions/blockchain/pending', async (request, reply) => {
    try {
      const questions = await eventMonitor.getPendingQuestions();
      return reply.send({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch pending questions');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch pending questions'
      });
    }
  });

  // GET /api/questions/blockchain/answered
  fastify.get('/api/questions/blockchain/answered', async (request, reply) => {
    try {
      const questions = await eventMonitor.getAnsweredQuestions();
      return reply.send({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch answered questions');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch answered questions'
      });
    }
  });

  // POST /api/questions/blockchain/sync
  fastify.post<{
    Body: { fromBlock?: number }
  }>('/api/questions/blockchain/sync', async (request, reply) => {
    try {
      const { fromBlock = 0 } = request.body || {};
      await eventMonitor.syncPastEvents(fromBlock);
      return reply.send({
        success: true,
        message: 'Blockchain events synced successfully'
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to sync blockchain events');
      return reply.status(500).send({
        success: false,
        error: 'Failed to sync blockchain events'
      });
    }
  });

  // GET /api/questions/:questionId
  fastify.get<{
    Params: { questionId: string }
  }>('/api/questions/:questionId', async (request, reply) => {
    try {
      const { questionId } = request.params;

      const question = await prisma.question.findUnique({
        where: { questionId },
        include: {
          answer: {
            include: {
              votingStats: true
            }
          },
          votes: true
        }
      });

      if (!question) {
        return reply.status(404).send({
          success: false,
          error: 'Question not found'
        });
      }

      return reply.send({
        success: true,
        data: question
      });
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch question');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch question'
      });
    }
  });
}
