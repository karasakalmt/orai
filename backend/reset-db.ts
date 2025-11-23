import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

const mockQuestions = [
  {
    questionText: 'What is the current price of Ethereum in USD?',
    answer: 'The current price of Ethereum (ETH) is approximately $2,345.67 USD. This price is subject to market volatility and changes frequently based on trading activity across major exchanges.',
    evidenceSummary: 'Price data aggregated from CoinGecko, Binance, and Coinbase APIs',
    referenceUrls: ['https://www.coingecko.com/en/coins/ethereum', 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT']
  },
  {
    questionText: 'What is the total value locked (TVL) in DeFi protocols?',
    answer: 'The total value locked (TVL) across all DeFi protocols is currently $87.4 billion USD. The top protocols by TVL are: Lido ($23.1B), MakerDAO ($8.7B), and Aave ($6.2B).',
    evidenceSummary: 'TVL data sourced from DefiLlama aggregator and verified across multiple DeFi analytics platforms',
    referenceUrls: ['https://defillama.com/', 'https://www.theblock.co/data/defi-and-nfts/total-value-locked']
  },
  {
    questionText: 'How many active validators are there on the Ethereum beacon chain?',
    answer: 'There are currently 892,347 active validators on the Ethereum beacon chain. The total staked ETH is approximately 28.5 million ETH, representing about 23.7% of the total ETH supply.',
    evidenceSummary: 'Validator data retrieved from Ethereum beacon chain explorer and consensus layer APIs',
    referenceUrls: ['https://beaconcha.in/', 'https://ethereum.org/en/staking/']
  },
  {
    questionText: 'What was the highest gas price on Ethereum in the last 24 hours?',
    answer: 'The highest gas price on Ethereum in the last 24 hours was 127 Gwei, recorded at 14:32 UTC. The average gas price over the same period was 42 Gwei, with a low of 18 Gwei during off-peak hours.',
    evidenceSummary: 'Gas price data collected from Etherscan Gas Tracker and Ethereum node mempool statistics',
    referenceUrls: ['https://etherscan.io/gastracker', 'https://www.ethgasstation.info/']
  },
  {
    questionText: 'What is the current Bitcoin network hash rate?',
    answer: 'The current Bitcoin network hash rate is approximately 523 EH/s (exahashes per second). This represents a 12% increase from the previous month and indicates strong network security and miner participation.',
    evidenceSummary: 'Hash rate data sourced from blockchain.com, BTC.com, and CoinMetrics network statistics',
    referenceUrls: ['https://www.blockchain.com/charts/hash-rate', 'https://btc.com/stats/diff']
  }
];

async function resetDatabase() {
  console.log('🔄 Resetting database...\n');

  try {
    // Delete all data in reverse order of dependencies
    console.log('🗑️  Deleting all existing data...');
    await prisma.vote.deleteMany({});
    await prisma.votingStats.deleteMany({});
    await prisma.answer.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ All existing data deleted\n');

    // Seed mock questions
    console.log('🌱 Seeding mock questions and answers...\n');

    for (let i = 0; i < mockQuestions.length; i++) {
      const mock = mockQuestions[i];

      // Generate unique questionId (simulating blockchain event)
      const questionId = ethers.keccak256(ethers.toUtf8Bytes(`mock_question_${i}_${Date.now()}`));

      // Random submitter address
      const submitter = ethers.Wallet.createRandom().address;

      // Random fee between 0.01 and 0.1 ETH
      const fee = (Math.random() * 0.09 + 0.01).toFixed(4);

      // Create question
      const question = await prisma.question.create({
        data: {
          questionId,
          questionText: mock.questionText,
          referenceUrls: mock.referenceUrls,
          submitter,
          status: 'answered',
          feePaid: ethers.parseEther(fee).toString(),
          timestamp: new Date(Date.now() - Math.random() * 86400000) // Random time in last 24h
        }
      });

      console.log(`✅ Question ${i + 1}: ${mock.questionText.slice(0, 60)}...`);

      // Generate mock hashes for proof of inference
      const modelHash = ethers.keccak256(ethers.toUtf8Bytes('phala/gpt-oss-120b'));
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes(mock.questionText));
      const outputHash = ethers.keccak256(ethers.toUtf8Bytes(mock.answer));
      const storageHash = ethers.keccak256(ethers.toUtf8Bytes(`${questionId}_${outputHash}`));

      // Create answer
      await prisma.answer.create({
        data: {
          questionId,
          answerText: mock.answer,
          evidenceSummary: mock.evidenceSummary,
          storageHash,
          modelHash,
          inputHash,
          outputHash,
          verified: Math.random() > 0.3, // 70% verified
          timestamp: new Date(question.timestamp.getTime() + 3600000) // 1 hour after question
        }
      });

      // Create voting stats
      const votesCorrect = Math.floor(Math.random() * 50) + 10;
      const votesIncorrect = Math.floor(Math.random() * 10);
      const totalVotingPower = ethers.parseEther((votesCorrect * 100 + votesIncorrect * 100).toString()).toString();

      await prisma.votingStats.create({
        data: {
          questionId,
          votesCorrect,
          votesIncorrect,
          totalVotingPower,
          votingEndTime: new Date(question.timestamp.getTime() + 86400000), // 24h voting period
          finalized: true
        }
      });
    }

    console.log('\n🎉 Database reset complete! 5 mock questions with answers seeded.');
    console.log('\n📊 Database contents:');
    console.log(`   Questions: ${await prisma.question.count()}`);
    console.log(`   Answers: ${await prisma.answer.count()}`);
    console.log(`   Voting Stats: ${await prisma.votingStats.count()}`);
    console.log(`   Votes: ${await prisma.vote.count()}`);
    console.log(`   Users: ${await prisma.user.count()}`);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
