import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('📊 Checking database contents...\n');

  const questions = await prisma.question.findMany({
    include: {
      answer: true,
      votes: true
    },
    orderBy: {
      timestamp: 'desc'
    }
  });

  console.log(`Total Questions: ${questions.length}\n`);

  questions.forEach((q, i) => {
    console.log(`${i + 1}. Question ID: ${q.questionId.slice(0, 20)}...`);
    console.log(`   Text: ${q.questionText.slice(0, 60)}...`);
    console.log(`   Status: ${q.status}`);
    console.log(`   Submitter: ${q.submitter.slice(0, 10)}...`);
    console.log(`   Has Answer: ${q.answer ? 'Yes' : 'No'}`);
    if (q.answer) {
      console.log(`   Answer: ${q.answer.answerText.slice(0, 60)}...`);
      console.log(`   Storage Hash: ${q.answer.storageHash.slice(0, 20)}...`);
    }
    console.log('');
  });

  const answers = await prisma.answer.count();
  const votes = await prisma.vote.count();
  const votingStats = await prisma.votingStats.count();

  console.log('📈 Summary:');
  console.log(`   Questions: ${questions.length}`);
  console.log(`   Answers: ${answers}`);
  console.log(`   Voting Stats: ${votingStats}`);
  console.log(`   Votes: ${votes}`);
}

checkDatabase()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
