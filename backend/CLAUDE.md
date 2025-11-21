# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orai is a decentralized AI-verified oracle system built on 0G infrastructure, combining blockchain technology with decentralized AI inference to provide trustless, verifiable knowledge to smart contracts and end users.

## Technology Stack

- **Backend**: Fastify + TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache**: Redis 7
- **Queue**: BullMQ
- **Blockchain**: 0G Chain (EVM), ethers.js v6
- **Testing**: Vitest
- **Runtime**: Node.js 20+

## Project Commands

```bash
# Development
npm run dev           # Start development server with hot reload (tsx watch)
npm run build         # Compile TypeScript to dist/
npm start            # Run production server from dist/

# Database
npm run prisma:migrate    # Run database migrations
npm run prisma:generate   # Generate Prisma client
npm run prisma:studio     # Open Prisma Studio GUI

# Testing
npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run test:int     # Run integration tests
npm run test:e2e     # Run end-to-end tests

# Code Quality
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format check
npm run format:fix   # Prettier auto-format
```

## Architecture Overview

The backend follows a layered architecture with clear separation of concerns:

1. **Routes Layer** (`src/routes/`): HTTP endpoint definitions using Fastify
2. **Controllers Layer** (`src/controllers/`): Request handling and response formatting
3. **Services Layer** (`src/services/`): Core business logic and external integrations
4. **Repositories Layer** (`src/repositories/`): Database access using Prisma
5. **Workers Layer** (`src/workers/`): Background job processing with BullMQ

### Critical Service Integrations

#### 0G Compute Integration
The `0g-compute.service.ts` handles AI inference jobs on the decentralized GPU network. Key responsibilities:
- Submitting inference jobs with proper prompt construction
- Monitoring job status and completion
- Handling model, input, and output hashing for proof-of-inference

#### 0G Storage Integration
The `0g-storage.service.ts` manages permanent answer storage. Key responsibilities:
- Storing answer data with cryptographic proofs
- Retrieving storage hashes for blockchain verification
- Managing answer metadata and evidence

#### Blockchain Service
The `blockchain.service.ts` interfaces with 0G EVM chain. Key responsibilities:
- Monitoring QuestionSubmitted events
- Submitting answer hashes on-chain
- Managing voting periods and finalization

## Core Workflows

### Question Processing Flow
1. User submits question via API ’ stored in PostgreSQL
2. Backend triggers 0G Compute job ’ multiple GPU nodes process
3. Answer generated with proof-of-inference (model/input/output hashes)
4. Answer stored in 0G Storage ’ hash posted to smart contract
5. 24-hour voting period opens for token-weighted validation
6. Results finalized on-chain if consensus reached (>66%)

### Voting System
- Token-weighted voting with ORAI tokens
- Voters stake tokens to participate
- Correct voters share reward pool (5% of question fee)
- Incorrect voters face 2% stake slashing
- Minimum 10% quorum required for validity

## API Endpoints

Base URL: `http://localhost:3001/api` (dev) / `https://api.orai.xyz/api` (prod)

### Main Endpoints
- `POST /api/questions` - Submit new oracle question
- `GET /api/questions/:id` - Get question details and status
- `GET /api/questions` - List questions with pagination
- `GET /api/answers/:questionId` - Get answer with verification status
- `POST /api/votes` - Cast vote on answer (requires signature)
- `GET /api/votes/:questionId` - Get voting statistics
- `GET /api/user/:address` - Get user profile and stats

### Internal Endpoints
- `POST /api/answers` - Backend-only for 0G compute results (requires Bearer token)

## Environment Configuration

Required environment variables:
```bash
NODE_ENV=development|production
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/orai
REDIS_URL=redis://localhost:6379
RPC_URL=https://rpc-testnet.0g.ai
ORACLE_HUB_ADDRESS=0x...  # Deployed oracle contract
OG_COMPUTE_API_KEY=...
OG_STORAGE_API_KEY=...
BACKEND_SECRET=...  # For internal API auth
```

## Smart Contract Interface

The backend monitors and interacts with the OracleHub contract:

```solidity
// Key events to monitor
event QuestionSubmitted(bytes32 indexed questionId, address indexed requester, string question);
event AnswerReady(bytes32 indexed questionId, bytes32 storageHash);
event AnswerVerified(bytes32 indexed questionId, bool verified);
```

## Database Schema

Key Prisma models:
- `Question`: Stores question metadata and status
- `Answer`: Contains AI-generated answers with proof hashes
- `VotingStats`: Tracks voting progress and results
- `Vote`: Individual vote records
- `User`: User profiles and reputation

## Error Handling

The backend implements comprehensive error handling:
- Custom error middleware in `src/middleware/error.middleware.ts`
- Structured error responses with codes and status
- Logging via Pino logger for debugging
- Graceful degradation for external service failures

## Security Considerations

- Input validation using Zod schemas
- Rate limiting via @fastify/rate-limit
- EIP-712 signature verification for votes
- Wallet address validation for all submissions
- Protection against common vulnerabilities (XSS, SQL injection via Prisma)

## Testing Strategy

- **Unit tests**: Service and utility function testing
- **Integration tests**: API endpoint testing with mocked services
- **E2E tests**: Full flow testing including blockchain interactions
- Test files located in `tests/` directory parallel to source

## Performance Optimizations

- Redis caching for frequently accessed data
- BullMQ for async job processing
- Database indexing on submitter, status, and questionId
- Connection pooling for PostgreSQL
- Efficient pagination for list endpoints

## Deployment

The backend is containerized and deployed with:
- Docker container with Node.js 20 Alpine
- Health check endpoint at `/health`
- Graceful shutdown handling
- Environment-based configuration
- Horizontal scaling support via load balancing