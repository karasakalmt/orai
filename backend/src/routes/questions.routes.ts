import { FastifyInstance } from 'fastify';
import { EventMonitorService } from '../services/event-monitor.service';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

const eventMonitor = new EventMonitorService();

export async function questionsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/questions/all
   * Get all questions with their answers
   */
  fastify.get('/all', async (request, reply) => {
    try {
      const questions = await eventMonitor.getAllQuestionsWithAnswers();

      return reply.status(200).send({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch all questions');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch questions'
      });
    }
  });

  /**
   * GET /api/questions/pending
   * Get all pending questions (not answered)
   */
  fastify.get('/pending', async (request, reply) => {
    try {
      const questions = await eventMonitor.getPendingQuestions();

      return reply.status(200).send({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch pending questions');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch pending questions'
      });
    }
  });

  /**
   * GET /api/questions/answered
   * Get all answered questions
   */
  fastify.get('/answered', async (request, reply) => {
    try {
      const questions = await eventMonitor.getAnsweredQuestions();

      return reply.status(200).send({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch answered questions');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch answered questions'
      });
    }
  });

  /**
   * GET /api/questions/:questionId
   * Get a specific question with answer
   */
  fastify.get<{
    Params: { questionId: string }
  }>('/:questionId', async (request, reply) => {
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

      return reply.status(200).send({
        success: true,
        data: question
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch question');
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch question'
      });
    }
  });

  /**
   * GET /api/questions/sync
   * Manually trigger sync of past events
   */
  fastify.post<{
    Body: { fromBlock?: number }
  }>('/sync', async (request, reply) => {
    try {
      const { fromBlock = 0 } = request.body || {};

      await eventMonitor.syncPastEvents(fromBlock);

      return reply.status(200).send({
        success: true,
        message: 'Events synced successfully'
      });
    } catch (error) {
      logger.error({ error }, 'Failed to sync events');
      return reply.status(500).send({
        success: false,
        error: 'Failed to sync events'
      });
    }
  });
}
