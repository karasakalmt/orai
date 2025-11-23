import { Router, Request, Response } from 'express';
import { io } from '../server';
import { EventMonitorService } from '../services/event-monitor.service';

const router = Router();
const eventMonitor = new EventMonitorService();

// Mock data store
const questions: any[] = [
  {
    id: '1',
    question: 'What is the current TVL across all major DeFi protocols on Ethereum?',
    answer: 'As of November 2024, the total value locked (TVL) across major DeFi protocols on Ethereum is approximately $45.2 billion.',
    status: 'validated',
    asker: '0x1234...5678',
    timestamp: Date.now() - 3600000,
    fee: 12,
    isPriority: false,
    votes: { yes: 245, no: 12 },
    references: ['https://defillama.com']
  },
  {
    id: '2',
    question: 'Is the recent Bitcoin halving affecting mining profitability significantly?',
    answer: 'The 2024 Bitcoin halving has reduced mining rewards from 6.25 to 3.125 BTC per block.',
    status: 'answered',
    asker: '0xabcd...efgh',
    timestamp: Date.now() - 7200000,
    fee: 15,
    isPriority: true,
    votes: { yes: 189, no: 8 }
  },
  {
    id: '3',
    question: 'What are the gas optimization techniques for Solidity smart contracts in 2024?',
    status: 'processing',
    asker: '0x9876...5432',
    timestamp: Date.now() - 1800000,
    fee: 10,
    isPriority: false
  }
];

// GET /api/questions
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, sortBy, search, page = 1, limit = 20 } = req.query;

    // Fetch real questions from blockchain database
    let allQuestions = await eventMonitor.getAllQuestionsWithAnswers();

    // Map to expected format
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
      references: q.referenceUrls || []
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

    res.json({
      questions: paginatedQuestions,
      pagination: {
        total: filtered.length,
        page: pageNum,
        pages: Math.ceil(filtered.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch questions'
      }
    });
  }
});

// GET /api/questions/:id
router.get('/:id', (req: Request, res: Response) => {
  const question = questions.find(q => q.id === req.params.id);
  
  if (!question) {
    return res.status(404).json({
      error: {
        code: 'QUESTION_NOT_FOUND',
        message: 'Question not found'
      }
    });
  }
  
  res.json(question);
});

// POST /api/questions
router.post('/', (req: Request, res: Response) => {
  const { question, referenceUrls, isPriority, walletAddress, signature, fee } = req.body;
  
  // TODO: Verify signature
  
  const newQuestion = {
    id: (questions.length + 1).toString(),
    question,
    referenceUrls,
    isPriority,
    walletAddress,
    fee,
    status: 'pending',
    timestamp: Date.now(),
    transactionHash: '0x' + Math.random().toString(16).substr(2)
  };
  
  questions.push(newQuestion);
  
  // Emit WebSocket event
  io.to('questions').emit('question:submitted', {
    type: 'question:submitted',
    data: {
      id: newQuestion.id,
      question: newQuestion.question,
      asker: walletAddress
    }
  });
  
  res.status(201).json({
    id: newQuestion.id,
    questionId: newQuestion.id,
    transactionHash: newQuestion.transactionHash,
    status: 'pending',
    estimatedTime: isPriority ? 60 : 300,
    message: 'Question submitted successfully'
  });
});

// GET /api/questions/user/:address
router.get('/user/:address', (req: Request, res: Response) => {
  const userQuestions = questions.filter(q => 
    q.asker === req.params.address || q.walletAddress === req.params.address
  );
  
  const statistics = {
    totalQuestions: userQuestions.length,
    answered: userQuestions.filter(q => q.status === 'answered' || q.status === 'validated').length,
    pending: userQuestions.filter(q => q.status === 'pending' || q.status === 'processing').length,
    totalSpent: userQuestions.reduce((sum, q) => sum + (q.fee || 0), 0)
  };
  
  res.json({
    questions: userQuestions,
    statistics
  });
});

// GET /api/questions/blockchain/all
// Get all questions from blockchain with answers
router.get('/blockchain/all', async (req: Request, res: Response) => {
  try {
    const questions = await eventMonitor.getAllQuestionsWithAnswers();
    res.json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Failed to fetch blockchain questions:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch questions from blockchain'
      }
    });
  }
});

// GET /api/questions/blockchain/pending
// Get pending questions from blockchain (not answered yet)
router.get('/blockchain/pending', async (req: Request, res: Response) => {
  try {
    const questions = await eventMonitor.getPendingQuestions();
    res.json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Failed to fetch pending questions:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch pending questions'
      }
    });
  }
});

// GET /api/questions/blockchain/answered
// Get answered questions from blockchain
router.get('/blockchain/answered', async (req: Request, res: Response) => {
  try {
    const questions = await eventMonitor.getAnsweredQuestions();
    res.json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('Failed to fetch answered questions:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch answered questions'
      }
    });
  }
});

// POST /api/questions/blockchain/sync
// Manually sync past blockchain events
router.post('/blockchain/sync', async (req: Request, res: Response) => {
  try {
    const { fromBlock = 0 } = req.body;
    await eventMonitor.syncPastEvents(fromBlock);
    res.json({
      success: true,
      message: 'Blockchain events synced successfully'
    });
  } catch (error) {
    console.error('Failed to sync blockchain events:', error);
    res.status(500).json({
      error: {
        code: 'SYNC_FAILED',
        message: 'Failed to sync blockchain events'
      }
    });
  }
});

export default router;
