import { Router, Request, Response } from 'express';
import { io } from '../server';

const router = Router();

// Mock validation tasks
const validations: any[] = [
  {
    id: '1',
    questionId: 'q1',
    question: 'What are the key differences between optimistic and ZK rollups?',
    answer: 'Optimistic rollups assume transactions are valid by default and only run computation in case of challenges.',
    references: ['https://ethereum.org/en/developers/docs/scaling/'],
    submittedAt: Date.now() - 1800000,
    deadline: Date.now() + 3600000,
    totalValidators: 50,
    votesYes: 28,
    votesNo: 3,
    reward: 2,
    status: 'active'
  },
  {
    id: '2',
    questionId: 'q2',
    question: 'What is the current annual inflation rate of Ethereum post-merge?',
    answer: 'Post-merge, Ethereum has become deflationary with an average annual deflation rate of -0.5% to -1.5%.',
    references: ['https://ultrasound.money'],
    submittedAt: Date.now() - 3600000,
    deadline: Date.now() + 1800000,
    totalValidators: 75,
    votesYes: 42,
    votesNo: 8,
    reward: 3,
    status: 'active'
  }
];

// Track user votes
const userVotes: { [key: string]: { [validationId: string]: 'yes' | 'no' } } = {};

// GET /api/validations
router.get('/', (req: Request, res: Response) => {
  const { status, validator, unvoted } = req.query;
  
  let filtered = [...validations];
  
  // Filter by status
  if (status) {
    filtered = filtered.filter(v => v.status === status);
  }
  
  // Filter by unvoted (if validator address provided)
  if (unvoted === 'true' && validator) {
    const validatorVotes = userVotes[validator.toString()] || {};
    filtered = filtered.filter(v => !validatorVotes[v.id]);
  }
  
  // Add user's vote to each validation if validator provided
  if (validator) {
    const validatorVotes = userVotes[validator.toString()] || {};
    filtered = filtered.map(v => ({
      ...v,
      userVote: validatorVotes[v.id] || null
    }));
  }
  
  const totalRewards = filtered
    .filter(v => v.status === 'active')
    .reduce((sum, v) => sum + v.reward, 0);
  
  res.json({
    validations: filtered,
    totalRewards
  });
});

// POST /api/validations/:id/vote
router.post('/:id/vote', (req: Request, res: Response) => {
  const { vote, walletAddress, signature, reason } = req.body;
  const validationId = req.params.id;
  
  // Find validation
  const validation = validations.find(v => v.id === validationId);
  
  if (!validation) {
    return res.status(404).json({
      error: {
        code: 'VALIDATION_NOT_FOUND',
        message: 'Validation task not found'
      }
    });
  }
  
  // Check if validation is still active
  if (validation.status !== 'active') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_EXPIRED',
        message: 'Validation period has expired'
      }
    });
  }
  
  // Check if user already voted
  if (!userVotes[walletAddress]) {
    userVotes[walletAddress] = {};
  }
  
  if (userVotes[walletAddress][validationId]) {
    return res.status(400).json({
      error: {
        code: 'ALREADY_VOTED',
        message: 'You have already voted on this validation'
      }
    });
  }
  
  // Record vote
  userVotes[walletAddress][validationId] = vote;
  
  // Update validation counts
  if (vote === 'yes') {
    validation.votesYes++;
  } else {
    validation.votesNo++;
  }
  
  // Calculate consensus
  const totalVotes = validation.votesYes + validation.votesNo;
  const consensusPercentage = Math.round((validation.votesYes / totalVotes) * 100);
  
  // Emit WebSocket event
  io.to('validations').emit('validation:vote', {
    validationId,
    vote,
    currentConsensus: {
      yes: validation.votesYes,
      no: validation.votesNo,
      percentage: consensusPercentage
    }
  });
  
  res.json({
    success: true,
    transactionHash: '0x' + Math.random().toString(16).substr(2),
    currentConsensus: {
      yes: validation.votesYes,
      no: validation.votesNo,
      percentage: consensusPercentage
    }
  });
});

// GET /api/validators/:address
router.get('/validators/:address', (req: Request, res: Response) => {
  const address = req.params.address;
  const validatorVotes = userVotes[address] || {};
  const votedValidations = Object.keys(validatorVotes).length;
  
  // Mock validator stats
  const stats = {
    address,
    totalValidations: votedValidations,
    accuracyRate: 95,
    totalEarned: votedValidations * 2.5,
    stakedAmount: 1000,
    reputation: 85,
    recentValidations: validations
      .filter(v => validatorVotes[v.id])
      .slice(0, 5)
      .map(v => ({
        id: v.id,
        question: v.question,
        vote: validatorVotes[v.id],
        timestamp: v.submittedAt
      })),
    rank: Math.floor(Math.random() * 100) + 1
  };
  
  res.json(stats);
});

export default router;
