import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/oracle/status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'operational',
    activeNodes: 12,
    totalQuestions: 1234,
    totalValidators: 500,
    averageResponseTime: 45,
    networkHealth: {
      '0g': true,
      aiNodes: true,
      storage: true
    }
  });
});

// GET /api/oracle/stats
router.get('/stats', (req: Request, res: Response) => {
  res.json({
    questionsAnswered: 1234,
    accuracyRate: 95,
    activeValidators: 500,
    averageResponseTime: 45,
    totalFeesCollected: 15420,
    totalRewardsDistributed: 7710,
    topCategories: [
      { category: 'DeFi', count: 345 },
      { category: 'Blockchain', count: 289 },
      { category: 'Smart Contracts', count: 198 },
      { category: 'Cryptocurrency', count: 167 },
      { category: 'Web3', count: 235 }
    ]
  });
});

// GET /api/oracle/fees
router.get('/fees', (req: Request, res: Response) => {
  res.json({
    baseFee: 10,
    priorityFee: 5,
    referenceUrlFee: 2,
    minimumStake: 1000,
    validatorRewardPercentage: 50
  });
});

export default router;
