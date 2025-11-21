# Orai Backend Specification

**Version:** 1.0  
**Framework:** Fastify + TypeScript  
**Last Updated:** November 21, 2025  
**Status:** Active Development

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [API Endpoints](#api-endpoints)
5. [0G Integration](#0g-integration)
6. [Database Schema](#database-schema)
7. [Services & Business Logic](#services--business-logic)
8. [Authentication & Security](#authentication--security)
9. [WebSocket Implementation](#websocket-implementation)
10. [Error Handling](#error-handling)
11. [Testing Strategy](#testing-strategy)
12. [Deployment](#deployment)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Fastify Server                    │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │            HTTP Routes Layer                  │ │
│  │  /questions  /answers  /votes  /user          │ │
│  └─────────────────┬─────────────────────────────┘ │
│                    │                               │
│  ┌─────────────────▼─────────────────────────────┐ │
│  │          Controllers Layer                    │ │
│  │  QuestionController  VotingController         │ │
│  └─────────────────┬─────────────────────────────┘ │
│                    │                               │
│  ┌─────────────────▼─────────────────────────────┐ │
│  │           Services Layer                      │ │
│  │  OracleService  0GService  BlockchainService  │ │
│  └───┬──────────────┬──────────────┬─────────────┘ │
│      │              │              │               │
└──────┼──────────────┼──────────────┼───────────────┘
       │              │              │
   ┌───▼────┐    ┌───▼────┐    ┌───▼────┐
   │   DB   │    │   0G   │    │  0G    │
   │Postgres│    │Compute │    │ Chain  │
   └────────┘    └────────┘    └────────┘
                      │
                 ┌────▼────┐
                 │   0G    │
                 │ Storage │
                 └─────────┘
```

### Design Principles

1. **Separation of Concerns:** Clear layer boundaries
2. **Dependency Injection:** Loose coupling between components
3. **Error Handling:** Comprehensive error management
4. **Type Safety:** Full TypeScript coverage
5. **Scalability:** Horizontal scaling support
6. **Observability:** Logging, metrics, tracing

---

## Technology Stack

### Core Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.25.0",
    "@fastify/cors": "^8.5.0",
    "@fastify/helmet": "^11.1.0",
    "@fastify/rate-limit": "^9.1.0",
    "@fastify/websocket": "^8.3.0",
    "@fastify/jwt": "^7.2.0",
    
    "ethers": "^6.9.0",
    "@0g/sdk": "^1.0.0",
    
    "pg": "^8.11.0",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    
    "redis": "^4.6.0",
    "bullmq": "^5.1.0",
    
    "pino": "^8.17.0",
    "pino-pretty": "^10.3.0",
    
    "zod": "^3.22.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "vitest": "^1.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### Infrastructure

- **Runtime:** Node.js 20+
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Message Queue:** BullMQ
- **Blockchain:** 0G Chain (EVM)
- **Storage:** 0G Storage
- **Compute:** 0G GPU Network

---

## Project Structure

```
orai-backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.ts
│   │   ├── blockchain.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   │
│   ├── controllers/            # Request handlers
│   │   ├── question.controller.ts
│   │   ├── answer.controller.ts
│   │   ├── voting.controller.ts
│   │   └── user.controller.ts
│   │
│   ├── services/               # Business logic
│   │   ├── oracle.service.ts
│   │   ├── 0g-compute.service.ts
│   │   ├── 0g-storage.service.ts
│   │   ├── blockchain.service.ts
│   │   ├── voting.service.ts
│   │   └── notification.service.ts
│   │
│   ├── repositories/           # Data access layer
│   │   ├── question.repository.ts
│   │   ├── answer.repository.ts
│   │   └── vote.repository.ts
│   │
│   ├── routes/                 # API routes
│   │   ├── index.ts
│   │   ├── question.routes.ts
│   │   ├── answer.routes.ts
│   │   ├── voting.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── middleware/             # Custom middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logging.middleware.ts
│   │
│   ├── schemas/                # Validation schemas
│   │   ├── question.schema.ts
│   │   ├── answer.schema.ts
│   │   └── voting.schema.ts
│   │
│   ├── workers/                # Background jobs
│   │   ├── answer-processor.worker.ts
│   │   ├── voting-finalizer.worker.ts
│   │   └── blockchain-monitor.worker.ts
│   │
│   ├── types/                  # TypeScript types
│   │   ├── oracle.types.ts
│   │   ├── blockchain.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── logger.ts
│   │   ├── crypto.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   │
│   ├── contracts/              # Smart contract ABIs
│   │   ├── OracleHub.json
│   │   ├── VotingModule.json
│   │   └── OraiToken.json
│   │
│   ├── app.ts                  # Fastify app setup
│   └── server.ts               # Entry point
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

---

## API Endpoints

### Base URL
```
Development: http://localhost:3001/api
Production: https://api.orai.xyz/api
```

### Question Endpoints

#### POST /api/questions
Submit a new question to the oracle.

**Request:**
```typescript
interface SubmitQuestionRequest {
  questionText: string;        // max 500 chars
  referenceUrls?: string[];    // max 5 URLs
  submitter: string;           // wallet address
}
```

**Response:**
```typescript
interface SubmitQuestionResponse {
  success: boolean;
  questionId: string;
  txHash: string;
  estimatedAnswerTime: number; // seconds
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "What is the current price of ETH?",
    "referenceUrls": ["https://coinmarketcap.com"],
    "submitter": "0x123..."
  }'
```

#### GET /api/questions/:id
Get question details.

**Response:**
```typescript
interface QuestionDetails {
  id: string;
  questionText: string;
  referenceUrls: string[];
  submitter: string;
  status: QuestionStatus;
  timestamp: number;
  feePaid: string;
  answer?: Answer;
}

enum QuestionStatus {
  PENDING = 'pending',
  COMPUTING = 'computing',
  ANSWER_AVAILABLE = 'answer_available',
  VOTING_OPEN = 'voting_open',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}
```

#### GET /api/questions
List questions with pagination and filters.

**Query Parameters:**
- `limit`: number (default: 20, max: 100)
- `offset`: number (default: 0)
- `status`: QuestionStatus
- `submitter`: address
- `sortBy`: 'timestamp' | 'votes'
- `order`: 'asc' | 'desc'

**Response:**
```typescript
interface QuestionListResponse {
  questions: QuestionDetails[];
  total: number;
  hasMore: boolean;
}
```

---

### Answer Endpoints

#### GET /api/answers/:questionId
Get answer for a question.

**Response:**
```typescript
interface Answer {
  questionId: string;
  answerText: string;
  evidenceSummary: string;
  storageHash: string;
  modelHash: string;
  inputHash: string;
  outputHash: string;
  timestamp: number;
  verified: boolean;
  votingStats: VotingStats;
}

interface VotingStats {
  votesCorrect: number;
  votesIncorrect: number;
  totalVotingPower: number;
  votingEndTime: number;
  finalized: boolean;
}
```

#### POST /api/answers (Internal)
Backend-only endpoint to submit answers from 0G compute.

**Headers:**
```
Authorization: Bearer <backend_secret>
```

**Request:**
```typescript
interface SubmitAnswerRequest {
  questionId: string;
  answerText: string;
  evidenceSummary: string;
  storageHash: string;
  modelHash: string;
  inputHash: string;
  outputHash: string;
  computeNodeId: string;
}
```

---

### Voting Endpoints

#### POST /api/votes
Cast a vote on an answer.

**Request:**
```typescript
interface CastVoteRequest {
  questionId: string;
  voter: string;
  choice: 'correct' | 'incorrect' | 'abstain';
  votingPower: number;
  signature: string; // EIP-712 signature
}
```

**Response:**
```typescript
interface CastVoteResponse {
  success: boolean;
  txHash: string;
  votingStats: VotingStats;
}
```

#### GET /api/votes/:questionId
Get voting information for a question.

**Response:**
```typescript
interface VotingInfo {
  questionId: string;
  status: 'open' | 'closed' | 'finalized';
  endTime: number;
  quorumReached: boolean;
  votingStats: VotingStats;
  userVote?: {
    choice: string;
    votingPower: number;
    timestamp: number;
  };
}
```

---

### User Endpoints

#### GET /api/user/:address
Get user profile and statistics.

**Response:**
```typescript
interface UserProfile {
  address: string;
  totalQuestions: number;
  totalVotes: number;
  reputationScore: number;
  stakedTokens: string;
  rewardsEarned: string;
  questionsSubmitted: string[];
  votingHistory: VoteRecord[];
}
```

---

## 0G Integration

### 0G Compute Service

```typescript
// src/services/0g-compute.service.ts
import { OGCompute } from '@0g/sdk';
import { logger } from '@/utils/logger';

export class ZeroGComputeService {
  private client: OGCompute;

  constructor() {
    this.client = new OGCompute({
      apiKey: process.env.OG_COMPUTE_API_KEY,
      network: process.env.OG_NETWORK || 'testnet',
    });
  }

  async submitInferenceJob(params: {
    questionText: string;
    referenceUrls?: string[];
    model: string;
  }): Promise<{ jobId: string; estimatedTime: number }> {
    try {
      const job = await this.client.createJob({
        type: 'inference',
        model: params.model,
        input: {
          prompt: this.constructPrompt(params.questionText, params.referenceUrls),
          maxTokens: 1000,
          temperature: 0.7,
        },
      });

      return {
        jobId: job.id,
        estimatedTime: job.estimatedCompletionTime,
      };
    } catch (error) {
      logger.error('Failed to submit 0G compute job:', error);
      throw new Error('Compute service unavailable');
    }
  }

  private constructPrompt(questionText: string, referenceUrls?: string[]): string {
    let prompt = `You are a knowledgeable AI oracle. Answer accurately.\n\n`;
    prompt += `Question: ${questionText}\n\n`;

    if (referenceUrls && referenceUrls.length > 0) {
      prompt += `References:\n${referenceUrls.join('\n')}\n\n`;
    }

    prompt += `Provide a clear, factual answer with supporting evidence.`;
    return prompt;
  }
}
```

---

### 0G Storage Service

```typescript
// src/services/0g-storage.service.ts
import { OGStorage } from '@0g/sdk';

export class ZeroGStorageService {
  private client: OGStorage;

  constructor() {
    this.client = new OGStorage({
      apiKey: process.env.OG_STORAGE_API_KEY,
      network: process.env.OG_NETWORK || 'testnet',
    });
  }

  async storeAnswer(answer: {
    questionId: string;
    answerText: string;
    evidenceSummary: string;
    modelHash: string;
  }): Promise<{ storageHash: string; storageUrl: string }> {
    const data = JSON.stringify(answer);
    const uploadResult = await this.client.upload({
      data: Buffer.from(data),
      metadata: { questionId: answer.questionId },
    });

    return {
      storageHash: uploadResult.hash,
      storageUrl: uploadResult.url,
    };
  }
}
```

---

## Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Question {
  id            String   @id @default(uuid())
  questionId    String   @unique
  questionText  String
  referenceUrls String[]
  submitter     String
  status        String   @default("pending")
  feePaid       String
  timestamp     DateTime @default(now())
  
  answer        Answer?
  votes         Vote[]
  
  @@index([submitter])
  @@index([status])
}

model Answer {
  id              String   @id @default(uuid())
  questionId      String   @unique
  answerText      String
  evidenceSummary String
  storageHash     String
  modelHash       String
  inputHash       String
  outputHash      String
  verified        Boolean  @default(false)
  timestamp       DateTime @default(now())
  
  question        Question @relation(fields: [questionId], references: [questionId])
  votingStats     VotingStats?
}

model VotingStats {
  id               String   @id @default(uuid())
  questionId       String   @unique
  votesCorrect     Int      @default(0)
  votesIncorrect   Int      @default(0)
  totalVotingPower String   @default("0")
  votingEndTime    DateTime
  finalized        Boolean  @default(false)
  
  answer           Answer   @relation(fields: [questionId], references: [questionId])
}

model Vote {
  id           String   @id @default(uuid())
  questionId   String
  voter        String
  choice       String
  votingPower  String
  timestamp    DateTime @default(now())
  
  question     Question @relation(fields: [questionId], references: [questionId])
  
  @@unique([questionId, voter])
}

model User {
  address         String   @id
  totalQuestions  Int      @default(0)
  totalVotes      Int      @default(0)
  reputationScore Int      @default(0)
  stakedTokens    String   @default("0")
  rewardsEarned   String   @default("0")
  createdAt       DateTime @default(now())
}
```

---

## Services & Business Logic

### Oracle Service

```typescript
// src/services/oracle.service.ts
import { PrismaClient } from '@prisma/client';
import { ZeroGComputeService } from './0g-compute.service';
import { ZeroGStorageService } from './0g-storage.service';
import { BlockchainService } from './blockchain.service';

export class OracleService {
  constructor(
    private prisma: PrismaClient,
    private computeService: ZeroGComputeService,
    private storageService: ZeroGStorageService,
    private blockchainService: BlockchainService
  ) {}

  async processQuestion(params: {
    questionId: string;
    questionText: string;
    referenceUrls?: string[];
    submitter: string;
  }): Promise<void> {
    // Store in database
    await this.prisma.question.create({
      data: {
        questionId: params.questionId,
        questionText: params.questionText,
        referenceUrls: params.referenceUrls || [],
        submitter: params.submitter,
        status: 'pending',
        feePaid: '0.12',
      },
    });

    // Submit to 0G Compute
    const job = await this.computeService.submitInferenceJob({
      questionText: params.questionText,
      referenceUrls: params.referenceUrls,
      model: 'gpt-4',
    });

    // Update status
    await this.prisma.question.update({
      where: { questionId: params.questionId },
      data: { status: 'computing' },
    });
  }
}
```

---

## Authentication & Security

### Rate Limiting

```typescript
// src/app.ts
import rateLimit from '@fastify/rate-limit';

app.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
});
```

### Input Validation

```typescript
// src/schemas/question.schema.ts
import { z } from 'zod';

export const submitQuestionSchema = z.object({
  questionText: z.string().min(10).max(500),
  referenceUrls: z.array(z.string().url()).max(5).optional(),
  submitter: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});
```

---

## Error Handling

```typescript
// src/middleware/error.middleware.ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode || 500;
  
  return reply.status(statusCode).send({
    error: {
      message: error.message,
      code: error.code,
      statusCode,
    },
  });
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/oracle.service.test.ts
import { describe, it, expect } from 'vitest';
import { OracleService } from '@/services/oracle.service';

describe('OracleService', () => {
  it('should process question successfully', async () => {
    // Test implementation
  });
});
```

---

## Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

### Environment Variables

```bash
# .env.example
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/orai
REDIS_URL=redis://localhost:6379
RPC_URL=https://rpc-testnet.0g.ai
ORACLE_HUB_ADDRESS=0x...
OG_COMPUTE_API_KEY=...
OG_STORAGE_API_KEY=...
```

---

**Document Status:** v1.0  
**Last Updated:** November 21, 2025  
**Maintainer:** Backend Team
